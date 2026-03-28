'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Phone, Video, Image as ImageIcon,
  Check, CheckCheck, MoreVertical, UserX, Flag, X, Smile,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

function formatMsgTime(date: string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
  return format(d, 'MMM d, HH:mm');
}

// ── Bubble ────────────────────────────────────────────────────────────────────
function MessageBubble({ m, isMe, showAvatar, avatar }: { m: any; isMe: boolean; showAvatar: boolean; avatar?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar placeholder (keeps spacing) */}
      <div className="w-7 flex-shrink-0">
        {!isMe && showAvatar && avatar && (
          <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
        )}
      </div>

      <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
        {m.type === 'image' ? (
          <div className={`rounded-2xl overflow-hidden ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}
            style={{ border: '2px solid rgba(255,255,255,0.06)' }}>
            <img src={m.content} alt="img" className="max-w-full max-h-64 object-cover block" />
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed text-white ${isMe ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}
            style={isMe
              ? { background: 'linear-gradient(135deg,#FF4458 0%,#FF7070 100%)', boxShadow: '0 2px 12px rgba(255,68,88,0.3)' }
              : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.07)' }
            }
          >
            {m.content}
          </div>
        )}

        {/* Timestamp + status */}
        <div className={`flex items-center gap-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-white/20">{formatMsgTime(m.created_at)}</span>
          {isMe && (
            m.read
              ? <CheckCheck size={11} className="text-[#FF4458]" />
              : m.id?.startsWith('opt-')
                ? <Check size={11} className="text-white/20" />
                : <CheckCheck size={11} className="text-white/30" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingIndicator({ avatar }: { avatar?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }} className="flex items-end gap-2">
      <div className="w-7 flex-shrink-0">
        {avatar && <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />}
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Date divider ──────────────────────────────────────────────────────────────
function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-5">
      <span className="text-[11px] text-white/20 px-3 py-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {label}
      </span>
    </div>
  );
}

// ── Actions sheet ─────────────────────────────────────────────────────────────
function ActionsSheet({ partnerName, onUnmatch, onBlock, onReport, onClose }: {
  partnerName: string; onUnmatch: () => void; onBlock: () => void; onReport: () => void; onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 42 }}
        className="w-full max-w-[430px] rounded-t-3xl p-6 pb-10"
        style={{ background: '#151519', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-6" />
        <p className="text-white/30 text-xs text-center mb-5 uppercase tracking-widest">{partnerName}</p>
        <div className="space-y-2">
          {[
            { icon: Flag, label: `Report ${partnerName}`, sub: 'Something feels off', color: '#F6C90E', bg: 'rgba(246,201,14,0.1)', action: onReport },
            { icon: UserX, label: `Block ${partnerName}`, sub: 'They won't see you', color: '#FB923C', bg: 'rgba(251,146,60,0.1)', action: onBlock },
            { icon: X, label: 'Unmatch', sub: 'Remove match & messages', color: '#F87171', bg: 'rgba(248,113,113,0.1)', action: onUnmatch, danger: true },
          ].map(({ icon: Icon, label, sub, color, bg, action, danger }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors hover:brightness-110"
              style={{ background: danger ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.04)', border: `1px solid ${danger ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: danger ? color : 'white' }}>{label}</p>
                <p className="text-white/25 text-xs mt-0.5">{sub}</p>
              </div>
            </button>
          ))}
        </div>
        <button className="btn-secondary mt-4" onClick={onClose}>Cancel</button>
      </motion.div>
    </motion.div>
  );
}

// ── Report sheet ──────────────────────────────────────────────────────────────
function ReportSheet({ partnerName, onClose, onSubmit }: { partnerName: string; onClose: () => void; onSubmit: (r: string) => void }) {
  const reasons = ['Fake profile', 'Inappropriate photos', 'Harassment', 'Spam or scam', 'Underage', 'Other'];
  const [selected, setSelected] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 42 }}
        className="w-full max-w-[430px] rounded-t-3xl p-6 pb-10"
        style={{ background: '#151519', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-6" />
        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Report {partnerName}</h2>
        <p className="text-white/30 text-sm mb-5">Your report is anonymous.</p>
        <div className="space-y-2 mb-6">
          {reasons.map(r => (
            <button key={r} onClick={() => setSelected(r)}
              className="w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all"
              style={{
                border: `1px solid ${selected === r ? '#FF4458' : 'rgba(255,255,255,0.07)'}`,
                background: selected === r ? 'rgba(255,68,88,0.1)' : 'rgba(255,255,255,0.03)',
                color: selected === r ? 'white' : 'rgba(255,255,255,0.55)',
              }}>
              {r}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={!selected} onClick={() => onSubmit(selected)}>Submit Report</button>
        <button className="btn-secondary mt-2" onClick={onClose}>Cancel</button>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const { user, profile } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [partner, setPartner] = useState<any>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);
  const typingSent = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { send } = useWebSocket((msg) => {
    if (msg.type === 'message' && msg.data.match_id === matchId) {
      setMessages(prev => {
        if (msg.data.sender_id === user?.id) {
          const idx = prev.findIndex(m => m.id?.startsWith('opt-') && m.content === msg.data.content);
          if (idx !== -1) { const next = [...prev]; next[idx] = msg.data; return next; }
        }
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
    Promise.all([api.getMessages(matchId), api.getMatches()])
      .then(([msgs, matches]) => {
        setMessages(msgs || []);
        const m = matches?.find((x: any) => x.id === matchId);
        if (m) { setPartner(m.partner); setMatchData(m); }
        api.markRead(matchId).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 10 ? 'smooth' : 'auto' });
  }, [messages, typing]);

  function handleSend() {
    if (!text.trim()) return;
    const optimistic = {
      id: `opt-${Date.now()}`,
      match_id: matchId, sender_id: user?.id,
      content: text.trim(), type: 'text',
      read: false, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    send({ type: 'message', match_id: matchId, content: text.trim() });
    setText('');
  }

  function handleTextChange(val: string) {
    setText(val);
    // Throttle typing events to once per 2s
    if (!typingSent.current) {
      send({ type: 'typing', match_id: matchId });
      typingSent.current = setTimeout(() => { typingSent.current = null; }, 2000);
    }
  }

  async function handleUnmatch() {
    try { await api.unmatch(matchId); toast.success('Unmatched'); router.replace('/matches'); }
    catch (e: any) { toast.error(e.message); }
  }

  async function handleBlock() {
    if (!matchData) return;
    const pid = matchData.user1_id === user?.id ? matchData.user2_id : matchData.user1_id;
    try { await api.blockUser(pid); toast.success(`${partner?.name} blocked`); router.replace('/matches'); }
    catch (e: any) { toast.error(e.message); }
  }

  async function handleReport(reason: string) {
    if (!matchData) return;
    const pid = matchData.user1_id === user?.id ? matchData.user2_id : matchData.user1_id;
    try {
      await api.reportUser(pid, reason);
      setShowReport(false); setShowActions(false);
      toast.success('Report submitted 🙏');
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleImageSend(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await api.sendMessage(matchId, ev.target?.result as string, 'image');
      const msgs = await api.getMessages(matchId);
      setMessages(msgs);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function initiateCall(isVideo: boolean) {
    const roomId = matchId; // use matchId as stable room name
    const photo = encodeURIComponent(partner?.photos?.[0] || '');
    const name = encodeURIComponent(partner?.name || 'Match');
    router.push(`/calls/${roomId}?name=${name}&photo=${photo}&video=${isVideo}&match_id=${matchId}&caller=true`);
  }

  // Group by date
  const grouped: { date: string; messages: any[] }[] = [];
  messages.forEach(m => {
    const d = new Date(m.created_at);
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d');
    const last = grouped[grouped.length - 1];
    if (last && last.date === label) last.messages.push(m);
    else grouped.push({ date: label, messages: [m] });
  });

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#0D0D0F' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
        style={{ background: 'rgba(13,13,15,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center -ml-1"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ArrowLeft size={18} className="text-white" />
        </motion.button>

        {loading ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-white/10 rounded w-24 animate-pulse" />
              <div className="h-2.5 bg-white/5 rounded w-14 animate-pulse" />
            </div>
          </div>
        ) : partner && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <img src={partner.photos?.[0] || '/placeholder.jpg'}
                className="w-10 h-10 rounded-full object-cover" alt="" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400"
                style={{ border: '2px solid #0D0D0F' }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate"
                style={{ fontFamily: 'var(--font-display)' }}>
                {partner.name}
              </p>
              <p className="text-[11px] text-emerald-400">Active now</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => initiateCall(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Phone size={17} className="text-white/70" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => initiateCall(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Video size={17} className="text-white/70" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => setShowActions(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <MoreVertical size={17} className="text-white/70" />
          </motion.button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-0.5">
        {loading ? (
          <div className="space-y-3 pt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} gap-2`}>
                {i % 2 !== 0 && <div className="w-7 h-7 rounded-full bg-white/8 animate-pulse flex-shrink-0" />}
                <div className={`h-9 rounded-2xl animate-pulse ${i % 2 === 0 ? 'w-36 bg-[#FF4458]/20' : 'w-44 bg-white/8'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4">
            {partner?.photos?.[0] && (
              <img src={partner.photos[0]} className="w-20 h-20 rounded-2xl object-cover shadow-xl" alt="" />
            )}
            <div className="text-center">
              <p className="font-semibold text-white/70">{partner?.name}</p>
              <p className="text-white/25 text-sm mt-1">You matched! Say something 👋</p>
            </div>
            {/* Quick starter messages */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['Hey! 👋', 'How\'s it going?', 'Nice to meet you!'].map(starter => (
                <button key={starter}
                  onClick={() => { setText(starter); inputRef.current?.focus(); }}
                  className="px-4 py-2 rounded-full text-sm text-white/60 transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {starter}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <DateDivider label={group.date} />
              <div className="space-y-1">
                {group.messages.map((m, i) => {
                  const isMe = m.sender_id === user?.id;
                  const next = group.messages[i + 1];
                  const showAvatar = !isMe && (!next || next.sender_id !== m.sender_id);
                  return (
                    <MessageBubble
                      key={m.id || i}
                      m={m}
                      isMe={isMe}
                      showAvatar={showAvatar}
                      avatar={partner?.photos?.[0]}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        <AnimatePresence>
          {typing && <TypingIndicator avatar={partner?.photos?.[0]} />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20 px-3 py-3"
        style={{ background: 'rgba(13,13,15,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSend} />

        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => fileRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ImageIcon size={18} className="text-white/40" />
          </motion.button>

          <div className="flex-1 flex items-center rounded-2xl px-4 gap-2"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '44px' }}>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25 py-2.5"
              style={{ caretColor: '#FF4458' }}
              placeholder="Message…"
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
          </div>

          <AnimatePresence mode="wait">
            {text.trim() ? (
              <motion.button key="send"
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                whileTap={{ scale: 0.85 }}
                onClick={handleSend}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#FF4458,#FF7070)', boxShadow: '0 4px 16px rgba(255,68,88,0.4)' }}>
                <Send size={17} className="text-white" style={{ transform: 'translateX(1px)' }} />
              </motion.button>
            ) : (
              <motion.button key="emoji"
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Smile size={18} className="text-white/40" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Sheets ── */}
      <AnimatePresence>
        {showActions && (
          <ActionsSheet
            partnerName={partner?.name || 'this person'}
            onUnmatch={handleUnmatch}
            onBlock={handleBlock}
            onReport={() => { setShowActions(false); setShowReport(true); }}
            onClose={() => setShowActions(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReport && (
          <ReportSheet
            partnerName={partner?.name || 'this person'}
            onClose={() => setShowReport(false)}
            onSubmit={handleReport}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
