const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('binder_token');
}

async function req(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  sendOtp: (phone: string) => req('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string) => req('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),

  // Profiles
  getMe: () => req('/api/profiles/me'),
  updateProfile: (data: any) => req('/api/profiles', { method: 'POST', body: JSON.stringify(data) }),
  uploadPhoto: (base64: string, filename: string) => req('/api/profiles/photo', { method: 'POST', body: JSON.stringify({ base64, filename }) }),
  discover: () => req('/api/profiles/discover'),
  getProfile: (id: string) => req(`/api/profiles/${id}`),

  // Matches
  swipe: (target_id: string, direction: 'like' | 'pass') => req('/api/matches/swipe', { method: 'POST', body: JSON.stringify({ target_id, direction }) }),
  getMatches: () => req('/api/matches'),
  unmatch: (id: string) => req(`/api/matches/${id}`, { method: 'DELETE' }),

  // Messages
  getMessages: (match_id: string) => req(`/api/messages/${match_id}`),
  sendMessage: (match_id: string, content: string, type = 'text') =>
    req(`/api/messages/${match_id}`, { method: 'POST', body: JSON.stringify({ content, type }) }),
  markRead: (match_id: string) => req(`/api/messages/${match_id}/read`, { method: 'PATCH' }),

  // Stories
  getStories: () => req('/api/stories'),
  postStory: (base64: string, caption?: string) => req('/api/stories', { method: 'POST', body: JSON.stringify({ base64, caption }) }),
  deleteStory: (id: string) => req(`/api/stories/${id}`, { method: 'DELETE' }),

  // Verify
  submitLiveness: (faceio_payload: any) => req('/api/verify/liveness', { method: 'POST', body: JSON.stringify({ faceio_payload }) }),
  getVerifyStatus: () => req('/api/verify/status'),

  // Calls
  getCallToken: (room_name: string, participant_name: string) =>
    req('/api/calls/token', { method: 'POST', body: JSON.stringify({ room_name, participant_name }) }),
};
