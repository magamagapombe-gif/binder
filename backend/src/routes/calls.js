const router = require('express').Router();
const auth = require('../middleware/auth');
const { AccessToken } = require('livekit-server-sdk');

// Get LiveKit token for a call room
router.post('/token', auth, async (req, res) => {
  const { room_name, participant_name } = req.body;
  if (!room_name) return res.status(400).json({ error: 'room_name required' });

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: req.user.id,
    name: participant_name || req.user.id,
    ttl: 3600,
  });
  at.addGrant({ room: room_name, roomJoin: true, canPublish: true, canSubscribe: true });

  const token = await at.toJwt();
  res.json({ token, livekit_url: process.env.LIVEKIT_URL });
});

module.exports = router;
