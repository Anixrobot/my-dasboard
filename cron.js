import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Ini buat ngebaca .env.local kalau lu ngetes di laptop (di GitHub ini bakal di-skip)
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🤖 Mengeksekusi jadwal harian ke Supabase...');

const hariIni = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

const jadwalHariIni = [
  { task_name: '05:00 - 06:00 🏃 Morning Cardio', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '06:00 - 09:00 🏋️ Beast Mode Workout', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '09:00 - 10:30 🚀 Recharge & Fresh', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '10:30 - 13:00 📚 Study Session 1', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '13:00 - 14:00 🥗 ISHOMA + Chill', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '14:00 - 16:30 📚 Study Session 2', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '16:30 - 17:00 🛑 Sore Break', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '17:00 - 19:30 🎮 Growtopia Grinding', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '19:30 - 22:00 ✨ Me-Time / Chill Maksimal', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
  { task_name: '22:00 - 05:00 😴 Deep Sleep Mode', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' }
];

// Langsung jalankan fungsi insert tanpa dibungkus cron.schedule
const insertData = async () => {
  const { data, error } = await supabase
    .from('daily_tasks')
    .insert(jadwalHariIni);

  if (error) {
    console.error('❌ Gagal ngisi jadwal:', error.message);
    process.exit(1); // Wajib ada: Kasih sinyal error ke GitHub Actions kalau gagal
  } else {
    console.log('✅ Jadwal hari ini sukses di-generate!');
    process.exit(0); // Wajib ada: Kasih sinyal sukses ke GitHub Actions 
  }
};

insertData();