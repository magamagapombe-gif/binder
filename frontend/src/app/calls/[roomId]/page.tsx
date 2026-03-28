'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import {
  LiveKitRoom, VideoConference, RoomAudioRenderer, useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';

function CallUI({ isVideo, partnerName, onEnd }: { isVideo: boolean; partnerName: string; onEnd: () => void }) {
  const participants = useParticipants();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(!isVideo);

  return (
    <div className="min-h-dvh flex flex-col bg-[#0D0D0F]">
      {isVideo ? (
        <div className="flex-1 relative">
          <VideoConference />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#FF4458] to-[#FF6B6B] flex items-center justify-center text-5xl shadow-2xl">
            😊
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{partnerName}</h2>
            <p className="text-white/40 mt-1">{participants.length > 1 ? 'Connected' : 'Calling…'}</p>
          </div>
          <RoomAudioRenderer />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 py-8 px-6 border-t border-white/5">
        <button onClick={() => setMuted(m => !m)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-white/20' : 'bg-white/8 border border-white/10'}`}>
          {muted ? <MicOff size={22} className="text-white/60" /> : <Mic size={22} className="text-white" />}
        </button>
        {isVideo && (
          <button onClick={() => setVideoOff(v => !v)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${videoOff ? 'bg-white/20' : 'bg-white/8 border border-white/10'}`}>
            {videoOff ? <VideoOff size={22} className="text-white/60" /> : <Video size={22} className="text-white" />}
          </button>
        )}
        <button onClick={onEnd}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
          style={{ background: 'linear-gradient(135deg, #FF4458, #CC2F42)' }}>
          <PhoneOff size={26} className="text-white" />
        </button>
      </div>
    </div>
  );
}

export default function CallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { profile } = useStore();
  const [token, setToken] = useState('');
  const [lkUrl, setLkUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const isVideo = params.get('video') === 'true';
  const partnerName = params.get('name') || 'Match';

  useEffect(() => {
    api.getCallToken(roomId, profile?.name || 'User').then(({ token, livekit_url }) => {
      setToken(token);
      setLkUrl(livekit_url);
      setLoading(false);
    }).catch(() => router.back());
  }, []);

  if (loading) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-full border-2 border-[#FF4458] border-t-transparent animate-spin" />
      <p className="text-white/40">Connecting…</p>
    </div>
  );

  return (
    <LiveKitRoom token={token} serverUrl={lkUrl} connect audio video={isVideo}
      onDisconnected={() => router.back()}>
      <CallUI isVideo={isVideo} partnerName={partnerName} onEnd={() => router.back()} />
    </LiveKitRoom>
  );
}
