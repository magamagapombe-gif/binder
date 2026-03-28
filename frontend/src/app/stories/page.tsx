'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import BottomNav from '@/components/layout/BottomNav';

export default function StoriesPage() {
  const { user } = useStore();
  const [stories, setStories] = useState<any[]>([]);
  const [viewing, setViewing] = useState<{ userId: string; index: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<any>(null);

  useEffect(() => { api.getStories().then(setStories).catch(console.error); }, []);

  // Group stories by user — fix: backend returns s.profile (not s.profiles)
  const grouped = stories.reduce((acc: any, s: any) => {
    const uid = s.user_id;
    if (!acc[uid]) acc[uid] = { profile: s.profile, stories: [] };
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
    if (!group) return;
    if (viewing.index < group.stories.length - 1) {
      setViewing(v => v ? { ...v, index: v.index + 1 } : null);
      startProgress();
    } else {
      // Go to next group
      const groupKeys = Object.keys(grouped);
      const currentGroupIdx = groupKeys.indexOf(viewing.userId);
      if (currentGroupIdx < groupKeys.length - 1) {
        const nextUserId = groupKeys[currentGroupIdx + 1];
        setViewing({ userId: nextUserId, index: 0 });
        startProgress();
      } else {
        closeViewing();
      }
    }
  }

  function prevStory() {
    if (!viewing) return;
    if (viewing.index > 0) {
      setViewing(v => v ? { ...v, index: v.index - 1 } : null);
      startProgress();
    }
  }

  function closeViewing() {
    clearInterval(progressRef.current);
    setViewing(null);
  }

  async function handleDeleteStory(storyId: string) {
    try {
      await api.deleteStory(storyId);
      toast.success('Story deleted');
      closeViewing();
      const s = await api.getStories();
      setStories(s);
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await api.postStory(ev.target?.result as string);
        toast.success('Story posted! 🔥');
        const s = await api.getStories();
        setStories(s);
      } catch (err: any) { toast.error(err.message); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const viewingGroup = viewing ? grouped[viewing.userId] : null;
  const viewingStory = viewingGroup?.stories[viewing?.index ?? 0];
  const isMyStory = viewingGroup?.profile?.user_id === user?.id;

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 py-5">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Stories</h1>
        <p className="text-white/30 text-sm mt-1">Disappear in 24 hours</p>
      </div>

      {/* Story circles */}
      <div className="flex gap-4 px-5 overflow-x-auto pb-4 scrollbar-hide">
        {/* Add your story */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()}
            className="w-[72px] h-[72px] rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-[#FF4458] transition-colors relative">
            <Plus size={28} className="text-white/40" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF4458] flex items-center justify-center border-2 border-[#0D0D0F]">
              <Plus size={12} className="text-white" />
            </div>
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
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="text-center space-y-2">
              <p className="text-5xl">📸</p>
              <p className="text-white/30 text-sm">Match with someone to see their stories</p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      {groups.length > 0 && (
        <div className="px-5 mt-4">
          <div className="h-px bg-white/5" />
          <p className="text-white/20 text-xs uppercase tracking-widest mt-4 mb-3">All Stories</p>
          <div className="space-y-3">
            {groups.map((g: any) => (
              <button key={g.profile?.user_id}
                onClick={() => startViewing(g.profile?.user_id)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors text-left">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF4458, #FFD700)', padding: 2 }}>
                  <img src={g.profile?.photos?.[0]} className="w-full h-full rounded-[9px] object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{g.profile?.name}</p>
                  <p className="text-white/35 text-xs">{g.stories.length} {g.stories.length === 1 ? 'story' : 'stories'}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#FF4458]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Story viewer */}
      <AnimatePresence>
        {viewing && viewingStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
            {/* Progress bars */}
            <div className="flex gap-1 p-3 pt-safe" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
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
              <span className="font-semibold flex-1 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                {viewingGroup.profile?.name}
              </span>
              <span className="text-white/40 text-xs">
                {new Date(viewingStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isMyStory && (
                <button onClick={() => handleDeleteStory(viewingStory.id)}
                  className="p-2 text-white/50 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={closeViewing} className="p-2">
                <X size={20} />
              </button>
            </div>

            {/* Media */}
            <div className="flex-1 relative">
              <img src={viewingStory.media_url} alt="" className="w-full h-full object-cover" />
              {viewingStory.caption && (
                <div className="absolute bottom-8 inset-x-0 px-6">
                  <p className="text-white text-center text-lg font-medium drop-shadow-lg">{viewingStory.caption}</p>
                </div>
              )}
              {/* Tap zones */}
              <div className="absolute inset-0 flex">
                <div className="w-1/3 h-full" onClick={prevStory} />
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
