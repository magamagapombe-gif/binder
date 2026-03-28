const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');

// Get my profile
router.get('/me', auth, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', req.user.id).single();
  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
});

// Create/update profile
router.post('/', auth, async (req, res) => {
  const { name, age, gender, interested_in, bio, location_lat, location_lng, country } = req.body;
  const allowed = ['UG', 'KE', 'TZ'];
  if (country && !allowed.includes(country)) return res.status(403).json({ error: 'App only available in Uganda, Kenya, Tanzania' });

  const { data, error } = await supabase.from('profiles').upsert({
    user_id: req.user.id, name, age, gender, interested_in, bio, location_lat, location_lng, country, updated_at: new Date(),
  }, { onConflict: 'user_id' }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Upload photo
router.post('/photo', auth, async (req, res) => {
  const { base64, filename } = req.body;
  if (!base64) return res.status(400).json({ error: 'No image' });

  const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
  const path = `${req.user.id}/${Date.now()}-${filename || 'photo.jpg'}`;

  const { error } = await supabase.storage.from('profile-photos').upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
  if (error) return res.status(500).json({ error: error.message });

  const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);

  const { data: profile } = await supabase.from('profiles').select('photos').eq('user_id', req.user.id).single();
  const photos = [...(profile?.photos || []), publicUrl];
  await supabase.from('profiles').update({ photos }).eq('user_id', req.user.id);

  res.json({ url: publicUrl });
});

// Get discovery feed
router.get('/discover', auth, async (req, res) => {
  const { data: myProfile } = await supabase.from('profiles').select('*').eq('user_id', req.user.id).single();
  if (!myProfile) return res.status(400).json({ error: 'Complete your profile first' });

  // Get already swiped
  const { data: swiped } = await supabase.from('swipes').select('target_id').eq('user_id', req.user.id);
  const swipedIds = swiped?.map(s => s.target_id) || [];
  swipedIds.push(req.user.id); // exclude self

  let query = supabase.from('profiles')
    .select('*, users!inner(phone, is_verified)')
    .not('user_id', 'in', `(${swipedIds.join(',') || "''"})`);

  // Only filter by country if the user has a country set
  if (myProfile.country) {
    query = query.eq('country', myProfile.country);
  }

  // Filter by gender preference
  if (myProfile.interested_in && myProfile.interested_in !== 'both') {
    query = query.eq('gender', myProfile.interested_in === 'men' ? 'man' : 'woman');
  }

  query = query.limit(20);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Get profile by id
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

module.exports = router;
