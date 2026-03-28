'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store';

const COUNTRIES = [{ code: 'UG', name: 'Uganda', flag: '🇺🇬' }, { code: 'KE', name: 'Kenya', flag: '🇰🇪' }, { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' }];
const GENDERS = ['Man', 'Woman', 'Non-binary'];
const INTERESTS = [{ value: 'women', label: 'Women' }, { value: 'men', label: 'Men' }, { value: 'both', label: 'Everyone' }];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', age: '', gender: '', interested_in: '', bio: '', country: '', photo: '' as string });

  const steps = [
    { title: "What's your name?", subtitle: "This is how you'll appear on Binder" },
    { title: 'Your country', subtitle: 'We only serve Uganda, Kenya & Tanzania' },
    { title: 'About you', subtitle: 'Help others find the right match' },
    { title: 'Add a photo', subtitle: 'Profiles with photos get 10x more matches' },
  ];

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleFinish() {
    if (!form.photo) { toast.error('Please add a photo'); return; }
    setLoading(true);
    try {
      await api.updateProfile({ name: form.name, age: parseInt(form.age), gender: form.gender.toLowerCase(), interested_in: form.interested_in, bio: form.bio, country: form.country });
      if (form.photo) await api.uploadPhoto(form.photo, 'profile.jpg');
      const profile = await api.getMe();
      setProfile(profile);
      router.push('/verify');
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  const canNext = [
    form.name.trim().length >= 2,
    !!form.country,
    form.age && parseInt(form.age) >= 18 && form.gender && form.interested_in,
    !!form.photo,
  ];

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-white/10">
            <motion.div className="h-full rounded-full" style={{ background: 'var(--brand)' }}
              animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="flex-1 flex flex-col">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{steps[step].title}</h1>
          <p className="text-white/40 mb-8">{steps[step].subtitle}</p>

          {step === 0 && (
            <input className="input text-2xl" placeholder="Your name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          )}

          {step === 1 && (
            <div className="space-y-3">
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={() => setForm(f => ({ ...f, country: c.code }))}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left ${form.country === c.code ? 'border-[#FF4458] bg-[#FF4458]/10' : 'border-white/10 bg-white/5'}`}>
                  <span className="text-3xl">{c.flag}</span>
                  <span className="text-lg font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-white/50 text-sm mb-3">Age</p>
                <input className="input" placeholder="Your age" type="number" min="18" max="80" value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
              </div>
              <div>
                <p className="text-white/50 text-sm mb-3">I am a</p>
                <div className="grid grid-cols-3 gap-2">
                  {GENDERS.map(g => (
                    <button key={g} onClick={() => setForm(f => ({ ...f, gender: g.toLowerCase() }))}
                      className={`py-3 rounded-2xl border text-sm font-medium transition-all ${form.gender === g.toLowerCase() ? 'border-[#FF4458] bg-[#FF4458]/10 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-sm mb-3">Interested in</p>
                <div className="grid grid-cols-3 gap-2">
                  {INTERESTS.map(i => (
                    <button key={i.value} onClick={() => setForm(f => ({ ...f, interested_in: i.value }))}
                      className={`py-3 rounded-2xl border text-sm font-medium transition-all ${form.interested_in === i.value ? 'border-[#FF4458] bg-[#FF4458]/10 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}>
                      {i.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-sm mb-3">Bio <span className="text-white/20">(optional)</span></p>
                <textarea className="input resize-none" rows={3} placeholder="Tell people about yourself…"
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} maxLength={300} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-6">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              {form.photo ? (
                <div className="relative">
                  <img src={form.photo} alt="preview" className="w-64 h-80 object-cover rounded-3xl" />
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1.5 rounded-xl backdrop-blur">
                    Change
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-64 h-80 rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 text-white/40 hover:border-[#FF4458] hover:text-[#FF4458] transition-all">
                  <span className="text-5xl">📷</span>
                  <span className="text-sm">Tap to add photo</span>
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pt-8 space-y-3">
        {step < steps.length - 1 ? (
          <button className="btn-primary" disabled={!canNext[step]} onClick={() => setStep(s => s + 1)}>Continue</button>
        ) : (
          <button className="btn-primary" disabled={loading || !canNext[step]} onClick={handleFinish}>
            {loading ? 'Setting up…' : "Let's go! 🔥"}
          </button>
        )}
        {step > 0 && <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>}
      </div>
    </div>
  );
}
