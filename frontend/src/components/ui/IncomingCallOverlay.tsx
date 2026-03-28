'use client';
/**
 * IncomingCallOverlay — mounted globally in layout.tsx.
 * Listens on the shared WS singleton for call_invite events.
 * Because useWebSocket is now a singleton, this does NOT create a second socket.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useIncomingCall } from '@/hooks/useIncomingCall';
import { useStore } from '@/store';

export default function IncomingCallOverlay() {
  const router = useRouter();
  const { token } = useStore();
  const { incoming, accept, reject } = useIncomingCall();

  // Don't render at all if not logged in
  if (!token) return null;

  return (
    <AnimatePresence>
      {incoming && (
        <motion.div
          initial={{ y: -130, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -130, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-[200]"
        >
          <div className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg,#1A1A2E,#16213E)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
            }}>

            <div className="relative flex items-center gap-4 px-5 pt-5 pb-4">
              {/* Pulsing ring */}
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: incoming.is_video ? 'rgba(99,179,237,0.4)' : 'rgba(72,187,120,0.4)' }}
                />
                {incoming.caller_photo ? (
                  <img src={incoming.caller_photo} alt={incoming.caller_name}
                    className="w-14 h-14 rounded-2xl object-cover relative z-10" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4458] to-[#FF6B6B] flex items-center justify-center text-2xl font-bold text-white relative z-10">
                    {incoming.caller_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-white truncate">{incoming.caller_name}</p>
                <p className="text-sm mt-0.5" style={{ color: incoming.is_video ? '#63B3ED' : '#68D391' }}>
                  Incoming {incoming.is_video ? 'video' : 'voice'} call…
                </p>
              </div>

              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: incoming.is_video ? 'rgba(99,179,237,0.15)' : 'rgba(72,187,120,0.15)' }}>
                {incoming.is_video
                  ? <Video size={15} style={{ color: '#63B3ED' }} />
                  : <Phone size={15} style={{ color: '#68D391' }} />}
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => reject(incoming)}
                className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
                style={{ background: 'rgba(254,75,75,0.15)', border: '1px solid rgba(254,75,75,0.3)', color: '#FC8181' }}>
                <PhoneOff size={16} /> Decline
              </motion.button>

              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const path = accept(incoming);
                  router.push(path);
                }}
                className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm text-white"
                style={{
                  background: incoming.is_video
                    ? 'linear-gradient(135deg,#3182CE,#63B3ED)'
                    : 'linear-gradient(135deg,#276749,#48BB78)',
                  boxShadow: '0 4px 20px rgba(72,187,120,0.3)',
                }}>
                {incoming.is_video ? <Video size={16} /> : <Phone size={16} />} Accept
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
