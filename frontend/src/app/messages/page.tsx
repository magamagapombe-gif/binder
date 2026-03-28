'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';

export default function MessagesListPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => { api.getMatches().then(setMatches); }, []);

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 py-5">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Messages</h1>
      </div>
      {matches.length === 0 ? (
        <div className="text-center py-24 space-y-3 px-8">
          <span className="text-5xl">💬</span>
          <p className="text-white/40">Match with someone to start chatting</p>
        </div>
      ) : (
        <div className="px-5 space-y-2">
          {matches.map((m, i) => (
            <motion.button key={m.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
              onClick={() => router.push(`/messages/${m.id}`)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/5 text-left transition-colors">
              <img src={m.partner?.photos?.[0] || '/placeholder.jpg'} className="w-14 h-14 rounded-xl object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{m.partner?.name}</p>
                <p className="text-white/40 text-sm truncate">Tap to say hello 👋</p>
              </div>
              <p className="text-white/20 text-xs">{new Date(m.created_at).toLocaleDateString()}</p>
            </motion.button>
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
