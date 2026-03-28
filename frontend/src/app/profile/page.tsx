'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LogOut, Camera, Edit3, CheckCircle, ChevronRight, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import BottomNav from '@/components/layout/BottomNav';

const GENDERS = ['Man', 'Woman', 'Non-binary'];
const INTERESTS = [{ value: 'women', label: 'Women' }, { value: 'men', label: 'Men' }, { value: 'both', label: 'Everyone' }];
const COUNTRIES = [{ code: 'UG', name: 'Uganda', flag: '🇺🇬' }, { code: 'KE', name: 'Kenya', flag: '🇰🇪' }, { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' }];

// ─── Edit Field Sheet ─────────────────────────────────────────────────────────
function EditSheet({ field, value, onSave, onClose }: { field: string; value: any; onSave: (v: any) => void; onClose: () => void }) {
  const [val, setVal] = useState(value);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="w-full max-w-[430px] bg-[#1A1A1F] rounded-t-3xl p-6 pb-10 border-t border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <h2 className="text-xl font-bold capitalize" style={{ fontFamily: 'var(--font-display)' }}>{field}</h2>
          <button onClick={onClose}><X size={20} className="text-white/50" /></button>
        </div>

        {field === 'bio' && (
          <div>
            <textarea className="input resize-none text-sm" rows={5} value={val}
              onChange={e => setVal(e.target.value)} maxLength={300}
              placeholder="Tell people about yourself…" autoFocus />
            <p className="text-white/25 text-xs text-right mt-1">{val?.length || 0}/300</p>
          </div>
        )}
        {field === 'name' && (
          <input className="input text-2xl" value={val} onChange={e => setVal(e.target.value)}
            placeholder="Your name" autoFocus />
        )}
        {field === 'age' && (
          <input className="input" type="number" min="18" max="80" value={val}
            onChange={e => setVal(e.target.value)} placeholder="Your age" autoFocus />
        )}
        {field === 'gender' && (
          <div className="space-y-2">
            {GENDERS.map(g => (
              <button key={g} onClick={() => setVal(g.toLowerCase())}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${val === g.toLowerCase() ? 'border-[#FF4458] bg-[#FF4458]/10' : 'border-white/10 bg-white/5'}`}>
                <span>{g}</span>
                {val === g.toLowerCase() && <Check size={18} className="text-[#FF4458]" />}
              </button>
            ))}
          </div>
        )}
        {field === 'interested in' && (
          <div className="space-y-2">
            {INTERESTS.map(i => (
              <button key={i.value} onClick={() => setVal(i.value)}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${val === i.value ? 'border-[#FF4458] bg-[#FF4458]/10' : 'border-white/10 bg-white/5'}`}>
                <span>{i.label}</span>
                {val === i.value && <Check size={18} className="text-[#FF4458]" />}
              </button>
            ))}
          </div>
        )}
        {field === 'country' && (
          <div className="space-y-2">
            {COUNTRIES.map(c => (
              <button key={c.code} onClick={() => setVal(c.code)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all text-left ${val === c.code ? 'border-[#FF4458] bg-[#FF4458]/10' : 'border-white/10 bg-white/5'}`}>
                <span className="text-2xl">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                {val === c.code && <Check size={18} className="text-[#FF4458]" />}
              </button>
            ))}
          </div>
        )}

        <button className="btn-primary mt-6" onClick={() => onSave(val)}>Save</button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile, user, logout } = useStore();
  const [editField, setEditField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    api.getMe().then(p => { setProfile(p); }).catch(() => {});
    api.getVerifyStatus().then(d => setVerified(d.is_verified)).catch(() => {});
  }, []);

  async function handleSaveField(field: string, rawValue: any) {
    setSaving(true);
    try {
      const fieldMap: Record<string, string> = {
        'name': 'name', 'age': 'age', 'gender': 'gender',
        'interested in': 'interested_in', 'bio': 'bio', 'country': 'country'
      };
      const key = fieldMap[field];
      const value = field === 'age' ? parseInt(rawValue) : rawValue;
      const updated = await api.updateProfile({ ...profile, [key]: value });
      setProfile(updated);
      setEditField(null);
      toast.success('Saved!');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await api.uploadPhoto(ev.target?.result as string, 'photo.jpg');
        const p = await api.getMe();
        setProfile(p);
        toast.success('Photo updated! 📸');
      } catch (err: any) { toast.error(err.message); }
      finally { setUploadingPhoto(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleLogout() {
    logout();
    router.push('/auth');
  }

  const photos = profile?.photos || [];
  const countryObj = COUNTRIES.find(c => c.code === profile?.country);
  const genderLabel = profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '—';
  const interestObj = INTERESTS.find(i => i.value === profile?.interested_in);

  const editableFields = [
    { label: 'Name', field: 'name', value: profile?.name, display: profile?.name || '—' },
    { label: 'Age', field: 'age', value: profile?.age, display: profile?.age ? `${profile.age}` : '—' },
    { label: 'Gender', field: 'gender', value: profile?.gender, display: genderLabel },
    { label: 'Interested in', field: 'interested in', value: profile?.interested_in, display: interestObj?.label || '—' },
    { label: 'Country', field: 'country', value: profile?.country, display: countryObj ? `${countryObj.flag} ${countryObj.name}` : '—' },
    { label: 'Bio', field: 'bio', value: profile?.bio, display: profile?.bio ? profile.bio.slice(0, 40) + (profile.bio.length > 40 ? '…' : '') : 'No bio yet' },
  ];

  return (
    <div className="min-h-dvh pb-28">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      {/* Header */}
      <div className="relative">
        <div className="h-52 w-full relative overflow-hidden">
          {photos[0] ? (
            <img src={photos[0]} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF4458]/30 to-purple-900/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/20 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-5 transform translate-y-1/2">
          <div className="relative">
            {uploadingPhoto ? (
              <div className="w-24 h-24 rounded-2xl bg-white/10 border-4 border-[#0D0D0F] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-[#FF4458] border-t-transparent animate-spin" />
              </div>
            ) : (
              <img src={photos[0] || '/placeholder.jpg'} alt=""
                className="w-24 h-24 rounded-2xl object-cover border-4 border-[#0D0D0F] shadow-xl" />
            )}
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{profile?.name || 'Your Name'}</h1>
              {countryObj && <span className="text-xl">{countryObj.flag}</span>}
              {verified && <Shield size={18} className="text-[#FF4458]" />}
            </div>
            <p className="text-white/40 text-sm">{profile?.age ? `${profile.age} · ` : ''}{genderLabel}</p>
          </div>
        </div>

        {/* Photos grid */}
        <div className="mt-6">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">My Photos</p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p: string, i: number) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <img src={p} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <button onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center hover:border-[#FF4458] transition-colors gap-1.5">
              <Camera size={20} className="text-white/30" />
              <span className="text-[10px] text-white/25">Add photo</span>
            </button>
          </div>
        </div>

        {/* Editable fields */}
        <div className="mt-8">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Profile Info</p>
          <div className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden divide-y divide-white/5">
            {editableFields.map(({ label, field, value, display }) => (
              <button key={field} onClick={() => setEditField(field)}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 active:bg-white/8 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-xs mb-0.5">{label}</p>
                  <p className={`text-sm font-medium ${value ? 'text-white' : 'text-white/25'}`}>{display}</p>
                </div>
                <ChevronRight size={16} className="text-white/20 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

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
            {verified ? <CheckCircle size={18} className="text-green-400" /> : <ChevronRight size={16} className="text-white/20" />}
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
            <ChevronRight size={16} className="text-white/20" />
          </button>

          <button onClick={() => router.push('/settings')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <span className="text-lg">⚙️</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">Discovery settings</p>
              <p className="text-white/40 text-xs">Age range, who you see</p>
            </div>
            <ChevronRight size={16} className="text-white/20" />
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

      {/* Edit sheet */}
      <AnimatePresence>
        {editField && (
          <EditSheet
            field={editField}
            value={editableFields.find(f => f.field === editField)?.value}
            onSave={(val) => handleSaveField(editField, val)}
            onClose={() => setEditField(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
