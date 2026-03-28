const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../utils/supabase');
const webpush = require('web-push');

// Configure VAPID — set these in your backend .env
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'hello@binder.app'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Save push subscription for a user
router.post('/subscribe', auth, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription required' });

  await supabase.from('push_subscriptions').upsert({
    user_id: req.user.id,
    subscription: JSON.stringify(subscription),
    updated_at: new Date(),
  }, { onConflict: 'user_id' });

  res.json({ success: true });
});

// Remove subscription (user disabled notifications)
router.delete('/subscribe', auth, async (req, res) => {
  await supabase.from('push_subscriptions').delete().eq('user_id', req.user.id);
  res.json({ success: true });
});

// Get VAPID public key for the client
router.get('/vapid-public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || null });
});

// Internal helper — send push to a user (called from other routes)
async function pushToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY) return; // not configured

  const { data } = await supabase.from('push_subscriptions')
    .select('subscription').eq('user_id', userId).single();

  if (!data?.subscription) return;

  try {
    await webpush.sendNotification(JSON.parse(data.subscription), JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired — remove it
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
    }
  }
}

module.exports = { router, pushToUser };
