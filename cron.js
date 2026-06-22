import dotenv from 'dotenv';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' }); 

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🤖 Asisten Cron Job jalan! Nunggu perintah...');

// FORMAT TES: '* * * * *' (Setiap menit)
cron.schedule('0 0 * * *', async () => {
  console.log('⚡ Menginjeksi jadwal Productivity Engine ke daily_tasks...');
  // Bikin tanggal otomatis buat hari ini (Format: YYYY-MM-DD pakai zona waktu WIB/Jakarta)
  const hariIni = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  // Format array object disamakan PERSIS dengan kolom di Supabase lu
  const jadwalHariIni = [
    { task_name: '05:00 - 06:00 🏃‍♂️ Morning Cardio', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '06:00 - 09:00 🏋️‍♂️ Beast Mode Workout', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '09:00 - 10:30 🍳🚿 Recharge & Fresh', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '10:30 - 13:00 📚 Study Session 1', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '13:00 - 14:00 🍱 ISHOMA + Chill', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '14:00 - 16:30 📚 Study Session 2', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '16:30 - 17:00 🍩 Sore Break', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '17:00 - 19:30 🎮💰 Growtopia Grinding', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '19:30 - 22:00 🛋️✨ Me-Time / Chill Maksimal', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' },
    { task_name: '22:00 - 05:00 😴 Deep Sleep Mode', task_date: hariIni, is_completed: false, pillar: 'ZERO PROJECT' }
  ];

  const { data, error } = await supabase
    .from('daily_tasks') 
    .insert(jadwalHariIni);

  if (error) {
    console.error('❌ Gagal ngisi jadwal:', error.message);
  } else {
    console.log('✅ Jadwal hari ini sukses di-generate! Cek tabel daily_tasks lu.');
  }
});