const router = require('express').Router();
const auth   = require('../middleware/auth');
const supabase = require('../utils/supabase');
const { DEFAULT_ELO } = require('../utils/elo');

// ── Haversine distance (km) between two lat/lng pairs ───────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── GET /me ──────────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', req.user.id).single();
  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
});

// ── POST / (create/update profile) ──────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { name, age, gender, interested_in, bio, location_lat, location_lng, country, min_age_pref, max_age_pref } = req.body;
  const allowed = ['UG', 'KE', 'TZ'];
  if (country && !allowed.includes(country)) return res.status(403).json({ error: 'App only available in Uganda, Kenya, Tanzania' });

  const { data, error } = await supabase.from('profiles').upsert({
    user_id: req.user.id, name, age, gender, interested_in, bio,
    location_lat, location_lng, country,
    min_age_pref: min_age_pref || 18,
    max_age_pref: max_age_pref || 60,
    last_active: new Date(),
    updated_at: new Date(),
  }, { onConflict: 'user_id' }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── POST /photo ──────────────────────────────────────────────────────────────
router.post('/photo', auth, async (req, res) => {
  const { base64, filename } = req.body;
  if (!base64) return res.status(400).json({ error: 'No image' });

  const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
  const path   = `${req.user.id}/${Date.now()}-${filename || 'photo.jpg'}`;

  const { error } = await supabase.storage.from('profile-photos').upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
  if (error) return res.status(500).json({ error: error.message });

  const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);

  const { data: profile } = await supabase.from('profiles').select('photos').eq('user_id', req.user.id).single();
  const photos = [...(profile?.photos || []), publicUrl];
  await supabase.from('profiles').update({ photos }).eq('user_id', req.user.id);

  res.json({ url: publicUrl });
});

// ── GET /discover (Elo-ranked + distance-filtered) ───────────────────────────
//
// Ranking formula (score per candidate):
//   score = elo_score
//         + recency_bonus   (up to +200 for active in last 24h, decays over 7 days)
//         + photo_bonus     (up to +50 for having 3+ photos)
//   Then shuffled lightly (±10%) so the feed doesn't feel mechanical
//
// Distance: if ?max_km is passed (or user set it), candidates beyond that radius
// are filtered out. Falls back to country-level filter if no location data.

router.get('/discover', auth, async (req, res) => {
  const { data: myProfile } = await supabase.from('profiles').select('*').eq('user_id', req.user.id).single();
  if (!myProfile) return res.status(400).json({ error: 'Complete your profile first' });

  // -- Exclusion lists --
  const [{ data: swiped }, { data: blockedData }, { data: blockedByData }] = await Promise.all([
    supabase.from('swipes').select('target_id').eq('user_id', req.user.id),
    supabase.from('blocks').select('blocked_id').eq('blocker_id', req.user.id),
    supabase.from('blocks').select('blocker_id').eq('blocked_id', req.user.id),
  ]);

  const excludeIds = new Set([
    req.user.id,
    ...(swiped       || []).map(s => s.target_id),
    ...(blockedData  || []).map(b => b.blocked_id),
    ...(blockedByData|| []).map(b => b.blocker_id),
  ]);

  // -- Build base query --
  let query = supabase
    .from('profiles')
    .select('*, users!inner(phone, is_verified)')
    .not('user_id', 'in', `(${[...excludeIds].join(',') || "''"})`);

  // Country filter (always applied — app is EA-only)
  if (myProfile.country) query = query.eq('country', myProfile.country);

  // Gender preference
  if (myProfile.interested_in && myProfile.interested_in !== 'both') {
    query = query.eq('gender', myProfile.interested_in === 'men' ? 'man' : 'woman');
  }

  // Age range
  const minAge = parseInt(req.query.min_age) || myProfile.min_age_pref || 18;
  const maxAge = parseInt(req.query.max_age) || myProfile.max_age_pref || 60;
  query = query.gte('age', minAge).lte('age', maxAge);

  // Fetch a larger pool so we can rank + distance-filter client-side
  query = query.limit(200);

  const { data: candidates, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  if (!candidates || candidates.length === 0) return res.json([]);

  // -- Distance filter --
  const maxKm = parseInt(req.query.max_km) || myProfile.max_distance_km || null;
  const myLat = myProfile.location_lat;
  const myLng = myProfile.location_lng;

  let pool = candidates;

  if (maxKm && myLat && myLng) {
    pool = candidates.map(p => {
      const dist = (p.location_lat && p.location_lng)
        ? haversineKm(myLat, myLng, p.location_lat, p.location_lng)
        : null;
      return { ...p, _distance_km: dist };
    }).filter(p => p._distance_km === null || p._distance_km <= maxKm);
  }

  // -- Elo + freshness ranking --
  const now = Date.now();
  const ranked = pool.map(p => {
    const elo = p.elo_score ?? DEFAULT_ELO;

    // Recency bonus: profiles active in last 24h get +200, decays to 0 over 7 days
    let recencyBonus = 0;
    if (p.last_active) {
      const hoursAgo = (now - new Date(p.last_active).getTime()) / 3_600_000;
      if (hoursAgo < 168) { // 7 days
        recencyBonus = Math.round(200 * Math.max(0, 1 - hoursAgo / 168));
      }
    }

    // Photo bonus: reward complete profiles
    const photoBonus = Math.min(50, (p.photos?.length || 0) * 15);

    // Light random jitter (±5%) so repeated fetches feel fresh
    const jitter = 1 + (Math.random() - 0.5) * 0.1;

    const score = (elo + recencyBonus + photoBonus) * jitter;
    return { ...p, _score: score };
  });

  ranked.sort((a, b) => b._score - a._score);

  // Return top 20, strip internal fields
  const result = ranked.slice(0, 20).map(({ _score, _distance_km, ...p }) => p);
  res.json(result);
});

// ── GET /:id ─────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

module.exports = router;
