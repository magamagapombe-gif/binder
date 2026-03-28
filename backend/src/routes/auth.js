const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');

let AfricasTalking;
try {
  AfricasTalking = require('africastalking')({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME,
  });
} catch {}

const otpStore = new Map();

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const key = phone.replace(/\s/g, '');
  otpStore.set(key, { otp, expires: Date.now() + 10 * 60 * 1000 });

  // Always log OTP for debugging
  console.log(`[OTP] Phone: ${key} | Code: ${otp}`);

  try {
    if (AfricasTalking) {
      const sms = AfricasTalking.SMS;
      await sms.send({ to: [phone], message: `Your Binder code: ${otp}. Expires in 10 mins.`, from: 'BINDER' });
      console.log(`[OTP] SMS sent successfully to ${key}`);
    }
  } catch (err) {
    console.error(`[OTP] SMS failed:`, err.message);
    // Still return success — user can get code from logs
  }

  res.json({ message: 'OTP sent' });
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  const key = phone.replace(/\s/g, '');
  const record = otpStore.get(key);

  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  otpStore.delete(key);

  let { data: user } = await supabase.from('users').select('*').eq('phone', key).single();
  if (!user) {
    const { data, error } = await supabase.from('users').insert({ id: uuidv4(), phone: key }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    user = data;
  }

  // Check if profile exists and has required fields (name) to determine if new
  const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', user.id).single();
  const isNew = !profile || !profile.name;

  const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user, isNew });
});

module.exports = router;