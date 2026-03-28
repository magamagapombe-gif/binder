const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');
const { updateElo, DEFAULT_ELO } = require('../utils/elo');
const { v4: uuidv4 } = require('uuid');

// ── Swipe (with Elo update) ───────────────────────────────────────────────────
router.post('/swipe', auth, async (req, res) => {
  const { target_id, direction } = req.body;
  if (!['like', 'pass', 'super_like'].includes(direction)) {
    return res.status(400).json({ error: 'Invalid direction' });
  }

  // Upsert the swipe
  await supabase.from('swipes').upsert(
    { id: uuidv4(), user_id: req.user.id, target_id, direction, created_at: new Date() },
    { onConflict: 'user_id,target_id' }
  );

  // ── Elo update: update the TARGET's score based on this swipe ──
  try {
    const [{ data: targetProfile }, { data: swiperProfile }, { count: swipesReceived }] = await Promise.all([
      supabase.from('profiles').select('elo_score').eq('user_id', target_id).single(),
      supabase.from('profiles').select('elo_score').eq('user_id', req.user.id).single(),
      supabase.from('swipes').select('id', { count: 'exact', head: true }).eq('target_id', target_id),
    ]);

    const targetElo  = targetProfile?.elo_score  ?? DEFAULT_ELO;
    const swiperElo  = swiperProfile?.elo_score  ?? DEFAULT_ELO;
    const totalSwipes = swipesReceived ?? 0;

    const newElo = updateElo(targetElo, swiperElo, direction, totalSwipes);
    await supabase.from('profiles').update({ elo_score: newElo }).eq('user_id', target_id);
  } catch (eloErr) {
    // Non-fatal — log but don't fail the swipe
    console.error('Elo update failed:', eloErr.message);
  }

  if (direction === 'pass') return res.json({ match: false });

  // Check for mutual like/super_like
  const { data: mutual } = await supabase.from('swipes')
    .select('*')
    .eq('user_id', target_id)
    .eq('target_id', req.user.id)
    .in('direction', ['like', 'super_like'])
    .single();

  if (mutual) {
    const { data: existing } = await supabase.from('matches')
      .select('id')
      .or(`and(user1_id.eq.${req.user.id},user2_id.eq.${target_id}),and(user1_id.eq.${target_id},user2_id.eq.${req.user.id})`)
      .single();

    if (existing) return res.json({ match: true, match_id: existing.id, super: direction === 'super_like' });

    const matchId = uuidv4();
    await supabase.from('matches').insert({
      id: matchId, user1_id: req.user.id, user2_id: target_id, created_at: new Date(),
    });

    const { data: partnerProfile } = await supabase.from('profiles')
      .select('user_id, name, photos, age').eq('user_id', target_id).single();

    return res.json({ match: true, match_id: matchId, partner: partnerProfile, super: direction === 'super_like' });
  }

  if (direction === 'super_like') return res.json({ match: false, super_sent: true });
  res.json({ match: false });
});

// ── Get all matches ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const { data: matches, error } = await supabase.from('matches')
    .select('*')
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  if (!matches || matches.length === 0) return res.json([]);

  const partnerIds = matches.map(m => m.user1_id === req.user.id ? m.user2_id : m.user1_id);
  const matchIds   = matches.map(m => m.id);

  const [{ data: profiles }, { data: allMessages }] = await Promise.all([
    supabase.from('profiles').select('user_id, name, photos, age, country').in('user_id', partnerIds),
    supabase.from('messages')
      .select('id, match_id, content, type, created_at, sender_id, read')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false }),
  ]);

  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

  const lastMessages  = {};
  const unreadCounts  = {};
  matchIds.forEach(mid => { lastMessages[mid] = null; unreadCounts[mid] = 0; });

  (allMessages || []).forEach(m => {
    if (!lastMessages[m.match_id]) lastMessages[m.match_id] = m;
    if (!m.read && m.sender_id !== req.user.id) unreadCounts[m.match_id]++;
  });

  const result = matches.map(m => {
    const partnerId = m.user1_id === req.user.id ? m.user2_id : m.user1_id;
    return {
      ...m,
      partner:       profileMap[partnerId] || null,
      last_message:  lastMessages[m.id]    || null,
      unread_count:  unreadCounts[m.id]    || 0,
    };
  });

  res.json(result);
});

// ── Who liked me (free — Tinder charges for this) ────────────────────────────
router.get('/likes', auth, async (req, res) => {
  const { data: likes, error } = await supabase.from('swipes')
    .select('user_id, direction, created_at')
    .eq('target_id', req.user.id)
    .in('direction', ['like', 'super_like'])
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  if (!likes || likes.length === 0) return res.json([]);

  // Exclude people we've already swiped on
  const { data: ourSwipes } = await supabase.from('swipes').select('target_id').eq('user_id', req.user.id);
  const swiped = new Set((ourSwipes || []).map(s => s.target_id));

  const pending = likes.filter(l => !swiped.has(l.user_id));
  if (pending.length === 0) return res.json([]);

  const { data: profiles } = await supabase.from('profiles')
    .select('user_id, name, age, photos, country')
    .in('user_id', pending.map(l => l.user_id));

  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

  const result = pending
    .map(l => ({ ...profileMap[l.user_id], direction: l.direction, liked_at: l.created_at }))
    .filter(p => p.user_id);

  res.json(result);
});

// ── Unmatch ───────────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  await supabase.from('matches').delete().eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
