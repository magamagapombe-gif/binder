const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get messages for a match
router.get('/:match_id', auth, async (req, res) => {
  const { data, error } = await supabase.from('messages')
    .select('*').eq('match_id', req.params.match_id)
    .order('created_at', { ascending: true }).limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Send message (REST fallback — primary is WebSocket)
router.post('/:match_id', auth, async (req, res) => {
  const { content, type = 'text' } = req.body;
  const { data, error } = await supabase.from('messages').insert({
    id: uuidv4(),
    match_id: req.params.match_id,
    sender_id: req.user.id,
    content,
    type,
    created_at: new Date(),
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Mark messages as read
router.patch('/:match_id/read', auth, async (req, res) => {
  await supabase.from('messages')
    .update({ read: true })
    .eq('match_id', req.params.match_id)
    .neq('sender_id', req.user.id);
  res.json({ success: true });
});

module.exports = router;
