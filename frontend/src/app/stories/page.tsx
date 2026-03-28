'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import BottomNav from '@/components/layout/BottomNav';

export default function StoriesPage() {
  const { user } = useStore();
  const [stories, setStories] = useState<any[]>([]);
  const [viewing, setViewing] = useState<{ userId: string; index: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<any>(null);

  useEffect(() => { api.getStories().then(setStories).catch(console.error); }, []);

  // Group stories by user
  const grouped = stories.reduce((acc: any, s: any) => {
    const uid = s.user_id;
    if (!acc[uid]) acc[uid] = { profile: s.profiles, stories: [] };
    acc[uid].stories.push(s);
    return acc;
  }, {});
  const groups = Object.values(grouped) as any[];

  function startViewing(userId: string) {
    setViewing({ userId, index: 0 });
    setProgress(0);
    startProgress();
  }

  function startProgress() {
    clearInterval(progressRef.current);
    setProgress(0);
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { nextStory(); return 0; }
        return p + 2;
      });
    }, 100);
  }

  function nextStory() {
    if (!viewing) return;
    const group = grouped[viewing.userId];
    if (viewing.index < group.stories.length - 1) {
      setViewing(v => v ? { ...v, index: v.index + 1 } : null);
      startProgress();
    } else {
      closeViewing();
    }
  }

  function prevStory() {
    if (!viewing || viewing.index === 0) return;
    setViewing(v => v ? { ...v, index: v.index - 1 } : null);
    startProgress();
  }

  function closeViewing() {
    clearInterval(progressRef.current);
    setViewing(null);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await api.postStory(ev.target?.result as string);
        toast.success('Story posted!');
        const s = await api.getStories();
        setStories(s);
      } catch (err: any) { toast.error(err.message); }
    };
    reader.readAsDataURL(file);
  }

  const viewingGroup = viewing ? grouped[viewing.userId] : null;
  const viewingStory = viewingGroup?.stories[viewing?.index ?? 0];

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 py-5">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Stories</h1>
      </div>

      {/* Story circles */}
      <div className="flex gap-4 px-5 overflow-x-auto pb-4">
        {/* Add your story */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()}
            className="w-18 h-18 w-[72px] h-[72px] rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-[#FF4458] transition-colors">
            <Plus size={28} className="text-white/40" />
          </button>
          <span className="text-xs text-white/40">Your story</span>
        </div>

        {groups.map((g: any) => (
          <div key={g.profile?.user_id} className="flex flex-col items-center gap-2 flex-shrink-0">
            <button onClick={() => startViewing(g.profile?.user_id)}
              className="w-[72px] h-[72px] rounded-2xl p-0.5 relative"
              style={{ background: 'linear-gradient(135deg, #FF4458, #FF6B6B, #FFD700)' }}>
              <img src={g.profile?.photos?.[0] || '/placeholder.jpg'} alt={g.profile?.name}
                className="w-full h-full rounded-[10px] object-cover border-2 border-[#0D0D0F]" />
            </button>
            <span className="text-xs text-white/60 truncate w-[72px] text-center">{g.profile?.name}</span>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-white/30 text-sm">Match with someone to see their stories</p>
          </div>
        )}
      </div>

      {/* Story viewer */}
      <AnimatePresence>
        {viewing && viewingStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
            {/* Progress bars */}
            <div className="flex gap-1 p-3 pt-12">
              {viewingGroup.stories.map((_: any, i: number) => (
                <div key={i} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-none"
                    style={{ width: i < viewing.index ? '100%' : i === viewing.index ? `${progress}%` : '0%' }} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3">
              <img src={viewingGroup.profile?.photos?.[0]} className="w-9 h-9 rounded-xl object-cover" alt="" />
              <span className="font-semibold flex-1" style={{ fontFamily: 'var(--font-display)' }}>{viewingGroup.profile?.name}</span>
              <span className="text-white/40 text-xs">{new Date(viewingStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <button onClick={closeViewing}><X size={22} /></button>
            </div>

            {/* Media */}
            <div className="flex-1 relative" onClick={nextStory}>
              <img src={viewingStory.media_url} alt="" className="w-full h-full object-cover" />
              {viewingStory.caption && (
                <div className="absolute bottom-8 inset-x-0 px-6">
                  <p className="text-white text-center text-lg font-medium drop-shadow-lg">{viewingStory.caption}</p>
                </div>
              )}
              {/* tap zones */}
              <div className="absolute inset-0 flex">
                <div className="w-1/3 h-full" onClick={e => { e.stopPropagation(); prevStory(); }} />
                <div className="w-2/3 h-full" onClick={nextStory} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
