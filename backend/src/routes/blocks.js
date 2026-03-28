const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Block a user
router.post('/', auth, async (req, res) => {
  const { blocked_id, reason } = req.body;
  if (!blocked_id) return res.status(400).json({ error: 'blocked_id required' });

  // Upsert block record
  const { error } = await supabase.from('blocks').upsert({
    id: uuidv4(),
    blocker_id: req.user.id,
    blocked_id,
    reason: reason || null,
    created_at: new Date(),
  }, { onConflict: 'blocker_id,blocked_id' });

  if (error) return res.status(500).json({ error: error.message });

  // Remove any match between them
  await supabase.from('matches').delete()
    .or(`and(user1_id.eq.${req.user.id},user2_id.eq.${blocked_id}),and(user1_id.eq.${blocked_id},user2_id.eq.${req.user.id})`);

  res.json({ success: true });
});

// Report a user
router.post('/report', auth, async (req, res) => {
  const { reported_id, reason } = req.body;
  if (!reported_id) return res.status(400).json({ error: 'reported_id required' });

  const { error } = await supabase.from('reports').upsert({
    id: uuidv4(),
    reporter_id: req.user.id,
    reported_id,
    reason: reason || 'inappropriate',
    created_at: new Date(),
  }, { onConflict: 'reporter_id,reported_id' });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// Get my blocked users
router.get('/', auth, async (req, res) => {
  const { data } = await supabase.from('blocks')
    .select('blocked_id').eq('blocker_id', req.user.id);
  res.json((data || []).map(b => b.blocked_id));
});

// Unblock
router.delete('/:blocked_id', auth, async (req, res) => {
  await supabase.from('blocks').delete()
    .eq('blocker_id', req.user.id).eq('blocked_id', req.params.blocked_id);
  res.json({ success: true });
});

module.exports = router;
