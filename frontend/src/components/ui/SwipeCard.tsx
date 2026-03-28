'use client';
import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Shield, MapPin, ChevronUp } from 'lucide-react';

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
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -20], [1, 0]);
  const dragStart = useRef({ x: 0, y: 0, time: 0 });
  const isDragging = useRef(false);

  async function handleDragEnd(_: any, info: any) {
    const threshold = 120;
    if (info.offset.x > threshold) {
      await animate(x, 600, { duration: 0.3 });
      onSwipe('like');
    } else if (info.offset.x < -threshold) {
      await animate(x, -600, { duration: 0.3 });
      onSwipe('pass');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 });
    }
    isDragging.current = false;
  }

  const photos = profile.photos?.length ? profile.photos : ['/placeholder.jpg'];
  const countryFlag = profile.country === 'UG' ? '🇺🇬' : profile.country === 'KE' ? '🇰🇪' : '🇹🇿';
  const countryName = profile.country === 'UG' ? 'Uganda' : profile.country === 'KE' ? 'Kenya' : 'Tanzania';

  return (
    <motion.div style={{ x, rotate, position: 'absolute', width: '100%', touchAction: 'none' }}
      drag={isTop ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.7}
      onDragStart={(_, info) => {
        isDragging.current = false;
        dragStart.current = { x: info.point.x, y: info.point.y, time: Date.now() };
      }}
      onDrag={() => { isDragging.current = true; }}
      onDragEnd={handleDragEnd}
      className="select-none cursor-grab active:cursor-grabbing">

      {/* Like / Pass overlays */}
      <motion.div style={{ opacity: likeOpacity }}
        className="absolute top-10 left-6 z-10 border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-15deg]">
        <span className="text-green-400 font-black text-3xl tracking-wider">LIKE</span>
      </motion.div>
      <motion.div style={{ opacity: passOpacity }}
        className="absolute top-10 right-6 z-10 border-4 border-red-400 rounded-xl px-4 py-2 rotate-[15deg]">
        <span className="text-red-400 font-black text-3xl tracking-wider">NOPE</span>
      </motion.div>

      {/* Card */}
      <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
        {/* Photo tap zones */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full" onClick={(e) => {
            if (isDragging.current) return;
            e.stopPropagation();
            setPhotoIdx(i => Math.max(0, i - 1));
          }} />
          <div className="w-2/3 h-full" onClick={(e) => {
            if (isDragging.current) return;
            e.stopPropagation();
            setPhotoIdx(i => Math.min(photos.length - 1, i + 1));
          }} />
        </div>

        {/* Photo indicators */}
        <div className="absolute top-3 inset-x-3 z-10 flex gap-1">
          {photos.map((_: string, i: number) => (
            <div key={i} className={`h-0.5 flex-1 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>

        <motion.img
          key={photoIdx}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          src={photos[photoIdx]}
          alt={profile.name}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-white drop-shadow" style={{ fontFamily: 'var(--font-display)' }}>
                  {profile.name}
                </h2>
                <span className="text-xl text-white/80 font-semibold">{profile.age}</span>
                {profile.users?.is_verified && (
                  <div className="bg-[#FF4458]/20 rounded-full p-1">
                    <Shield size={14} className="text-[#FF4458]" />
                  </div>
                )}
              </div>
              {profile.bio && (
                <p className="text-white/70 text-sm mt-1 line-clamp-2 leading-snug">{profile.bio}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-base">{countryFlag}</span>
                <span className="text-white/50 text-xs">{countryName}</span>
              </div>
            </div>
            {/* Expand button */}
            {onTap && (
              <button
                onClick={(e) => {
                  if (isDragging.current) return;
                  e.stopPropagation();
                  onTap();
                }}
                className="ml-3 w-10 h-10 rounded-full bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0 z-20 relative">
                <ChevronUp size={18} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
