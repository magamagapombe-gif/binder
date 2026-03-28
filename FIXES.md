# Binder — Bug Fixes & Feature Additions

## 1. ✅ Calls Fixed (WhatsApp-style signaling)

### Root Cause
The call page silently joined a LiveKit room with no notification to the other user.
The other person had to manually navigate to the same URL to "connect" — that's why it felt like both sides had to press call.

### What Changed
**`backend/src/services/websocket.js`**
- Added 4 new WebSocket message types:
  - `call_invite` — caller sends this immediately; callee's phone rings
  - `call_accept` — callee sends this when they tap Accept; caller moves from "Ringing" → in-call
  - `call_reject` — callee sends this when they decline; caller gets redirected
  - `call_end` — either side sends this to cancel/hang up

**`frontend/src/app/calls/[roomId]/page.tsx`** — full rewrite
- Caller flow: joins LiveKit → sends `call_invite` over WS → shows "Ringing…" screen → when `call_accept` received, shows the live call
- Callee flow: receives `call_invite` in overlay → taps Accept → navigates to call page with `caller=false` → goes straight to in-call
- Added call timer, pulsing avatar ring, proper cancel/end logic

**`frontend/src/hooks/useIncomingCall.ts`** (new)
- Global WS listener for `call_invite`
- Plays ringtone, exposes `accept()` and `reject()` functions
- `accept()` returns the route to navigate to

**`frontend/src/components/ui/IncomingCallOverlay.tsx`** (new)
- Slide-down banner (like WhatsApp) with pulsing ring around caller avatar
- Accept (green) and Decline (red) buttons
- Shows video vs voice call type

**`frontend/src/app/messages/[matchId]/page.tsx`**
- Call buttons now pass `photo`, `match_id`, and `caller=true` params
- Uses `initiateCall(isVideo)` helper

### How to use
URL for caller: `/calls/ROOM_ID?name=NAME&photo=PHOTO_URL&video=true&match_id=MATCH_ID&caller=true`
URL for callee (set by `useIncomingCall.accept()`): same but `caller=false`

---

## 2. ✅ Push Notifications (Tinder-style)

### What Changed
**`backend/src/routes/notifications.js`** (new)
- `POST /api/notifications/subscribe` — saves Web Push subscription to Supabase
- `DELETE /api/notifications/subscribe` — removes subscription
- `GET /api/notifications/vapid-public-key` — returns public key to client
- Exports `pushToUser(userId, payload)` helper for other routes to call

**`frontend/public/sw.js`** (new service worker)
- Handles `push` events → shows OS notification
- Handles `notificationclick` → opens the correct page

**`frontend/src/hooks/useNotifications.ts`** (new)
- Registers the service worker
- Requests permission after 3 seconds (Tinder pattern — not on page load)
- Sends subscription to backend

**`frontend/src/components/ui/NotificationsInit.tsx`** (new)
- Mounted in layout, only fires when user is logged in

**`frontend/src/app/layout.tsx`** — updated
- Mounts `IncomingCallOverlay` globally
- Mounts `NotificationsInit` globally

### Setup Required
1. Run `node generate-vapid-keys.js` in backend folder
2. Add the 3 VAPID env vars to backend `.env`
3. Run the SQL migration: `backend/migrations/003_push_subscriptions.sql`
4. Install: `npm install web-push` in backend

### Sending a push from backend (example)
```js
const { pushToUser } = require('./routes/notifications');
await pushToUser(userId, {
  title: '❤️ New Match!',
  body: 'You matched with Amara',
  url: '/matches',
  tag: 'match',
});
```

---

## 3. ✅ Who Liked Me — Fixed

### Root Cause
- Clicking a like card routed to `/discover` (wrong — user couldn't see who liked them)
- No profile detail was shown

### What Changed
**`frontend/src/app/matches/page.tsx`** — full rewrite
- Tapping a like card now opens a **bottom sheet** with the person's full photo, name, age, country
- Shows a "Super Liked" badge if applicable
- Two buttons: Close or "Go Discover" (which takes you to swipe on them)
- The grid layout is preserved, cards are fully visible (no blur)

---

## 4. ✅ Chat Page — Complete Redesign

### What Changed
**`frontend/src/app/messages/[matchId]/page.tsx`** — full rewrite
- New color scheme: dark charcoal `#0D0D0F` bg, red gradient bubbles for sender
- **Bubble grouping**: consecutive messages from same sender are visually grouped; only the last shows the partner's avatar
- **Starter messages**: when chat is empty, quick-tap openers appear ("Hey! 👋", "How's it going?")
- Round avatar in header (was square), pill online indicator
- Send button animates in/out — replaced by emoji icon when input is empty
- Throttled typing indicator (max 1 event per 2s instead of every keystroke)
- Image preview, report & block sheets redesigned
- Call buttons in header now pass correct params for the new call flow

**`frontend/src/app/messages/page.tsx`** — full rewrite
- Cleaner list with round avatars, red ring on unread
- Collapsible search bar (tap icon to expand)
- Empty state with contextual message
- Unread time shown in red

---

## Environment Variables Needed

### Backend `.env`
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
ALLOWED_ORIGINS=https://yourfrontend.com
LIVEKIT_API_KEY=...          # for calls
LIVEKIT_API_SECRET=...       # for calls
LIVEKIT_URL=wss://...        # for calls
VAPID_PUBLIC_KEY=...         # for push notifications
VAPID_PRIVATE_KEY=...        # for push notifications
VAPID_EMAIL=hello@domain.com # for push notifications
```
