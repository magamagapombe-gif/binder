'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesListPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.getMatches()
      .then(d => setMatches(d || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = matches
    .filter(m => m.partner?.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (b.unread_count > 0 && a.unread_count === 0) return 1;
      const aT = a.last_message?.created_at || a.created_at;
      const bT = b.last_message?.created_at || b.created_at;
      return new Date(bT).getTime() - new Date(aT).getTime();
    });

  const totalUnread = matches.reduce((s, m) => s + (m.unread_count || 0), 0);

  return (
    <div className="min-h-dvh pb-24" style={{ background: '#0D0D0F' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: 'rgba(13,13,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <AnimatePresence mode="wait">
          {searching ? (
            <motion.div key="search-bar"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 rounded-2xl h-11"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Search size={15} className="text-white/30 flex-shrink-0" />
                <input autoFocus className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                  style={{ caretColor: '#FF4458' }}
                  placeholder="Search conversations…"
                  value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={() => { setSearching(false); setSearch(''); }}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X size={16} className="text-white/60" />
              </button>
            </motion.div>
          ) : (
            <motion.div key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Messages</h1>
                {totalUnread > 0 && (
                  <p className="text-xs text-white/30 mt-0.5">{totalUnread} unread</p>
                )}
              </div>
              <button onClick={() => setSearching(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Search size={17} className="text-white/50" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="px-5 space-y-3 pt-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-white/8 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-white/8 rounded-full w-28" />
                <div className="h-3 bg-white/5 rounded-full w-44" />
              </div>
              <div className="h-2.5 bg-white/5 rounded-full w-10" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-28 gap-3 px-8 text-center">
          <span className="text-5xl">{search ? '🔍' : '💬'}</span>
          <p className="font-semibold text-white/50">
            {search ? 'No results found' : 'No conversations yet'}
          </p>
          <p className="text-white/25 text-sm">
            {search ? `No matches for "${search}"` : 'Match with someone to start chatting'}
          </p>
        </motion.div>
      ) : (
        <div className="px-4">
          {filtered.map((m, i) => {
            const hasUnread = m.unread_count > 0;
            const lastMsg = m.last_message;
            const timeAgo = lastMsg
              ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false })
              : formatDistanceToNow(new Date(m.created_at), { addSuffix: false });

            return (
              <motion.button key={m.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/messages/${m.id}`)}
                className="w-full flex items-center gap-3 py-3.5 text-left transition-all active:scale-[0.98]">

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img src={m.partner?.photos?.[0] || '/placeholder.jpg'}
                    className="w-14 h-14 rounded-full object-cover"
                    style={{ border: hasUnread ? '2px solid #FF4458' : '2px solid transparent' }}
                    alt="" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400"
                    style={{ border: '2px solid #0D0D0F' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className={`font-semibold text-sm truncate ${hasUnread ? 'text-white' : 'text-white/75'}`}
                      style={{ fontFamily: 'var(--font-display)' }}>
                      {m.partner?.name}
                    </p>
                    <p className={`text-[11px] flex-shrink-0 ${hasUnread ? 'text-[#FF4458]' : 'text-white/20'}`}>
                      {timeAgo}
                    </p>
                  </div>
                  <p className={`text-sm truncate ${hasUnread ? 'text-white/65 font-medium' : 'text-white/28'}`}>
                    {lastMsg
                      ? lastMsg.type === 'image' ? '📷 Photo' : lastMsg.content
                      : 'Start a conversation'}
                  </p>
                </div>

                {/* Unread badge */}
                {hasUnread && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#FF4458' }}>
                    <span className="text-[9px] font-bold text-white">{m.unread_count > 9 ? '9+' : m.unread_count}</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
