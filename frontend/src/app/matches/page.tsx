'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone, Flame, Heart, Star, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'matches' | 'likes';

export default function MatchesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('matches');
  const [matches, setMatches] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likesLoading, setLikesLoading] = useState(true);
  const [selectedLike, setSelectedLike] = useState<any>(null);

  useEffect(() => {
    api.getMatches()
      .then(d => setMatches(d || []))
      .catch(console.error)
      .finally(() => setLoading(false));
    api.getLikes()
      .then(d => setLikes(d || []))
      .catch(console.error)
      .finally(() => setLikesLoading(false));
  }, []);

  const sorted = [...matches].sort((a, b) => {
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
      <div className="px-5 pt-12 pb-0 sticky top-0 z-10"
        style={{ background: 'rgba(13,13,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <h1 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Matches
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-0"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {([
            { id: 'matches', label: 'Matches', count: totalUnread },
            { id: 'likes', label: 'Liked You', count: likes.length },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={tab === t.id
                ? { background: '#FF4458', color: 'white' }
                : { color: 'rgba(255,255,255,0.4)' }}>
              {t.label}
              {t.count > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                  style={tab === t.id
                    ? { background: 'rgba(255,255,255,0.25)', color: 'white' }
                    : { background: '#FF4458', color: 'white' }}>
                  {t.count > 9 ? '9+' : t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Matches tab ── */}
        {tab === 'matches' && (
          <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pt-4">
            {loading ? (
              <div className="px-5 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-14 h-14 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-white/10 rounded-full w-24" />
                      <div className="h-3 bg-white/5 rounded-full w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 px-8 space-y-4">
                <span className="text-6xl">💝</span>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>No matches yet</h2>
                <p className="text-white/35 text-sm">Keep swiping — your person is out there 🌍</p>
                <button className="btn-primary" onClick={() => router.push('/discover')}>
                  <span className="flex items-center justify-center gap-2"><Flame size={17} /> Start Swiping</span>
                </button>
              </motion.div>
            ) : (
              <div className="px-4 space-y-1.5">
                {sorted.map((m, i) => {
                  const lastMsg = m.last_message;
                  const hasUnread = m.unread_count > 0;
                  const timeAgo = lastMsg
                    ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false })
                    : formatDistanceToNow(new Date(m.created_at), { addSuffix: false });

                  return (
                    <motion.div key={m.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-[0.98]"
                      style={{
                        background: hasUnread ? 'rgba(255,68,88,0.06)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${hasUnread ? 'rgba(255,68,88,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      }}>

                      <div className="relative flex-shrink-0 cursor-pointer"
                        onClick={() => router.push(`/messages/${m.id}`)}>
                        <img src={m.partner?.photos?.[0] || '/placeholder.jpg'}
                          alt={m.partner?.name}
                          className="w-14 h-14 rounded-full object-cover"
                          style={{ border: hasUnread ? '2px solid #FF4458' : '2px solid transparent' }} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400"
                          style={{ border: '2px solid #0D0D0F' }} />
                      </div>

                      <div className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.push(`/messages/${m.id}`)}>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`font-semibold text-sm ${hasUnread ? 'text-white' : 'text-white/75'}`}
                            style={{ fontFamily: 'var(--font-display)' }}>
                            {m.partner?.name}{m.partner?.age ? `, ${m.partner.age}` : ''}
                          </p>
                          <p className={`text-[11px] flex-shrink-0 ${hasUnread ? 'text-[#FF4458]' : 'text-white/20'}`}>
                            {timeAgo}
                          </p>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-white/60 font-medium' : 'text-white/28'}`}>
                          {lastMsg
                            ? lastMsg.type === 'image' ? '📷 Photo' : lastMsg.content
                            : '💬 Say hello!'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hasUnread && (
                          <div className="w-5 h-5 rounded-full bg-[#FF4458] flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white">{m.unread_count}</span>
                          </div>
                        )}
                        <button onClick={() => router.push(`/messages/${m.id}`)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(255,68,88,0.1)', border: '1px solid rgba(255,68,88,0.2)' }}>
                          <MessageCircle size={16} className="text-[#FF4458]" />
                        </button>
                        <button onClick={() => router.push(`/calls/${m.id}?name=${m.partner?.name}&photo=${encodeURIComponent(m.partner?.photos?.[0]||'')}&match_id=${m.id}&caller=true&video=false`)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <Phone size={15} className="text-white/40" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Liked You tab ── */}
        {tab === 'likes' && (
          <motion.div key="likes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pt-4">
            {likesLoading ? (
              <div className="px-5 grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[3/4] rounded-2xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                ))}
              </div>
            ) : likes.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 space-y-4 px-8">
                <span className="text-6xl">🫶</span>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>No likes yet</h2>
                <p className="text-white/35 text-sm leading-relaxed">
                  People who like you show up here — 100% free.
                </p>
                <button className="btn-primary" onClick={() => router.push('/discover')}>
                  <span className="flex items-center justify-center gap-2"><Flame size={17} /> Keep Swiping</span>
                </button>
              </motion.div>
            ) : (
              <div className="px-4">
                <p className="text-white/25 text-xs mb-3">
                  {likes.length} {likes.length === 1 ? 'person' : 'people'} liked you · swipe right to match
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {likes.map((p, i) => (
                    <motion.div key={p.user_id}
                      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
                      onClick={() => setSelectedLike(p)}>
                      <img src={p.photos?.[0] || '/placeholder.jpg'} alt={p.name}
                        className="w-full h-full object-cover" />
                      <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />

                      {p.direction === 'super_like' && (
                        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                          <Star size={13} className="text-black fill-black" />
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-bold text-sm leading-tight"
                          style={{ fontFamily: 'var(--font-display)' }}>
                          {p.name}{p.age ? `, ${p.age}` : ''}
                        </p>
                        {p.country && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-white/40" />
                            <p className="text-white/40 text-[11px]">{p.country}</p>
                          </div>
                        )}
                        <p className="text-[#FF4458] text-[11px] mt-1 font-medium">Tap to view</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Like profile detail sheet ── */}
      <AnimatePresence>
        {selectedLike && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setSelectedLike(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 42 }}
              className="w-full max-w-[430px] rounded-t-3xl overflow-hidden"
              style={{ background: '#151519', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '85dvh' }}>

              {/* Photo */}
              <div className="relative h-72">
                <img src={selectedLike.photos?.[0] || '/placeholder.jpg'} alt={selectedLike.name}
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, #151519 0%, transparent 60%)' }} />
                {selectedLike.direction === 'super_like' && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(246,201,14,0.4)' }}>
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 text-xs font-semibold">Super Liked you</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedLike.name}{selectedLike.age ? `, ${selectedLike.age}` : ''}
                  </h2>
                  {selectedLike.country && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-white/50" />
                      <p className="text-white/50 text-sm">{selectedLike.country}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-8 pt-2">
                <p className="text-white/40 text-sm mb-5">
                  {selectedLike.name} liked your profile{selectedLike.direction === 'super_like' ? ' ⭐' : ' ❤️'}. Swipe right on Discover to match!
                </p>

                <div className="flex gap-3">
                  <button className="btn-secondary flex-1 py-3 text-base"
                    onClick={() => setSelectedLike(null)}>
                    Close
                  </button>
                  <button className="btn-primary flex-1 py-3 text-base"
                    onClick={() => { setSelectedLike(null); router.push('/discover'); }}>
                    <span className="flex items-center justify-center gap-2">
                      <Heart size={17} className="fill-white" /> Go Discover
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
