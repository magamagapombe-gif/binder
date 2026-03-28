const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Swipe
router.post('/swipe', auth, async (req, res) => {
  const { target_id, direction } = req.body; // direction: 'like' | 'pass'

  await supabase.from('swipes').upsert({
    id: uuidv4(), user_id: req.user.id, target_id, direction, created_at: new Date()
  }, { onConflict: 'user_id,target_id' });

  if (direction !== 'like') return res.json({ match: false });

  // Check mutual like
  const { data: mutual } = await supabase.from('swipes')
    .select('*').eq('user_id', target_id).eq('target_id', req.user.id).eq('direction', 'like').single();

  if (mutual) {
    const matchId = uuidv4();
    await supabase.from('matches').insert({
      id: matchId,
      user1_id: req.user.id,
      user2_id: target_id,
      created_at: new Date(),
    });
    return res.json({ match: true, match_id: matchId });
  }

  res.json({ match: false });
});

// Get all matches
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase.from('matches')
    .select(`
      *,
      user1:profiles!matches_user1_id_fkey(user_id, name, photos, age),
      user2:profiles!matches_user2_id_fkey(user_id, name, photos, age)
    `)
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const matches = data.map(m => ({
    ...m,
    partner: m.user1_id === req.user.id ? m.user2 : m.user1,
  }));
  res.json(matches);
});

// Unmatch
router.delete('/:id', auth, async (req, res) => {
  await supabase.from('matches').delete().eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
