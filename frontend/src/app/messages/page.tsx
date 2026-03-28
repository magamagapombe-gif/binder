'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';
import { formatDistanceToNow } from 'date-fns';

function Skeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-24" />
        <div className="h-3 bg-white/5 rounded w-40" />
      </div>
    </div>
  );
}

export default function MessagesListPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getMatches()
      .then(d => setMatches(d || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = matches.filter(m =>
    m.partner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Messages</h1>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="input pl-10 py-3 text-sm"
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-24 space-y-3 px-8">
          <span className="text-6xl">💬</span>
          <p className="text-white/50 font-medium">No conversations yet</p>
          <p className="text-white/25 text-sm">Match with someone to start chatting</p>
        </motion.div>
      ) : (
        <div className="divide-y divide-white/5">
          {sorted.map((m, i) => {
            const hasUnread = m.unread_count > 0;
            const lastMsg = m.last_message;
            const timeAgo = lastMsg
              ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true })
              : formatDistanceToNow(new Date(m.created_at), { addSuffix: true });

            return (
              <motion.button key={m.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/messages/${m.id}`)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 active:bg-white/8 transition-colors text-left">
                <div className="relative flex-shrink-0">
                  <img src={m.partner?.photos?.[0] || '/placeholder.jpg'}
                    className="w-14 h-14 rounded-2xl object-cover" alt="" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0D0D0F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`font-semibold text-sm ${hasUnread ? 'text-white' : 'text-white/75'}`}
                      style={{ fontFamily: 'var(--font-display)' }}>
                      {m.partner?.name}
                    </p>
                    <p className="text-white/25 text-xs">{timeAgo}</p>
                  </div>
                  <p className={`text-sm truncate ${hasUnread ? 'text-white/70' : 'text-white/30'}`}>
                    {lastMsg
                      ? lastMsg.type === 'image' ? '📷 Photo' : lastMsg.content
                      : '💬 Say hello!'}
                  </p>
                </div>
                {hasUnread && (
                  <div className="w-5 h-5 rounded-full bg-[#FF4458] flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-white">{m.unread_count}</span>
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
