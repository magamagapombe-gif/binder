'use client';
import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Shield, ChevronUp } from 'lucide-react';

interface Props {
  profile: any;
  onSwipe: (dir: 'like' | 'pass' | 'super_like') => void;
  onTap?: () => void;
  isTop: boolean;
}

export default function SwipeCard({ profile, onSwipe, onTap, isTop }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -30], [1, 0]);

  // Track pointer movement to distinguish tap vs drag
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  async function handleDragEnd(_: any, info: any) {
    const threshold = 110;
    if (info.offset.x > threshold) {
      await animate(x, 700, { duration: 0.25 });
      onSwipe('like');
    } else if (info.offset.x < -threshold) {
      await animate(x, -700, { duration: 0.25 });
      onSwipe('pass');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }

  const photos = profile.photos?.length ? profile.photos : ['/placeholder.jpg'];
  const countryFlag = profile.country === 'UG' ? '🇺🇬' : profile.country === 'KE' ? '🇰🇪' : '🇹🇿';
  const countryName = profile.country === 'UG' ? 'Uganda' : profile.country === 'KE' ? 'Kenya' : 'Tanzania';

  return (
    <motion.div
      style={{ x, rotate, position: 'absolute', width: '100%', touchAction: 'none', willChange: 'transform' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      dragMomentum={false}
      onDragStart={() => { didDrag.current = false; }}
      onDrag={(_, info) => {
        // Only mark as drag if moved more than 8px
        if (Math.abs(info.offset.x) > 8) didDrag.current = true;
      }}
      onDragEnd={handleDragEnd}
      className="select-none"
    >
      {/* LIKE stamp */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-10 left-5 z-20 pointer-events-none"
      >
        <div className="border-4 border-green-400 rounded-xl px-4 py-1.5 rotate-[-18deg]">
          <span className="text-green-400 font-black text-3xl tracking-widest">LIKE</span>
        </div>
      </motion.div>

      {/* NOPE stamp */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-10 right-5 z-20 pointer-events-none"
      >
        <div className="border-4 border-red-400 rounded-xl px-4 py-1.5 rotate-[18deg]">
          <span className="text-red-400 font-black text-3xl tracking-widest">NOPE</span>
        </div>
      </motion.div>

      {/* Card */}
      <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">

        {/* Photo */}
        <img
          src={photos[photoIdx]}
          alt={profile.name}
          draggable={false}
          className="w-full h-full object-cover"
          style={{ willChange: 'auto' }}
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent pointer-events-none" />

        {/* Photo indicator dots — top center, doesn't block swipe area */}
        {photos.length > 1 && (
          <div className="absolute top-3 inset-x-3 z-10 flex gap-1 pointer-events-none">
            {photos.map((_: string, i: number) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-200 ${i === photoIdx ? 'bg-white' : 'bg-white/35'}`} />
            ))}
          </div>
        )}

        {/* Bottom info + controls — isolated tap area */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: 'var(--font-display)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
                >
                  {profile.name}
                </h2>
                <span className="text-xl text-white/80 font-semibold">{profile.age}</span>
                {(profile.users?.is_verified || profile.is_verified) && (
                  <Shield size={15} className="text-[#FF4458]" />
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-white/75 text-sm mt-1 line-clamp-2 leading-snug">{profile.bio}</p>
              )}

              {/* Country */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-sm">{countryFlag}</span>
                <span className="text-white/45 text-xs">{countryName}</span>
              </div>
            </div>

            {/* Photo nav + expand — right column */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              {/* Expand profile */}
              {onTap && (
                <button
                  onPointerDown={e => { pointerStart.current = { x: e.clientX, y: e.clientY }; }}
                  onPointerUp={e => {
                    if (!pointerStart.current) return;
                    const dx = Math.abs(e.clientX - pointerStart.current.x);
                    const dy = Math.abs(e.clientY - pointerStart.current.y);
                    if (dx < 8 && dy < 8) onTap();
                    pointerStart.current = null;
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur border border-white/25 flex items-center justify-center"
                >
                  <ChevronUp size={18} className="text-white" />
                </button>
              )}

              {/* Prev/Next photo buttons */}
              {photos.length > 1 && (
                <>
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onPointerUp={e => {
                      e.stopPropagation();
                      setPhotoIdx(i => Math.min(photos.length - 1, i + 1));
                    }}
                    className="w-8 h-8 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white text-xs font-bold"
                  >
                    ›
                  </button>
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onPointerUp={e => {
                      e.stopPropagation();
                      setPhotoIdx(i => Math.max(0, i - 1));
                    }}
                    className="w-8 h-8 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white text-xs font-bold"
                  >
                    ‹
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
