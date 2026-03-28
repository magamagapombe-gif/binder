'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { useWebSocket, sendWs } from '@/hooks/useWebSocket';
import {
  LiveKitRoom, VideoConference, RoomAudioRenderer,
  useParticipants, useLocalParticipant,
} from '@livekit/components-react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { motion } from 'framer-motion';
import '@livekit/components-styles';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Send a WS message, retrying up to ~5s if socket isn't open yet */
function sendWhenReady(data: any, attempts = 10) {
  if (sendWs(data)) return;
  if (attempts <= 0) return;
  setTimeout(() => sendWhenReady(data, attempts - 1), 500);
}

// ── In-call UI ────────────────────────────────────────────────────────────────
function CallUI({ isVideo, partnerName, partnerPhoto, matchId, roomId, onEnd }: {
  isVideo: boolean; partnerName: string; partnerPhoto?: string;
  matchId: string; roomId: string; onEnd: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(!isVideo);
  const [duration, setDuration] = useState(0);
  const connected = participants.length > 1;

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-dvh flex flex-col bg-[#0A0A0C]">
      {isVideo ? (
        <div className="flex-1 relative"><VideoConference /></div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="relative">
            {connected && (
              <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-[40px]"
                style={{ background: 'rgba(255,68,88,0.3)' }} />
            )}
            {partnerPhoto
              ? <img src={partnerPhoto} alt={partnerName} className="w-32 h-32 rounded-[32px] object-cover relative z-10 shadow-2xl" />
              : <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-[#FF4458] to-[#FF6B6B] flex items-center justify-center text-5xl relative z-10 shadow-2xl">
                  {partnerName?.[0]?.toUpperCase() || '?'}
                </div>}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{partnerName}</h2>
            <p className="text-white/40 mt-1 text-sm">{connected ? fmt(duration) : 'Ringing…'}</p>
          </div>
          <RoomAudioRenderer />
        </div>
      )}

      <div className="flex items-center justify-center gap-5 py-8 px-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={async () => { try { await localParticipant.setMicrophoneEnabled(muted); setMuted(m => !m); } catch {} }}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: muted ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {muted ? <MicOff size={22} className="text-white/60" /> : <Mic size={22} className="text-white" />}
        </motion.button>
        {isVideo && (
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={async () => { try { await localParticipant.setCameraEnabled(videoOff); setVideoOff(v => !v); } catch {} }}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: videoOff ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {videoOff ? <VideoOff size={22} className="text-white/60" /> : <Video size={22} className="text-white" />}
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.88 }} onClick={onEnd}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#FF4458,#CC2F42)', boxShadow: '0 8px 32px rgba(255,68,88,0.45)' }}>
          <PhoneOff size={26} className="text-white" />
        </motion.button>
      </div>
    </div>
  );
}

// ── Outgoing ringing screen ───────────────────────────────────────────────────
function OutgoingRinging({ partnerName, partnerPhoto, isVideo, onCancel }: {
  partnerName: string; partnerPhoto?: string; isVideo: boolean; onCancel: () => void;
}) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-[#0A0A0C] px-8">
      <div className="relative">
        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-[40px]"
          style={{ background: isVideo ? 'rgba(99,179,237,0.3)' : 'rgba(72,187,120,0.3)' }} />
        {partnerPhoto
          ? <img src={partnerPhoto} alt={partnerName} className="w-32 h-32 rounded-[32px] object-cover relative z-10 shadow-2xl" />
          : <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-[#FF4458] to-[#FF6B6B] flex items-center justify-center text-5xl relative z-10 shadow-2xl">
              {partnerName?.[0]?.toUpperCase() || '?'}
            </div>}
      </div>
      <div className="text-center">
        <p className="text-white/40 text-sm mb-1">{isVideo ? 'Video call' : 'Voice call'}</p>
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{partnerName}</h2>
        <p className="text-white/35 mt-2 text-sm">Ringing{dots}</p>
      </div>
      <motion.button whileTap={{ scale: 0.88 }} onClick={onCancel}
        className="mt-8 w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#FF4458,#CC2F42)', boxShadow: '0 8px 32px rgba(255,68,88,0.4)' }}>
        <PhoneOff size={26} className="text-white" />
      </motion.button>
      <p className="text-white/20 text-xs">Tap to cancel</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { profile } = useStore();

  const [token, setToken] = useState('');
  const [lkUrl, setLkUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [callState, setCallState] = useState<'outgoing' | 'incall'>('outgoing');

  const isVideo = params.get('video') === 'true';
  const partnerName = decodeURIComponent(params.get('name') || 'Match');
  const partnerPhoto = params.get('photo') ? decodeURIComponent(params.get('photo')!) : undefined;
  const matchId = params.get('match_id') || roomId;
  const isCaller = params.get('caller') !== 'false';

  // Listen for call_accept / call_reject / call_end on the shared WS bus
  useWebSocket((msg) => {
    if (msg.type === 'call_accept' && msg.room_id === roomId) {
      setCallState('incall');
    }
    if (msg.type === 'call_reject' && msg.room_id === roomId) {
      router.replace('/messages');
    }
    if (msg.type === 'call_end' && msg.room_id === roomId) {
      router.replace('/messages');
    }
  });

  useEffect(() => {
    api.getCallToken(roomId, profile?.name || 'User')
      .then(({ token: t, livekit_url }) => {
        if (!livekit_url || livekit_url.includes('your-livekit')) {
          setError('Calls not configured. Add LIVEKIT_* env vars to backend .env');
          return;
        }
        setToken(t);
        setLkUrl(livekit_url);

        if (isCaller) {
          // Send invite — retry until WS is ready (it may still be connecting)
          sendWhenReady({
            type: 'call_invite',
            match_id: matchId,
            room_id: roomId,
            is_video: isVideo,
            caller_name: profile?.name || 'Someone',
            caller_photo: profile?.photos?.[0] || '',
          });
        } else {
          // We are the callee who already accepted — go straight to in-call
          setCallState('incall');
        }
      })
      .catch(e => setError(e.message || 'Failed to connect'))
      .finally(() => setLoading(false));
  }, []);

  function handleCancel() {
    sendWs({ type: 'call_end', match_id: matchId, room_id: roomId });
    router.replace('/messages');
  }

  function handleEnd() {
    sendWs({ type: 'call_end', match_id: matchId, room_id: roomId });
    router.replace('/messages');
  }

  if (loading) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#0A0A0C]">
      <div className="w-14 h-14 rounded-full border-2 border-[#FF4458] border-t-transparent animate-spin" />
      <p className="text-white/40 text-sm">Connecting…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-5 px-8 text-center bg-[#0A0A0C]">
      <div className="text-5xl">📵</div>
      <h2 className="text-xl font-bold text-white">Can't connect</h2>
      <p className="text-white/40 text-sm leading-relaxed">{error}</p>
      <button onClick={() => router.back()}
        className="mt-2 px-6 py-3 rounded-2xl text-sm font-medium text-white"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
        Go back
      </button>
    </div>
  );

  if (isCaller && callState === 'outgoing') {
    return <OutgoingRinging partnerName={partnerName} partnerPhoto={partnerPhoto} isVideo={isVideo} onCancel={handleCancel} />;
  }

  return (
    <LiveKitRoom token={token} serverUrl={lkUrl} connect audio video={isVideo} onDisconnected={handleEnd}>
      <CallUI isVideo={isVideo} partnerName={partnerName} partnerPhoto={partnerPhoto} matchId={matchId} roomId={roomId} onEnd={handleEnd} />
    </LiveKitRoom>
  );
}
