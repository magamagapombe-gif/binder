'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store';

const INTERESTS = [{ value: 'women', label: 'Women' }, { value: 'men', label: 'Men' }, { value: 'both', label: 'Everyone' }];

export default function SettingsPage() {
  const router = useRouter();
  const { profile, setProfile } = useStore();
  const [minAge, setMinAge] = useState(profile?.min_age_pref || 18);
  const [maxAge, setMaxAge] = useState(profile?.max_age_pref || 45);
  const [interestedIn, setInterestedIn] = useState(profile?.interested_in || 'both');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMe().then(p => {
      setProfile(p);
      setMinAge(p.min_age_pref || 18);
      setMaxAge(p.max_age_pref || 45);
      setInterestedIn(p.interested_in || 'both');
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        ...profile,
        min_age_pref: minAge,
        max_age_pref: maxAge,
        interested_in: interestedIn,
      });
      setProfile(updated);
      toast.success('Settings saved!');
      router.back();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="min-h-dvh pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 sticky top-0 bg-[#0D0D0F]/95 backdrop-blur z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ fontFamily: 'var(--font-display)' }}>Discovery Settings</h1>
        <button onClick={handleSave} disabled={saving}
          className="text-[#FF4458] font-semibold text-sm disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {/* Show me */}
        <div>
          <h2 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Show me</h2>
          <p className="text-white/40 text-sm mb-4">Who you want to discover</p>
          <div className="space-y-2">
            {INTERESTS.map(i => (
              <button key={i.value} onClick={() => setInterestedIn(i.value)}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${interestedIn === i.value ? 'border-[#FF4458] bg-[#FF4458]/10' : 'border-white/10 bg-white/5'}`}>
                <span className={interestedIn === i.value ? 'text-white' : 'text-white/70'}>{i.label}</span>
                {interestedIn === i.value && <Check size={18} className="text-[#FF4458]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Age range */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Age range</h2>
            <span className="text-[#FF4458] font-semibold text-sm">{minAge} – {maxAge}</span>
          </div>
          <p className="text-white/40 text-sm mb-5">People in this age range will appear in your feed</p>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>Minimum age</span>
                <span className="text-white font-medium">{minAge}</span>
              </div>
              <input type="range" min="18" max={maxAge - 1} value={minAge}
                onChange={e => setMinAge(parseInt(e.target.value))}
                className="w-full accent-[#FF4458] h-1 rounded-full bg-white/10 appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #FF4458 ${((minAge - 18) / (62)) * 100}%, rgba(255,255,255,0.1) ${((minAge - 18) / 62) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-white/20 mt-1">
                <span>18</span><span>80</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>Maximum age</span>
                <span className="text-white font-medium">{maxAge}</span>
              </div>
              <input type="range" min={minAge + 1} max="80" value={maxAge}
                onChange={e => setMaxAge(parseInt(e.target.value))}
                className="w-full accent-[#FF4458] h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #FF4458 ${((maxAge - 18) / 62) * 100}%, rgba(255,255,255,0.1) ${((maxAge - 18) / 62) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-white/20 mt-1">
                <span>18</span><span>80</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-2xl bg-[#FF4458]/8 border border-[#FF4458]/20">
          <p className="text-sm text-white/70 leading-relaxed">
            You'll see{' '}
            <span className="text-white font-semibold">{INTERESTS.find(i => i.value === interestedIn)?.label}</span>
            {' '}between{' '}
            <span className="text-white font-semibold">{minAge}–{maxAge}</span>
            {' '}in your discovery feed.
          </p>
        </div>

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={handleSave} disabled={saving}
          className="btn-primary">
          {saving ? 'Saving…' : 'Save Settings'}
        </motion.button>
      </div>
    </div>
  );
}
