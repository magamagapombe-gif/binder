const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Swipe
router.post('/swipe', auth, async (req, res) => {
  const { target_id, direction } = req.body;

  await supabase.from('swipes').upsert({
    id: uuidv4(), user_id: req.user.id, target_id, direction, created_at: new Date()
  }, { onConflict: 'user_id,target_id' });

  if (direction !== 'like') return res.json({ match: false });

  const { data: mutual } = await supabase.from('swipes')
    .select('*').eq('user_id', target_id).eq('target_id', req.user.id).eq('direction', 'like').single();

  if (mutual) {
    // Check if match already exists
    const { data: existing } = await supabase.from('matches')
      .select('id')
      .or(`and(user1_id.eq.${req.user.id},user2_id.eq.${target_id}),and(user1_id.eq.${target_id},user2_id.eq.${req.user.id})`)
      .single();

    if (existing) return res.json({ match: true, match_id: existing.id });

    const matchId = uuidv4();
    await supabase.from('matches').insert({
      id: matchId, user1_id: req.user.id, user2_id: target_id, created_at: new Date(),
    });

    // Get partner profile to return
    const { data: partnerProfile } = await supabase.from('profiles')
      .select('user_id, name, photos, age').eq('user_id', target_id).single();

    return res.json({ match: true, match_id: matchId, partner: partnerProfile });
  }

  res.json({ match: false });
});

// Get all matches with last message and partner profile
router.get('/', auth, async (req, res) => {
  const { data: matches, error } = await supabase.from('matches')
    .select('*')
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  if (!matches || matches.length === 0) return res.json([]);

  const partnerIds = matches.map(m => m.user1_id === req.user.id ? m.user2_id : m.user1_id);

  // Fetch partner profiles
  const { data: profiles } = await supabase.from('profiles')
    .select('user_id, name, photos, age, country')
    .in('user_id', partnerIds);

  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

  // Fetch last message for each match
  const matchIds = matches.map(m => m.id);
  const lastMessages = {};
  await Promise.all(matchIds.map(async (mid) => {
    const { data } = await supabase.from('messages')
      .select('content, type, created_at, sender_id, read')
      .eq('match_id', mid)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data?.[0]) lastMessages[mid] = data[0];
  }));

  // Count unread messages
  const unreadCounts = {};
  await Promise.all(matchIds.map(async (mid) => {
    const { count } = await supabase.from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', mid)
      .eq('read', false)
      .neq('sender_id', req.user.id);
    unreadCounts[mid] = count || 0;
  }));

  const result = matches.map(m => {
    const partnerId = m.user1_id === req.user.id ? m.user2_id : m.user1_id;
    return {
      ...m,
      partner: profileMap[partnerId] || null,
      last_message: lastMessages[m.id] || null,
      unread_count: unreadCounts[m.id] || 0,
    };
  });

  res.json(result);
});

// Unmatch
router.delete('/:id', auth, async (req, res) => {
  await supabase.from('matches').delete().eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
