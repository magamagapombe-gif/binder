'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, RefreshCw, Shield, MapPin, ChevronDown, Flag, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import SwipeCard from '@/components/ui/SwipeCard';
import BottomNav from '@/components/layout/BottomNav';

// ─── Match Popup ────────────────────────────────────────────────────────────
function MatchPopup({ partner, matchId, onClose, onMessage }: { partner: any; matchId?: string; onClose: () => void; onMessage: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{ background: 'linear-gradient(135deg, rgba(255,68,88,0.97), rgba(255,107,107,0.97))' }}>
      <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
        className="text-center w-full max-w-xs">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          It's a Match!
        </h1>
        <p className="text-white/80 text-lg mb-8">You and {partner?.name} liked each other</p>
        <motion.div className="flex justify-center mb-10" initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <img src={partner?.photos?.[0] || '/placeholder.jpg'}
            className="w-36 h-36 rounded-3xl object-cover border-4 border-white shadow-2xl" alt="" />
        </motion.div>
        <div className="space-y-3 w-full">
          <button className="w-full py-4 rounded-2xl bg-white text-[#FF4458] font-bold text-lg"
            onClick={onMessage} style={{ fontFamily: 'var(--font-display)' }}>
            Send a Message 💬
          </button>
          <button className="w-full py-3 rounded-2xl bg-white/20 text-white font-medium"
            onClick={onClose}>
            Keep Swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Profile Detail Modal ────────────────────────────────────────────────────
function ProfileModal({ profile, onClose, onLike, onPass, onSuperLike, onReport, onBlock }: {
  profile: any; onClose: () => void;
  onLike: () => void; onPass: () => void; onSuperLike: () => void;
  onReport: () => void; onBlock: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const photos = profile.photos?.length ? profile.photos : ['/placeholder.jpg'];
  const countryFlag = profile.country === 'UG' ? '🇺🇬' : profile.country === 'KE' ? '🇰🇪' : '🇹🇿';
  const countryName = profile.country === 'UG' ? 'Uganda' : profile.country === 'KE' ? 'Kenya' : 'Tanzania';

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="fixed inset-0 z-50 bg-[#0D0D0F] overflow-y-auto">

      {/* Photo header */}
      <div className="relative w-full aspect-[4/5]">
        <img src={photos[photoIdx]} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-transparent to-transparent" />

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute top-4 inset-x-4 flex gap-1.5">
            {photos.map((_: string, i: number) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                className={`h-1 flex-1 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        )}

        {/* Back + report buttons */}
        <div className="absolute top-4 flex justify-between w-full px-4">
          <button onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <ChevronDown size={22} className="text-white" />
          </button>
          <button onClick={() => setShowActions(v => !v)}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">···</span>
          </button>
        </div>

        {/* Report/Block dropdown */}
        <AnimatePresence>
          {showActions && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute top-16 right-4 bg-[#1A1A1F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10">
              <button onClick={() => { onReport(); setShowActions(false); }}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors w-full text-left">
                <Flag size={16} className="text-yellow-400" />
                <span className="text-sm text-white/80">Report {profile.name}</span>
              </button>
              <div className="h-px bg-white/5" />
              <button onClick={() => { onBlock(); setShowActions(false); }}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors w-full text-left">
                <Ban size={16} className="text-red-400" />
                <span className="text-sm text-red-400">Block {profile.name}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo navigation */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full" onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} />
          <div className="w-1/2 h-full" onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))} />
        </div>
      </div>

      {/* Info */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{profile.name}</h1>
              <span className="text-2xl font-semibold text-white/60">{profile.age}</span>
              {profile.users?.is_verified && <Shield size={18} className="text-[#FF4458]" />}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base">{countryFlag}</span>
              <span className="text-white/40 text-sm">{countryName}</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-white/70 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Photo grid */}
        {photos.length > 1 && (
          <div className="mt-5">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p: string, i: number) => (
                <button key={i} onClick={() => setPhotoIdx(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-[#FF4458]' : 'border-transparent'}`}>
                  <img src={p} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-5 py-8">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => { onPass(); onClose(); }}
            className="w-16 h-16 rounded-full border-2 border-white/15 bg-white/5 flex items-center justify-center shadow-lg">
            <X size={28} className="text-white/50" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => { onSuperLike(); onClose(); }}
            className="w-14 h-14 rounded-full border-2 border-yellow-400/40 bg-yellow-400/10 flex items-center justify-center">
            <Star size={22} className="text-yellow-400 fill-yellow-400" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => { onLike(); onClose(); }}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl shadow-[#FF4458]/30"
            style={{ background: 'linear-gradient(135deg, #FF4458, #FF6B6B)' }}>
            <Heart size={34} className="text-white fill-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({ name, onClose, onSubmit }: { name: string; onClose: () => void; onSubmit: (reason: string) => void }) {
  const reasons = ['Fake profile', 'Inappropriate photos', 'Harassment', 'Spam or scam', 'Underage', 'Other'];
  const [selected, setSelected] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="w-full max-w-[430px] bg-[#1A1A1F] rounded-t-3xl p-6 pb-10 border-t border-white/10">
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />
        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Report {name}</h2>
        <p className="text-white/40 text-sm mb-5">Your report is anonymous and helps keep Binder safe.</p>
        <div className="space-y-2 mb-6">
          {reasons.map(r => (
            <button key={r} onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all text-sm ${selected === r ? 'border-[#FF4458] bg-[#FF4458]/10 text-white' : 'border-white/10 bg-white/5 text-white/70'}`}>
              {r}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={!selected} onClick={() => onSubmit(selected)}>Submit Report</button>
        <button className="btn-secondary mt-2" onClick={onClose}>Cancel</button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchPopup, setMatchPopup] = useState<{ partner: any; matchId?: string } | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [superLikeAnim, setSuperLikeAnim] = useState(false);

  const loadProfiles = useCallback(async (reset = false) => {
    try {
      const data = await api.discover();
      setProfiles(prev => {
        if (reset) return data || [];
        const existingIds = new Set(prev.map((p: any) => p.user_id));
        const fresh = (data || []).filter((p: any) => !existingIds.has(p.user_id));
        return [...prev, ...fresh];
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfiles(true); }, []);

  async function handleSwipe(dir: 'like' | 'pass' | 'super_like') {
    if (!profiles.length || swiping) return;
    setSwiping(true);

    if (dir === 'super_like') {
      setSuperLikeAnim(true);
      setTimeout(() => setSuperLikeAnim(false), 1000);
    }

    const top = profiles[profiles.length - 1];
    setProfiles(prev => prev.slice(0, -1));

    try {
      const res = await api.swipe(top.user_id, dir);
      if (res.match) {
        setMatchPopup({ partner: res.partner || top, matchId: res.match_id });
      } else if (dir === 'super_like' && res.super_sent) {
        toast('⭐ Super Like sent! They'll see it when they find your card.');
      }
    } catch {}
    finally { setSwiping(false); }

    if (profiles.length <= 2) loadProfiles();
  }

  async function handleBlock(profile: any) {
    try {
      await api.blockUser(profile.user_id);
      setProfiles(prev => prev.filter(p => p.user_id !== profile.user_id));
      setViewingProfile(null);
      toast.success(`${profile.name} blocked`);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleReport(profile: any, reason: string) {
    try {
      await api.reportUser(profile.user_id, reason);
      setReportTarget(null);
      setViewingProfile(null);
      toast.success('Report submitted. Thank you 🙏');
    } catch (e: any) { toast.error(e.message); }
  }

  const topProfile = profiles[profiles.length - 1];

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}>
          binder 🔥
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/settings')}
            className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
            <span className="text-lg">⚙️</span>
          </button>
          <button onClick={() => loadProfiles(true)}
            className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
            <RefreshCw size={16} className="text-white/50" />
          </button>
        </div>
      </div>

      {/* Super Like Anim */}
      <AnimatePresence>
        {superLikeAnim && (
          <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-black font-black text-lg px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Star size={18} className="fill-black" /> SUPER LIKE!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {loading ? (
          <div className="w-full max-w-sm aspect-[3/4] rounded-3xl bg-white/5 animate-pulse" />
        ) : profiles.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 px-8">
            <span className="text-7xl">🌍</span>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>You've seen everyone!</h2>
            <p className="text-white/40 text-sm">New people join every day. Check back soon!</p>
            <button className="btn-primary" onClick={() => loadProfiles(true)}>
              <span className="flex items-center justify-center gap-2"><RefreshCw size={16} /> Refresh</span>
            </button>
          </motion.div>
        ) : (
          <div className="relative w-full" style={{ height: 'min(75vw * 4/3, 520px)', maxHeight: '520px' }}>
            <AnimatePresence>
              {profiles.slice(-3).map((p, i, arr) => (
                <motion.div key={p.user_id}
                  style={{ zIndex: i, scale: 1 - (arr.length - 1 - i) * 0.04, y: (arr.length - 1 - i) * -10 }}
                  className="absolute inset-0">
                  <SwipeCard
                    profile={p}
                    onSwipe={handleSwipe}
                    isTop={i === arr.length - 1}
                    onTap={i === arr.length - 1 ? () => setViewingProfile(p) : undefined}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {profiles.length > 0 && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-5 py-3 px-6">
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('pass')}
            className="w-16 h-16 rounded-full border-2 border-white/15 bg-white/5 flex items-center justify-center shadow-lg">
            <X size={28} className="text-white/50" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('super_like')}
            className="w-14 h-14 rounded-full border-2 border-yellow-400/40 bg-yellow-400/10 flex items-center justify-center">
            <Star size={22} className="text-yellow-400 fill-yellow-400" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('like')}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl shadow-[#FF4458]/30"
            style={{ background: 'linear-gradient(135deg, #FF4458, #FF6B6B)' }}>
            <Heart size={34} className="text-white fill-white" />
          </motion.button>
        </motion.div>
      )}

      <BottomNav />

      {/* Match popup */}
      <AnimatePresence>
        {matchPopup && (
          <MatchPopup
            partner={matchPopup.partner}
            matchId={matchPopup.matchId}
            onClose={() => setMatchPopup(null)}
            onMessage={() => {
              setMatchPopup(null);
              if (matchPopup.matchId) router.push(`/messages/${matchPopup.matchId}`);
              else router.push('/matches');
            }}
          />
        )}
      </AnimatePresence>

      {/* Profile detail modal */}
      <AnimatePresence>
        {viewingProfile && (
          <ProfileModal
            profile={viewingProfile}
            onClose={() => setViewingProfile(null)}
            onLike={() => handleSwipe('like')}
            onPass={() => handleSwipe('pass')}
            onSuperLike={() => handleSwipe('super_like')}
            onReport={() => setReportTarget(viewingProfile)}
            onBlock={() => handleBlock(viewingProfile)}
          />
        )}
      </AnimatePresence>

      {/* Report modal */}
      <AnimatePresence>
        {reportTarget && (
          <ReportModal
            name={reportTarget.name}
            onClose={() => setReportTarget(null)}
            onSubmit={(reason) => handleReport(reportTarget, reason)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
