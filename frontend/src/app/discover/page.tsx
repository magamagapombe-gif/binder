'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, Flag, Ban, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import SwipeCard from '@/components/ui/SwipeCard';
import BottomNav from '@/components/layout/BottomNav';

// Preload an image into browser cache
function preloadImage(src: string) {
  if (!src || typeof window === 'undefined') return;
  const img = new Image();
  img.src = src;
}

// ─── Match Popup ──────────────────────────────────────────────────────────────
function MatchPopup({ partner, matchId, onClose, onMessage }: {
  partner: any; matchId?: string; onClose: () => void; onMessage: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{ background: 'linear-gradient(135deg, rgba(255,68,88,0.97), rgba(255,107,107,0.97))' }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="text-center w-full max-w-xs">
        <div className="text-6xl mb-3">🎉</div>
        <h1 className="text-4xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          It's a Match!
        </h1>
        <p className="text-white/80 text-base mb-6">You and {partner?.name} liked each other</p>
        {partner?.photos?.[0] && (
          <img src={partner.photos[0]}
            className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-2xl mx-auto mb-8" alt="" />
        )}
        <div className="space-y-3 w-full">
          <button className="w-full py-4 rounded-2xl bg-white text-[#FF4458] font-bold text-lg"
            onClick={onMessage} style={{ fontFamily: 'var(--font-display)' }}>
            Send a Message 💬
          </button>
          <button className="w-full py-3 rounded-2xl bg-white/20 text-white font-medium" onClick={onClose}>
            Keep Swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Profile Detail Modal ─────────────────────────────────────────────────────
function ProfileModal({ profile, onClose, onLike, onPass, onSuperLike, onReport, onBlock }: {
  profile: any; onClose: () => void;
  onLike: () => void; onPass: () => void; onSuperLike: () => void;
  onReport: () => void; onBlock: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const photos = profile.photos?.length ? profile.photos : ['/placeholder.jpg'];
  const countryFlag = profile.country === 'UG' ? '🇺🇬' : profile.country === 'KE' ? '🇰🇪' : '🇹🇿';

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 350, damping: 35 }}
      className="fixed inset-0 z-50 bg-[#0D0D0F] overflow-y-auto">

      <div className="relative w-full" style={{ aspectRatio: '4/5' }}>
        <img src={photos[photoIdx]} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-transparent to-transparent" />

        {photos.length > 1 && (
          <div className="absolute top-4 inset-x-4 flex gap-1.5">
            {photos.map((_: string, i: number) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                className={`h-1 flex-1 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        )}

        <div className="absolute top-4 left-4">
          <button onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <ChevronDown size={22} className="text-white" />
          </button>
        </div>

        <div className="absolute top-4 right-4">
          <button onClick={() => setShowMenu(v => !v)}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <span className="text-white font-bold text-lg">···</span>
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-12 right-0 bg-[#1A1A1F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-48">
                <button onClick={() => { onReport(); setShowMenu(false); }}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 w-full text-left">
                  <Flag size={15} className="text-yellow-400" />
                  <span className="text-sm text-white/80">Report</span>
                </button>
                <div className="h-px bg-white/5" />
                <button onClick={() => { onBlock(); setShowMenu(false); }}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 w-full text-left">
                  <Ban size={15} className="text-red-400" />
                  <span className="text-sm text-red-400">Block</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Photo nav tap zones */}
        <div className="absolute inset-0 flex" style={{ top: 60 }}>
          <div className="w-1/2 h-full cursor-pointer" onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} />
          <div className="w-1/2 h-full cursor-pointer" onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))} />
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-10">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{profile.name}</h1>
          <span className="text-2xl text-white/60 font-semibold">{profile.age}</span>
          <span>{countryFlag}</span>
        </div>

        {profile.bio && (
          <p className="text-white/60 text-sm leading-relaxed mt-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            {profile.bio}
          </p>
        )}

        {photos.length > 1 && (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {photos.map((p: string, i: number) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-[#FF4458]' : 'border-transparent'}`}>
                <img src={p} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        )}

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
function ReportModal({ name, onClose, onSubmit }: {
  name: string; onClose: () => void; onSubmit: (reason: string) => void;
}) {
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
        <p className="text-white/40 text-sm mb-5">Your report is anonymous.</p>
        <div className="space-y-2 mb-6">
          {reasons.map(r => (
            <button key={r} onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all text-sm flex items-center justify-between ${selected === r ? 'border-[#FF4458] bg-[#FF4458]/10 text-white' : 'border-white/10 bg-white/5 text-white/70'}`}>
              <span>{r}</span>
              {selected === r && <Check size={16} className="text-[#FF4458]" />}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={!selected} onClick={() => onSubmit(selected)}>Submit Report</button>
        <button className="btn-secondary mt-2" onClick={onClose}>Cancel</button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Discover Page ───────────────────────────────────────────────────────
const KM_OPTIONS = [
  { label: '5 km',     value: 5   },
  { label: '10 km',    value: 10  },
  { label: '25 km',    value: 25  },
  { label: '50 km',    value: 50  },
  { label: 'Anywhere', value: null },
];

export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchPopup, setMatchPopup] = useState<{ partner: any; matchId?: string } | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [superAnim, setSuperAnim] = useState(false);
  const [maxKm, setMaxKm] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const fetchingMore = useRef(false);

  const loadProfiles = useCallback(async (reset = false, km?: number | null) => {
    if (fetchingMore.current && !reset) return;
    fetchingMore.current = true;
    try {
      const activeKm = km !== undefined ? km : maxKm;
      const data: any[] = await api.discover(activeKm ? { max_km: activeKm } : {}) || [];

      // Preload ALL images immediately so they're cached when cards appear
      data.forEach((p: any) => {
        (p.photos || []).forEach(preloadImage);
      });

      setProfiles(prev => {
        if (reset) return data;
        const existingIds = new Set(prev.map((p: any) => p.user_id));
        const fresh = data.filter((p: any) => !existingIds.has(p.user_id));
        return [...prev, ...fresh];
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
      fetchingMore.current = false;
    }
  }, [maxKm]);

  useEffect(() => { loadProfiles(true); }, []);

  // Preload next card's image whenever profiles change
  useEffect(() => {
    if (profiles.length >= 2) {
      const next = profiles[profiles.length - 2];
      (next?.photos || []).forEach(preloadImage);
    }
  }, [profiles]);

  async function handleSwipe(dir: 'like' | 'pass' | 'super_like') {
    if (!profiles.length || swiping) return;
    setSwiping(true);

    if (dir === 'super_like') {
      setSuperAnim(true);
      setTimeout(() => setSuperAnim(false), 1200);
    }

    const top = profiles[profiles.length - 1];

    // Remove card immediately — don't wait for API
    setProfiles(prev => prev.slice(0, -1));

    // Prefetch more when running low
    if (profiles.length <= 4) loadProfiles();

    try {
      const res = await api.swipe(top.user_id, dir);
      if (res.match) {
        setMatchPopup({ partner: res.partner || top, matchId: res.match_id });
      } else if (dir === 'super_like' && res.super_sent) {
        toast('⭐ Super Like sent!', { duration: 2000 });
      }
    } catch {}
    finally { setSwiping(false); }
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
      toast.success('Report submitted 🙏');
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}>
          binder 🔥
        </h1>
        <div className="flex items-center gap-2">
          {/* Distance filter pill */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${maxKm ? 'bg-[#FF4458]/15 border-[#FF4458]/40 text-[#FF4458]' : 'bg-white/8 border-white/10 text-white/50'}`}
            >
              📍 {maxKm ? `${maxKm} km` : 'Any dist.'}
            </button>
            {showFilters && (
              <div className="absolute top-10 right-0 z-50 bg-[#1A1A1F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-36">
                {KM_OPTIONS.map(opt => (
                  <button key={String(opt.value)} onClick={() => {
                    setMaxKm(opt.value);
                    setShowFilters(false);
                    loadProfiles(true, opt.value);
                  }} className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/8 ${maxKm === opt.value ? 'text-[#FF4458] font-semibold' : 'text-white/70'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => router.push('/settings')}
            className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
            <span className="text-lg">⚙️</span>
          </button>
          <button onClick={() => loadProfiles(true)}
            className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
            <RefreshCw size={15} className="text-white/50" />
          </button>
        </div>
      </div>

      {/* Super Like Banner */}
      <AnimatePresence>
        {superAnim && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-black font-black text-base px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Star size={16} className="fill-black" /> SUPER LIKE!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {loading ? (
          // Skeleton
          <div className="w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden relative">
            <div className="w-full h-full bg-white/5 animate-pulse" />
            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
              <div className="h-7 bg-white/10 rounded-xl w-36 animate-pulse" />
              <div className="h-4 bg-white/5 rounded-lg w-48 animate-pulse" />
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 px-8">
            <span className="text-7xl block">🌍</span>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              You've seen everyone!
            </h2>
            <p className="text-white/40 text-sm">New people join every day. Check back soon!</p>
            <button className="btn-primary" onClick={() => loadProfiles(true)}>
              <span className="flex items-center justify-center gap-2"><RefreshCw size={16} /> Refresh</span>
            </button>
          </motion.div>
        ) : (
          <div className="relative w-full" style={{ height: 'min(calc(75vw * 4/3), 520px)', maxHeight: '520px' }}>
            <AnimatePresence>
              {profiles.slice(-3).map((p, i, arr) => (
                <motion.div
                  key={p.user_id}
                  style={{
                    zIndex: i,
                    scale: 1 - (arr.length - 1 - i) * 0.035,
                    y: (arr.length - 1 - i) * -10,
                  }}
                  className="absolute inset-0"
                >
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
            onLike={() => { handleSwipe('like'); }}
            onPass={() => { handleSwipe('pass'); }}
            onSuperLike={() => { handleSwipe('super_like'); }}
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
