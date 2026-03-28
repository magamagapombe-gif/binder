/**
 * Binder Test User Seeder
 * Creates 100 realistic test users in Supabase
 *
 * Usage (from backend folder):
 *   node -r dotenv/config seed-users.js
 *
 * Or with env vars inline:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node seed-users.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Name pools ───────────────────────────────────────────────────────────────
const names = {
  UG: {
    man:   ['Brian', 'David', 'Joseph', 'Samuel', 'Daniel', 'Michael', 'Emmanuel', 'Ronald',
            'Patrick', 'Ivan', 'Mark', 'Andrew', 'Peter', 'Paul', 'Moses', 'Joshua',
            'Isaac', 'Simon', 'Henry', 'Alex', 'Geoffrey', 'Phillip', 'Robert', 'John'],
    woman: ['Aisha', 'Grace', 'Fatuma', 'Mercy', 'Esther', 'Sandra', 'Lydia', 'Winnie',
            'Brenda', 'Sylvia', 'Sheila', 'Daphne', 'Ritah', 'Prossy', 'Immaculate',
            'Harriet', 'Josephine', 'Annet', 'Judith', 'Juliet', 'Diana', 'Faith', 'Hope', 'Fiona'],
  },
  KE: {
    man:   ['Kelvin', 'Dennis', 'Victor', 'Kevin', 'Collins', 'Edwin', 'Bernard', 'Geoffrey',
            'Otieno', 'Kamau', 'Njoroge', 'Mwangi', 'Ochieng', 'Kipchoge'],
    woman: ['Wanjiru', 'Akinyi', 'Njeri', 'Wambui', 'Zawadi', 'Amina', 'Zuri', 'Leila',
            'Nyambura', 'Wairimu', 'Adhiambo', 'Auma', 'Chebet'],
  },
  TZ: {
    man:   ['Juma', 'Hamisi', 'Hassan', 'Salim', 'Rashid', 'Amani', 'Baraka', 'Jabari',
            'Omari', 'Saidi', 'Idris', 'Farouk'],
    woman: ['Zainab', 'Halima', 'Mariam', 'Rehema', 'Safia', 'Latifa', 'Furaha', 'Neema',
            'Amina', 'Upendo', 'Zawadi', 'Pendo'],
  },
};

const maleBios = [
  'Software engineer by day, foodie by night 🍜',
  'Love hiking the Rwenzori Mountains. Looking for an adventure partner.',
  'Football fanatic. Arsenal supporter. No hate please 😅',
  'Entrepreneur building the next big thing in East Africa 🚀',
  'Chef who loves cooking for others. Will feed you well.',
  'Medical student. Future doctor. Currently surviving on coffee ☕',
  'Musician and music producer. Let me make you a playlist 🎵',
  'Teacher who loves changing lives one lesson at a time.',
  'Gym rat + bookworm. The perfect contradiction 💪📚',
  'Travel lover. Already visited 12 African countries. 42 to go 🌍',
  'Architect designing beautiful spaces. Looking for beautiful people.',
  'Journalist. I ask too many questions — fair warning 😂',
  'Farmer and proud of it. Organic produce is my thing 🌱',
  'Law student. I will not give free legal advice on dates 😂',
  'Photographer. I see the world differently through my lens 📷',
  'Simple guy who loves his mum\'s cooking and Sunday football.',
  'Finance guy. No, I won\'t manage your money on the first date.',
  'Loves gospel music and long walks. Looking for genuine connection.',
  'Big on family, faith, and fun. Let\'s build something real.',
  'Boda boda rider by day, dreamer by night. Life is short 🏍️',
];

const femaleBios = [
  'Interior designer with a passion for beautiful spaces 🏡',
  'Nurse by profession, dancer by passion 💃',
  'Foodie who loves trying new restaurants. Be my food partner.',
  'Entrepreneur running a small fashion brand 👗',
  'University lecturer. Yes I will correct your grammar 😂',
  'Loves nature hikes and photography. Adventure seeker 🌿',
  'Baker and pastry chef. I will definitely spoil you with desserts 🎂',
  'God first. Family second. Everything else after 🙏',
  'Travel blogger documenting East Africa\'s hidden gems.',
  'Fitness coach. Gym is life 🏋️‍♀️',
  'Accountant who loves jazz music. Yes, that\'s a thing 🎷',
  'Writer working on my first novel. You might end up in it 😉',
  'Social entrepreneur changing lives in rural communities.',
  'Fashion designer. Style is everything to me 💅',
  'Pediatric doctor. I love kids but not ready for my own yet 😅',
  'Corporate lawyer who loves Sunday brunches and good wine.',
  'Software developer. Yes, girls code too 💻',
  'Simple girl who values honesty, laughter, and good vibes.',
  'Loves cooking, reading, and long conversations over tea ☕',
  'Passionate about mental health advocacy. Let\'s normalise it.',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAge(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPhone(i) {
  // Use fake numbers that won't collide with real users
  const prefixes = ['+2567099', '+2547099', '+2557099'];
  return pick(prefixes) + String(10000 + i).padStart(5, '0');
}

function getPhotoUrl(gender, seed) {
  // Picsum gives consistent photos per seed — good enough for testing
  return `https://picsum.photos/seed/${gender === 'man' ? 'bm' : 'bf'}${seed}/400/500`;
}

// ─── Build user list ──────────────────────────────────────────────────────────
function buildUsers(count) {
  // country distribution: 60% UG, 25% KE, 15% TZ
  const countryPool = [
    ...Array(36).fill('UG'),
    ...Array(15).fill('KE'),
    ...Array(9).fill('TZ'),
  ];

  const users = [];
  for (let i = 0; i < count; i++) {
    const gender = i < count / 2 ? 'man' : 'woman';
    const country = countryPool[i % countryPool.length];
    const namePool = names[country][gender];
    const interested_in = pick(['men', 'women', 'both']);
    const age = randomAge(19, 34);
    const bio = gender === 'man' ? pick(maleBios) : pick(femaleBios);
    const is_verified = Math.random() > 0.55;

    users.push({
      userId: uuidv4(),
      phone: randomPhone(i),
      name: pick(namePool),
      age,
      gender,
      interested_in,
      bio,
      country,
      photos: [getPhotoUrl(gender, i + 1)],
      is_verified,
    });
  }
  return users;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Binder test user seeder\n');
  console.log('Creating 100 test users...\n');

  const users = buildUsers(100);
  let created = 0;
  let failed = 0;

  for (const u of users) {
    try {
      // Insert user record
      const { error: userError } = await supabase.from('users').insert({
        id: u.userId,
        phone: u.phone,
        is_verified: u.is_verified,
        verified_at: u.is_verified ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      });

      if (userError) {
        console.error(`  ❌ ${u.name}: ${userError.message}`);
        failed++;
        continue;
      }

      // Insert profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: u.userId,
        name: u.name,
        age: u.age,
        gender: u.gender,
        interested_in: u.interested_in,
        bio: u.bio,
        photos: u.photos,
        country: u.country,
        min_age_pref: 18,
        max_age_pref: 40,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error(`  ❌ ${u.name} profile: ${profileError.message}`);
        failed++;
        continue;
      }

      created++;
      const flag = u.country === 'UG' ? '🇺🇬' : u.country === 'KE' ? '🇰🇪' : '🇹🇿';
      const badge = u.is_verified ? ' ✅' : '';
      process.stdout.write(`  ✓ [${String(created).padStart(3)}] ${u.name}, ${u.age} ${flag} | ${u.gender} likes ${u.interested_in}${badge}\n`);

    } catch (err) {
      console.error(`  ❌ Unexpected: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Created: ${created} users`);
  if (failed > 0) console.log(`❌ Failed:  ${failed} users`);
  console.log(`\nLog into Binder and start swiping! 🔥`);
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
