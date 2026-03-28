'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Phone, Video, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format } from 'date-fns';

export default function MessagesPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [partner, setPartner] = useState<any>(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);

  const { send } = useWebSocket((msg) => {
    if (msg.type === 'message' && msg.data.match_id === matchId) {
      setMessages(prev => [...prev, msg.data]);
    }
    if (msg.type === 'typing') { setTyping(true); clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => setTyping(false), 2000); }
  });

  useEffect(() => {
    api.getMessages(matchId).then(setMessages);
    api.getMatches().then(matches => {
      const m = matches.find((x: any) => x.id === matchId);
      if (m) setPartner(m.partner);
    });
    api.markRead(matchId);
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  function handleSend() {
    if (!text.trim()) return;
    send({ type: 'message', match_id: matchId, content: text });
    setText('');
  }

  function handleTyping() { send({ type: 'typing', match_id: matchId }); }

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

  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0D0D0F]/95 backdrop-blur sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} />
        </button>
        {partner && (
          <>
            <img src={partner.photos?.[0] || '/placeholder.jpg'} className="w-10 h-10 rounded-xl object-cover" alt="" />
            <div className="flex-1">
              <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{partner.name}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </>
        )}
        <button onClick={() => router.push(`/calls/${matchId}?name=${partner?.name}&video=false`)} className="p-2">
          <Phone size={20} className="text-white/60" />
        </button>
        <button onClick={() => router.push(`/calls/${matchId}?name=${partner?.name}&video=true`)} className="p-2">
          <Video size={20} className="text-white/60" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-24">
        {messages.map((m, i) => {
          const isMe = m.sender_id === user?.id;
          return (
            <motion.div key={m.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMe ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-white/8 text-white'}`}
                style={isMe ? { background: 'linear-gradient(135deg, #FF4458, #FF6B6B)' } : { background: 'rgba(255,255,255,0.08)' }}>
                {m.type === 'image' ? (
                  <img src={m.content} alt="img" className="max-w-full rounded-xl" />
                ) : (
                  <p className="text-sm leading-relaxed">{m.content}</p>
                )}
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-white/30'} text-right`}>
                  {format(new Date(m.created_at), 'HH:mm')}
                </p>
              </div>
            </motion.div>
          );
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white/8 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
              {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex items-end gap-2 px-4 py-3 border-t border-white/5 bg-[#0D0D0F]/95 backdrop-blur">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
        <button onClick={() => fileRef.current?.click()} className="p-3 text-white/40 hover:text-white/60">
          <ImageIcon size={22} />
        </button>
        <input className="input flex-1 py-3 text-base" placeholder="Message…" value={text}
          onChange={e => { setText(e.target.value); handleTyping(); }}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
        <button onClick={handleSend} disabled={!text.trim()}
          className="p-3 rounded-xl disabled:opacity-30 transition-opacity"
          style={{ background: text.trim() ? 'linear-gradient(135deg, #FF4458, #FF6B6B)' : 'rgba(255,255,255,0.1)' }}>
          <Send size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
}
