'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import SwipeCard from '@/components/ui/SwipeCard';
import BottomNav from '@/components/layout/BottomNav';

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [superLiking, setSuperLiking] = useState(false);

  useEffect(() => { loadProfiles(); }, []);

  async function loadProfiles() {
    try {
      const data = await api.discover();
      setProfiles(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  async function handleSwipe(dir: 'like' | 'pass') {
    if (!profiles.length) return;
    const top = profiles[profiles.length - 1];
    const remaining = profiles.slice(0, -1);
    setProfiles(remaining);
    if (remaining.length < 3) loadProfiles();

    try {
      const res = await api.swipe(top.user_id, dir);
      if (res.match) {
        toast.custom((t) => (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 bg-gradient-to-r from-[#FF4458] to-[#FF6B6B] text-white px-5 py-3 rounded-2xl shadow-xl">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>It's a match!</p>
              <p className="text-sm opacity-80">You and {top.name} liked each other</p>
            </div>
          </motion.div>
        ), { duration: 4000 });
      }
    } catch {}
  }

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          <span style={{ color: 'var(--brand)' }}>Binder</span>
        </h1>
        <button onClick={() => toast('Super Likes coming soon!')}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
          <Zap size={18} className="text-black" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {loading ? (
          <div className="w-10 h-10 rounded-full border-2 border-[#FF4458] border-t-transparent animate-spin" />
        ) : profiles.length === 0 ? (
          <div className="text-center space-y-4 px-8">
            <span className="text-6xl">🌍</span>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>You've seen everyone!</h2>
            <p className="text-white/40">Check back later for new people in your area</p>
            <button className="btn-primary" onClick={loadProfiles}>Refresh</button>
          </div>
        ) : (
          <div className="relative w-full" style={{ height: 'calc(100vw * 4/3)', maxHeight: '520px' }}>
            <AnimatePresence>
              {profiles.slice(-3).map((p, i, arr) => (
                <motion.div key={p.user_id} style={{ zIndex: i, scale: 1 - (arr.length - 1 - i) * 0.04, y: (arr.length - 1 - i) * -8 }}
                  className="absolute inset-0">
                  <SwipeCard profile={p} onSwipe={handleSwipe} isTop={i === arr.length - 1} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {profiles.length > 0 && (
        <div className="flex items-center justify-center gap-5 py-4 px-6">
          <button onClick={() => handleSwipe('pass')}
            className="w-16 h-16 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
            <X size={28} className="text-white/60" />
          </button>
          <button onClick={() => handleSwipe('like')}
            className="w-20 h-20 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-[#FF4458]/30"
            style={{ background: 'linear-gradient(135deg, #FF4458, #FF6B6B)' }}>
            <Heart size={32} className="text-white fill-white" />
          </button>
          <button onClick={() => toast('Super Likes coming soon!')}
            className="w-16 h-16 rounded-full border-2 border-yellow-400/40 bg-yellow-400/10 flex items-center justify-center active:scale-90 transition-transform">
            <Star size={24} className="text-yellow-400" />
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
