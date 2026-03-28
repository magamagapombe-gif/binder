'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

declare global { interface Window { faceIO: any; } }

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'verified' | 'error'>('idle');
  const [faceioLoaded, setFaceioLoaded] = useState(false);

  useEffect(() => {
    api.getVerifyStatus().then(d => { if (d.is_verified) setStatus('verified'); });

    // Load FaceIO script
    const script = document.createElement('script');
    script.src = 'https://cdn.faceio.net/fio.js';
    script.onload = () => setFaceioLoaded(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  async function startVerification() {
    if (!faceioLoaded || !window.faceIO) {
      toast.error('Verification module not loaded yet');
      return;
    }
    setStatus('loading');
    try {
      const faceio = new window.faceIO(process.env.NEXT_PUBLIC_FACEIO_APP_ID);
      const payload = await faceio.enroll({
        locale: 'auto',
        payload: { userId: 'binder-user' },
      });
      await api.submitLiveness(payload);
      setStatus('verified');
      toast.success('Identity verified! ✅');
      setTimeout(() => router.push('/discover'), 1500);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      toast.error('Verification failed. Please try again.');
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 w-full max-w-sm">

        {status === 'verified' ? (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <CheckCircle size={80} className="text-green-400 mx-auto" />
            </motion.div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Verified! 🎉</h1>
            <p className="text-white/50">Your profile now shows a verified badge</p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF4458, #FF6B6B)' }}>
              <Shield size={44} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Verify yourself</h1>
            <p className="text-white/50 text-base leading-relaxed">
              A quick selfie check proves you're a real person. Verified profiles get <span className="text-[#FF4458] font-semibold">3x more matches</span>.
            </p>

            <div className="space-y-3 text-left bg-white/5 rounded-2xl p-5 border border-white/8">
              {['Liveness check — no photos or videos accepted', 'Your face data is never stored or shared', 'Takes less than 30 seconds'].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-white/60 text-sm">{item}</p>
                </div>
              ))}
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 rounded-xl px-4 py-3">
                <AlertCircle size={18} />
                <p className="text-sm">Verification failed. Please try in good lighting.</p>
              </div>
            )}

            <button className="btn-primary" onClick={startVerification} disabled={status === 'loading'}>
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Scanning…
                </span>
              ) : 'Start Face Scan'}
            </button>
            <button className="text-white/30 text-sm underline" onClick={() => router.push('/discover')}>
              Skip for now
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
