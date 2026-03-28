const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');
const axios = require('axios');

// Submit liveness check result (FaceIO callback or client-confirmed)
router.post('/liveness', auth, async (req, res) => {
  const { faceio_payload } = req.body;

  // FaceIO returns a payload after successful liveness check on the client
  // We record it server-side and mark user as verified
  if (!faceio_payload) return res.status(400).json({ error: 'No verification payload' });

  const { error } = await supabase.from('users')
    .update({ is_verified: true, verified_at: new Date(), face_payload: faceio_payload })
    .eq('id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ verified: true });
});

// Get verification status
router.get('/status', auth, async (req, res) => {
  const { data } = await supabase.from('users').select('is_verified, verified_at').eq('id', req.user.id).single();
  res.json(data || { is_verified: false });
});

module.exports = router;
