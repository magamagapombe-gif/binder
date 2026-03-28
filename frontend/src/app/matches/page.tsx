'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMatches().then(setMatches).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#FF4458] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 py-5">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Matches</h1>
        <p className="text-white/40 text-sm mt-1">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</p>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-24 space-y-4 px-8">
          <span className="text-6xl">💝</span>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>No matches yet</h2>
          <p className="text-white/40">Keep swiping to find your match!</p>
          <button className="btn-primary" onClick={() => router.push('/discover')}>Start Swiping</button>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {matches.map((m, i) => (
            <motion.div key={m.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="relative">
                <img src={m.partner?.photos?.[0] || '/placeholder.jpg'} alt={m.partner?.name}
                  className="w-16 h-16 rounded-2xl object-cover" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-[#0D0D0F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{m.partner?.name}</p>
                <p className="text-white/40 text-sm">Matched {new Date(m.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push(`/messages/${m.id}`)}
                  className="w-11 h-11 rounded-xl bg-[#FF4458]/10 border border-[#FF4458]/20 flex items-center justify-center">
                  <MessageCircle size={20} className="text-[#FF4458]" />
                </button>
                <button onClick={() => router.push(`/calls/${m.id}?name=${m.partner?.name}`)}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Phone size={20} className="text-white/60" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
