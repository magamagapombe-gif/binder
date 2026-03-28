'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, LogOut, Camera, Edit3, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import BottomNav from '@/components/layout/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile, user, logout } = useStore();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getMe().then(p => { setProfile(p); setBio(p.bio || ''); }).catch(() => {});
    api.getVerifyStatus().then(d => setVerified(d.is_verified)).catch(() => {});
  }, []);

  async function handleSaveBio() {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ ...profile, bio });
      setProfile(updated);
      setEditing(false);
      toast.success('Profile updated');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await api.uploadPhoto(ev.target?.result as string, 'photo.jpg');
        const p = await api.getMe();
        setProfile(p);
        toast.success('Photo updated!');
      } catch (err: any) { toast.error(err.message); }
    };
    reader.readAsDataURL(file);
  }

  function handleLogout() {
    logout();
    router.push('/auth');
  }

  const photos = profile?.photos || [];
  const countryFlag = profile?.country === 'UG' ? '🇺🇬' : profile?.country === 'KE' ? '🇰🇪' : '🇹🇿';

  return (
    <div className="min-h-dvh pb-28">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      {/* Header */}
      <div className="relative">
        <div className="h-48 w-full relative overflow-hidden">
          {photos[0] ? (
            <img src={photos[0]} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF4458]/30 to-purple-900/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] to-transparent" />
        </div>

        <div className="absolute bottom-0 left-5 transform translate-y-1/2">
          <div className="relative">
            <img src={photos[0] || '/placeholder.jpg'} alt=""
              className="w-24 h-24 rounded-2xl object-cover border-4 border-[#0D0D0F] shadow-xl" />
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-[#FF4458] flex items-center justify-center shadow-lg">
              <Camera size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16 px-5">
        {/* Name & badges */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{profile?.name}</h1>
              <span className="text-lg">{countryFlag}</span>
              {verified && <Shield size={18} className="text-[#FF4458]" />}
            </div>
            <p className="text-white/40 text-sm">{profile?.age} · {profile?.gender}</p>
          </div>
          <button onClick={() => setEditing(e => !e)}
            className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
            <Edit3 size={16} className="text-white/60" />
          </button>
        </div>

        {/* Bio */}
        <div className="mt-4">
          {editing ? (
            <div className="space-y-3">
              <textarea className="input resize-none text-sm" rows={4} value={bio}
                onChange={e => setBio(e.target.value)} maxLength={300} placeholder="Write your bio…" />
              <div className="flex gap-2">
                <button className="btn-primary py-3 text-sm" onClick={handleSaveBio} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn-secondary py-3 text-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-white/60 text-sm leading-relaxed">{profile?.bio || 'No bio yet. Tap edit to add one.'}</p>
          )}
        </div>

        {/* Photo grid */}
        {photos.length > 1 && (
          <div className="mt-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-white/15 flex items-center justify-center hover:border-[#FF4458] transition-colors">
                <Camera size={22} className="text-white/30" />
              </button>
            </div>
          </div>
        )}

        {/* Account settings */}
        <div className="mt-8 space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Account</p>

          <button onClick={() => router.push('/verify')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#FF4458]/10 flex items-center justify-center">
              <Shield size={20} className="text-[#FF4458]" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Identity verification</p>
              <p className="text-white/40 text-xs">{verified ? 'Verified ✓' : 'Get verified badge'}</p>
            </div>
            {verified && <CheckCircle size={18} className="text-green-400" />}
          </button>

          <button onClick={() => router.push('/stories')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <span className="text-lg">📸</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">My stories</p>
              <p className="text-white/40 text-xs">Share moments with matches</p>
            </div>
          </button>

          <button onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-left">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut size={20} className="text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-400">Log out</p>
              <p className="text-white/30 text-xs">{user?.phone}</p>
            </div>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
