'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Zap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import SwipeCard from '@/components/ui/SwipeCard';
import BottomNav from '@/components/layout/BottomNav';

function MatchPopup({ partner, onClose }: { partner: any; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{ background: 'linear-gradient(135deg, rgba(255,68,88,0.95), rgba(255,107,107,0.95))' }}>
      <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
        className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          It's a Match!
        </h1>
        <p className="text-white/80 text-lg mb-8">You and {partner?.name} liked each other</p>
        <div className="flex justify-center gap-4 mb-10">
          <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <img src={partner?.photos?.[0] || '/placeholder.jpg'}
              className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-2xl" alt="" />
          </motion.div>
        </div>
        <div className="space-y-3 w-full max-w-xs">
          <button className="w-full py-4 rounded-2xl bg-white text-[#FF4458] font-bold text-lg"
            onClick={onClose} style={{ fontFamily: 'var(--font-display)' }}>
            Send a Message 💬
          </button>
          <button className="w-full py-3 rounded-2xl bg-white/20 text-white font-medium"
            onClick={onClose}>
            Keep Swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchPopup, setMatchPopup] = useState<any>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const loadProfiles = useCallback(async (reset = false) => {
    try {
      const data = await api.discover();
      setProfiles(prev => {
        if (reset) return data || [];
        // avoid duplicates
        const existingIds = new Set(prev.map((p: any) => p.user_id));
        const fresh = (data || []).filter((p: any) => !existingIds.has(p.user_id));
        return [...prev, ...fresh];
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfiles(true); }, []);

  async function handleSwipe(dir: 'like' | 'pass') {
    if (!profiles.length || swiping) return;
    setSwiping(true);
    const top = profiles[profiles.length - 1];
    setProfiles(prev => prev.slice(0, -1));
    setSeenIds(prev => new Set([...prev, top.user_id]));

    try {
      const res = await api.swipe(top.user_id, dir);
      if (res.match) {
        setMatchPopup(res.partner || top);
      }
    } catch {}
    finally { setSwiping(false); }

    if (profiles.length <= 2) loadProfiles();
  }

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}>
          binder 🔥
        </h1>
        <button onClick={() => loadProfiles(true)}
          className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <RefreshCw size={16} className="text-white/50" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {loading ? (
          <div className="space-y-4 text-center">
            <div className="w-full max-w-sm aspect-[3/4] rounded-3xl bg-white/5 animate-pulse" />
          </div>
        ) : profiles.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 px-8">
            <span className="text-7xl">🌍</span>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>You've seen everyone!</h2>
            <p className="text-white/40 text-sm">New people join every day. Check back soon!</p>
            <button className="btn-primary" onClick={() => loadProfiles(true)}>
              <span className="flex items-center justify-center gap-2"><RefreshCw size={16} /> Refresh</span>
            </button>
          </motion.div>
        ) : (
          <div className="relative w-full" style={{ height: 'min(75vw * 4/3, 520px)', maxHeight: '520px' }}>
            <AnimatePresence>
              {profiles.slice(-3).map((p, i, arr) => (
                <motion.div key={p.user_id}
                  style={{ zIndex: i, scale: 1 - (arr.length - 1 - i) * 0.04, y: (arr.length - 1 - i) * -10 }}
                  className="absolute inset-0">
                  <SwipeCard profile={p} onSwipe={handleSwipe} isTop={i === arr.length - 1} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {profiles.length > 0 && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-5 py-3 px-6">
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('pass')}
            className="w-16 h-16 rounded-full border-2 border-white/15 bg-white/5 flex items-center justify-center shadow-lg">
            <X size={28} className="text-white/50" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => toast('Super Likes coming soon ⭐')}
            className="w-14 h-14 rounded-full border-2 border-yellow-400/30 bg-yellow-400/10 flex items-center justify-center">
            <Star size={22} className="text-yellow-400" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('like')}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl shadow-[#FF4458]/30"
            style={{ background: 'linear-gradient(135deg, #FF4458, #FF6B6B)' }}>
            <Heart size={34} className="text-white fill-white" />
          </motion.button>
        </motion.div>
      )}

      <BottomNav />

      {/* Match popup */}
      <AnimatePresence>
        {matchPopup && (
          <MatchPopup partner={matchPopup} onClose={() => setMatchPopup(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
