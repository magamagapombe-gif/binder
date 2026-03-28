# Binder 🔥
Dating app for Uganda 🇺🇬, Kenya 🇰🇪 & Tanzania 🇹🇿

## Stack
- **Frontend**: Next.js 14 + Tailwind → Vercel
- **Backend**: Node.js + Express + WebSocket → Render
- **Database**: Supabase (Postgres + Storage + Realtime)
- **Calls**: LiveKit (WebRTC)
- **SMS OTP**: Africa's Talking
- **Liveness**: FaceIO

---

## Setup

### 1. Supabase
1. Create project at supabase.com
2. Run `supabase_schema.sql` in SQL editor
3. Go to Storage → create buckets: `profile-photos` (public) and `stories` (public)
4. Enable Realtime for `messages` and `stories` tables
5. Copy Project URL and service role key

### 2. Africa's Talking
1. Register at africastalking.com
2. Create an app and get API key
3. Add sender ID `BINDER` (or use sandbox for testing)

### 3. LiveKit
1. Use livekit.io cloud or self-host
2. Get API key, API secret, and server URL

### 4. FaceIO
1. Register at faceio.net
2. Create an app and get the App ID
3. Configure allowed domains

### 5. Backend (Render)
1. Push `backend/` folder to GitHub
2. Create Web Service on render.com
3. Use `render.yaml` or set env vars manually:
   - SUPABASE_URL, SUPABASE_SERVICE_KEY
   - JWT_SECRET (any random 32+ char string)
   - LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL
   - AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME
   - ALLOWED_ORIGINS=https://your-app.vercel.app

### 6. Frontend (Vercel)
1. Push `frontend/` folder to GitHub
2. Import to vercel.com
3. Set environment variables:
   - NEXT_PUBLIC_API_URL=https://your-api.onrender.com
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_LIVEKIT_URL
   - NEXT_PUBLIC_FACEIO_APP_ID

### 7. Local Dev
```bash
# Backend
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev            # runs on :4000

# Frontend
cd frontend
cp .env.example .env.local  # fill in values
npm install
npm run dev            # runs on :3000
```

---

## Features
- Phone OTP login (Africa's Talking SMS)
- Profile creation with photos
- Swipe left/right matching
- Real-time chat with image sharing
- Voice & video calls (LiveKit WebRTC)
- 24-hour stories
- Face liveness verification (FaceIO)
- Country-locked: Uganda, Kenya, Tanzania only

## Monetization (future)
- Super Likes (limited free, unlimited premium)
- Boost profile visibility
- See who liked you
- Rewind last swipe
