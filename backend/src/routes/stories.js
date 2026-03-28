const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Post a story
router.post('/', auth, async (req, res) => {
  const { base64, media_type = 'image', caption } = req.body;
  const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
  const path = `${req.user.id}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage.from('stories').upload(path, buffer, { contentType: 'image/jpeg' });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(path);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const { data, error } = await supabase.from('stories').insert({
    id: uuidv4(), user_id: req.user.id, media_url: publicUrl,
    media_type, caption, expires_at: expiresAt, created_at: new Date(),
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get stories from matches
router.get('/', auth, async (req, res) => {
  const { data: matches } = await supabase.from('matches')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`);

  const partnerIds = (matches || []).map(m => m.user1_id === req.user.id ? m.user2_id : m.user1_id);
  partnerIds.push(req.user.id);

  const { data, error } = await supabase.from('stories')
    .select('*, profiles(name, photos)')
    .in('user_id', partnerIds)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete story
router.delete('/:id', auth, async (req, res) => {
  await supabase.from('stories').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ success: true });
});

module.exports = router;
