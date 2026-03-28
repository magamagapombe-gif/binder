'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Phone, Video, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format, isToday, isYesterday } from 'date-fns';

function formatMsgTime(date: string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
  return format(d, 'MMM d, HH:mm');
}

function MessageBubble({ m, isMe }: { m: any; isMe: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          style={isMe
            ? { background: 'linear-gradient(135deg, #FF4458, #FF6B6B)' }
            : { background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.06)' }
          }>
          {m.type === 'image' ? (
            <img src={m.content} alt="img" className="max-w-full rounded-xl max-h-64 object-cover" />
          ) : (
            <p className="text-sm leading-relaxed text-white">{m.content}</p>
          )}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-white/25">{formatMsgTime(m.created_at)}</span>
          {isMe && (m.read
            ? <CheckCheck size={12} className="text-[#FF4458]" />
            : <Check size={12} className="text-white/30" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5"
        style={{ background: 'rgba(255,255,255,0.09)' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-white/40"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [partner, setPartner] = useState<any>(null);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { send } = useWebSocket((msg) => {
    if (msg.type === 'message' && msg.data.match_id === matchId) {
      setMessages(prev => {
        // avoid duplicate
        if (prev.find(m => m.id === msg.data.id)) return prev;
        return [...prev, msg.data];
      });
      api.markRead(matchId).catch(() => {});
    }
    if (msg.type === 'typing') {
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 2500);
    }
  });

  useEffect(() => {
    Promise.all([
      api.getMessages(matchId),
      api.getMatches(),
    ]).then(([msgs, matches]) => {
      setMessages(msgs || []);
      const m = matches?.find((x: any) => x.id === matchId);
      if (m) setPartner(m.partner);
      api.markRead(matchId).catch(() => {});
    }).finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 10 ? 'smooth' : 'auto' });
  }, [messages, typing]);

  function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    const optimistic = {
      id: `opt-${Date.now()}`,
      match_id: matchId,
      sender_id: user?.id,
      content: text.trim(),
      type: 'text',
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    send({ type: 'message', match_id: matchId, content: text.trim() });
    setText('');
    setSending(false);
  }

  function handleTyping() {
    send({ type: 'typing', match_id: matchId });
  }

  async function handleImageSend(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      await api.sendMessage(matchId, base64, 'image');
      const msgs = await api.getMessages(matchId);
      setMessages(msgs);
    };
    reader.readAsDataURL(file);
  }

  // Group messages by date
  const grouped: { date: string; messages: any[] }[] = [];
  messages.forEach(m => {
    const d = new Date(m.created_at);
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d');
    const last = grouped[grouped.length - 1];
    if (last && last.date === label) last.messages.push(m);
    else grouped.push({ date: label, messages: [m] });
  });

  return (
    <div className="min-h-dvh flex flex-col bg-[#0D0D0F]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0D0D0F]/95 backdrop-blur sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        {loading ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-white/10 rounded w-20 animate-pulse" />
              <div className="h-2.5 bg-white/5 rounded w-12 animate-pulse" />
            </div>
          </div>
        ) : partner && (
          <>
            <img src={partner.photos?.[0] || '/placeholder.jpg'}
              className="w-10 h-10 rounded-xl object-cover" alt="" />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>{partner.name}</p>
              <p className="text-xs text-green-400">Active now</p>
            </div>
          </>
        )}
        <button onClick={() => router.push(`/calls/${matchId}?name=${partner?.name}&video=false`)}
          className="p-2 active:scale-90 transition-transform">
          <Phone size={20} className="text-white/50" />
        </button>
        <button onClick={() => router.push(`/calls/${matchId}?name=${partner?.name}&video=true`)}
          className="p-2 active:scale-90 transition-transform">
          <Video size={20} className="text-white/50" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 pb-24">
        {loading ? (
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-10 rounded-2xl animate-pulse bg-white/8 ${i % 2 === 0 ? 'w-40' : 'w-48'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 space-y-3">
            <img src={partner?.photos?.[0]} className="w-20 h-20 rounded-2xl object-cover mx-auto" alt="" />
            <p className="text-white/60 font-medium">{partner?.name}</p>
            <p className="text-white/25 text-sm">Say something nice 👋</p>
          </motion.div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-white/25 text-xs bg-white/5 px-3 py-1 rounded-full">{group.date}</span>
              </div>
              <div className="space-y-1">
                {group.messages.map((m, i) => (
                  <MessageBubble key={m.id || i} m={m} isMe={m.sender_id === user?.id} />
                ))}
              </div>
            </div>
          ))
        )}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex items-end gap-2 px-3 py-3 border-t border-white/5 bg-[#0D0D0F]/98 backdrop-blur">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
        <button onClick={() => fileRef.current?.click()}
          className="p-3 text-white/30 hover:text-white/60 transition-colors active:scale-90 flex-shrink-0">
          <ImageIcon size={22} />
        </button>
        <input ref={inputRef}
          className="flex-1 bg-white/6 border border-white/8 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#FF4458]/50 transition-colors placeholder:text-white/25"
          placeholder="Message…" value={text}
          onChange={e => { setText(e.target.value); handleTyping(); }}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-3 rounded-xl transition-all flex-shrink-0 disabled:opacity-25"
          style={{ background: text.trim() ? 'linear-gradient(135deg, #FF4458, #FF6B6B)' : 'rgba(255,255,255,0.06)' }}>
          <Send size={20} className="text-white" />
        </motion.button>
      </div>
    </div>
  );
}
