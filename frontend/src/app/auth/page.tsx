'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store';

export default function AuthPage() {
  const router = useRouter();
  const { setAuth } = useStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      await api.sendOtp(phone);
      setStep('otp');
      toast.success('OTP sent!');
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { token, user, isNew } = await api.verifyOtp(phone, otp);
      setAuth(token, user);
      router.push(isNew ? '/onboarding' : '/discover');
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto" style={{ background: 'linear-gradient(135deg, #FF4458, #FF6B6B)' }}>
            <span className="text-4xl">🔥</span>
          </div>
        </motion.div>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-5xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Binder
        </motion.h1>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-white/40 text-center text-lg mb-2">Love in East Africa</motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-white/20 text-sm text-center">🇺🇬 Uganda · 🇰🇪 Kenya · 🇹🇿 Tanzania</motion.p>
      </div>

      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}
        className="px-6 pb-10 space-y-4">
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div key="phone" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-4">
              <div>
                <p className="text-white/50 text-sm mb-2 ml-1">Phone number</p>
                <input className="input" placeholder="+256 700 000 000" value={phone}
                  onChange={e => setPhone(e.target.value)} type="tel"
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
              </div>
              <button className="btn-primary" onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending…' : 'Continue'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-4">
              <div>
                <p className="text-white/50 text-sm mb-2 ml-1">6-digit code sent to {phone}</p>
                <input className="input text-center text-3xl tracking-[0.5em]" placeholder="••••••"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  type="tel" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} />
              </div>
              <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying…' : 'Verify'}
              </button>
              <button className="btn-secondary" onClick={() => setStep('phone')}>← Change number</button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-white/20 text-xs text-center pt-2">By continuing you agree to our Terms & Privacy Policy</p>
      </motion.div>
    </div>
  );
}
