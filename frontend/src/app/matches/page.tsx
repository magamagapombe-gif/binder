'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';
import { formatDistanceToNow } from 'date-fns';

function MatchSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded-lg w-28" />
        <div className="h-3 bg-white/5 rounded-lg w-40" />
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/5" />
    </div>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMatches()
      .then(data => setMatches(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Sort: matches with unread first, then by last message time
  const sorted = [...matches].sort((a, b) => {
    if (a.unread_count > 0 && b.unread_count === 0) return -1;
    if (b.unread_count > 0 && a.unread_count === 0) return 1;
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Matches</h1>
        <p className="text-white/30 text-sm mt-1">
          {loading ? 'Loading…' : `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`}
        </p>
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3].map(i => <MatchSkeleton key={i} />)}
        </div>
      ) : matches.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 space-y-4 px-8">
          <span className="text-7xl">💝</span>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>No matches yet</h2>
          <p className="text-white/40 text-sm leading-relaxed">Keep swiping! Your person is out there 🌍</p>
          <button className="btn-primary" onClick={() => router.push('/discover')}>
            <span className="flex items-center justify-center gap-2"><Flame size={18} /> Start Swiping</span>
          </button>
        </motion.div>
      ) : (
        <div className="px-5 space-y-2">
          <AnimatePresence>
            {sorted.map((m, i) => {
              const lastMsg = m.last_message;
              const hasUnread = m.unread_count > 0;
              const timeAgo = lastMsg
                ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true })
                : formatDistanceToNow(new Date(m.created_at), { addSuffix: true });

              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${hasUnread ? 'bg-white/8 border-[#FF4458]/20' : 'bg-white/5 border-white/5'}`}>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0" onClick={() => router.push(`/messages/${m.id}`)}>
                    <img
                      src={m.partner?.photos?.[0] || '/placeholder.jpg'}
                      alt={m.partner?.name}
                      className="w-16 h-16 rounded-2xl object-cover cursor-pointer"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#0D0D0F]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/messages/${m.id}`)}>
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold text-base ${hasUnread ? 'text-white' : 'text-white/80'}`}
                        style={{ fontFamily: 'var(--font-display)' }}>
                        {m.partner?.name}, {m.partner?.age}
                      </p>
                      <p className="text-white/25 text-xs ml-2 flex-shrink-0">{timeAgo}</p>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${hasUnread ? 'text-white/70 font-medium' : 'text-white/35'}`}>
                      {lastMsg
                        ? lastMsg.type === 'image' ? '📷 Photo' : lastMsg.content
                        : '💬 Say hello!'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasUnread && (
                      <div className="w-5 h-5 rounded-full bg-[#FF4458] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{m.unread_count}</span>
                      </div>
                    )}
                    <button onClick={() => router.push(`/messages/${m.id}`)}
                      className="w-10 h-10 rounded-xl bg-[#FF4458]/10 border border-[#FF4458]/20 flex items-center justify-center">
                      <MessageCircle size={18} className="text-[#FF4458]" />
                    </button>
                    <button onClick={() => router.push(`/calls/${m.id}?name=${m.partner?.name}`)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Phone size={18} className="text-white/50" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
