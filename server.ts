import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };
import { db } from './src/db/index.ts';
import { articles, corpusDocs, gallery, users, genres } from './src/db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';

// Ensure database tables exist before performing queries
async function initSchema() {
  if (!isSqlAvailable) return;
  try {
    console.log('Initializing database schema if tables do not exist...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Peserta',
        joined_date TEXT NOT NULL,
        password TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        image TEXT,
        summary TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS corpus_docs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        image TEXT,
        summary TEXT,
        document_url TEXT,
        spreadsheet_url TEXT,
        morfologi_url TEXT,
        sintaksis_url TEXT,
        semantik_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        "desc" TEXT NOT NULL,
        image TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS genres (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database schema initialization complete.');
  } catch (err: any) {
    if (!handleSqlError(err)) {
      console.error('Error initializing schema:', err);
    }
  }
}

// Initialize Firebase Admin
if (!getAdminApps().length) {
  initAdminApp({
    projectId: firebaseConfig.projectId,
  });
}
const adminAuth = getAdminAuth();
let isFirebaseAuthAvailable = true;

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Track SQL database availability (only enable if SQL_HOST is provided)
let isSqlAvailable = Boolean(process.env.SQL_HOST);

// In-memory fallback stores
const memoryArticles: any[] = [];
const memoryCorpusDocs: any[] = [];
const memoryGallery: any[] = [];
const memoryGenres: any[] = [
  { id: 'sejarah', name: 'Sejarah' },
  { id: 'ekonomi', name: 'Ekonomi' },
  { id: 'olahraga', name: 'Olahraga' },
  { id: 'agama', name: 'Agama' },
  { id: 'seni_budaya', name: 'Seni Budaya' },
  { id: 'pendidikan_kampus', name: 'Pendidikan Kampus' },
  { id: 'teknologi_riset', name: 'Teknologi & Riset' },
  { id: 'berita_kampus', name: 'Berita Kampus' },
  { id: 'fasilitas_kampus', name: 'Fasilitas Kampus' },
  { id: 'studi_keagamaan', name: 'Studi Keagamaan' },
  { id: 'linguistik_sastra', name: 'Linguistik & Sastra' },
  { id: 'linguistik_komputasi', name: 'Linguistik Komputasi' },
  { id: 'sastra_budaya', name: 'Sastra & Budaya' },
  { id: 'lain_lain', name: 'Lain-lain' }
];
const memoryUsers: any[] = [];

// Helper to handle SQL connection failures gracefully
function handleSqlError(err: any): boolean {
  const fullMessage = String(err?.message || '') + ' ' + String(err?.cause?.message || '') + ' ' + String(err?.cause?.code || '');
  if (
    fullMessage.includes('ECONNREFUSED') ||
    fullMessage.includes('connect') ||
    err?.code === 'ECONNREFUSED' ||
    err?.cause?.code === 'ECONNREFUSED' ||
    !process.env.SQL_HOST
  ) {
    if (isSqlAvailable) {
      console.warn('⚠️ SQL database connection unavailable. Falling back to Firestore & in-memory store.');
      isSqlAvailable = false;
    }
    return true;
  }
  return false;
}

// Seed default data if tables are empty
async function seedDefaultData() {
  if (!isSqlAvailable) return;
  try {
    await initSchema();
    if (!isSqlAvailable) return;
    console.log('Checking database tables to seed default data...');

    // 1. Genres
    const existingGenres = await db.select().from(genres);
    if (existingGenres.length === 0) {
      console.log('Seeding genres...');
      const defaultGenres = [
        { id: 'sejarah', name: 'Sejarah' },
        { id: 'ekonomi', name: 'Ekonomi' },
        { id: 'olahraga', name: 'Olahraga' },
        { id: 'agama', name: 'Agama' },
        { id: 'seni_budaya', name: 'Seni Budaya' },
        { id: 'pendidikan_kampus', name: 'Pendidikan Kampus' },
        { id: 'teknologi_riset', name: 'Teknologi & Riset' },
        { id: 'berita_kampus', name: 'Berita Kampus' },
        { id: 'fasilitas_kampus', name: 'Fasilitas Kampus' },
        { id: 'studi_keagamaan', name: 'Studi Keagamaan' },
        { id: 'linguistik_sastra', name: 'Linguistik & Sastra' },
        { id: 'linguistik_komputasi', name: 'Linguistik Komputasi' },
        { id: 'sastra_budaya', name: 'Sastra & Budaya' },
        { id: 'lain_lain', name: 'Lain-lain' }
      ];
      await db.insert(genres).values(defaultGenres);
    }

    // 2. Gallery
    const existingGallery = await db.select().from(gallery);
    if (existingGallery.length === 0 && false) {
      console.log('Seeding gallery...');
      const defaultGallery = [
        {
          id: 1,
          title: 'Khat Naskh Klasik',
          desc: "Gaya penulisan yang paling umum digunakan dalam mushaf Al-Qur'an karena keterbacaannya yang sangat tinggi. Karakter hurufnya bulat, jelas, dan memiliki struktur anatomi yang konsisten.",
          image: ''
        },
        {
          id: 2,
          title: 'Khat Thuluth Megah',
          desc: 'Dikenal sebagai "rajanya kaligrafi", bergaya megah and sering menghiasi dinding masjid serta kubah besar. Memiliki lekukan tajam, tebal-tipis yang dramatis, dan sangat kompleks.',
          image: ''
        },
        {
          id: 3,
          title: 'Manuskrip Kuno Kajian Linguistik',
          desc: 'Lembaran naskah kuno ber-tasykil yang menunjukkan ketelitian penyalinan karya ilmiah ulama tata bahasa Arab (Nahu-Saraf) di Baghdad abad pertengahan.',
          image: ''
        },
        {
          id: 4,
          title: 'Visualisasi Word Cloud Korpus',
          desc: 'Peta visualisasi frekuensi kata otomatis di mana semakin besar ukuran tulisan Arab, semakin tinggi frekuensi pemunculan kata tersebut di seluruh korpus kita.',
          image: ''
        },
        {
          id: 5,
          title: 'Khat Diwani yang Dinamis',
          desc: 'Gaya kaligrafi resmi yang diciptakan oleh Kekaisaran Ottoman, awalnya dipakai untuk dokumen diplomatik rahasia. Memiliki bentuk huruf melingkar rapat dan estetik.',
          image: ''
        },
        {
          id: 6,
          title: 'Linguistik Komparatif Semit',
          desc: 'Ilustrasi evolusi aksara Arab dari rumpun bahasa Semit purba (Nabatea dan Aramaik) hingga menjelma menjadi sistem ortografi terindah di dunia.',
          image: ''
        }
      ];
      await db.insert(gallery).values(defaultGallery);
    }

    // 3. Users
    const existingUsers = await db.select().from(users);
    const defaultUsers = [
      {
        uid: 'peneliti-auth-uid-placeholder-1',
        name: 'Dr. Ahmad Hasyim',
        email: 'peneliti@korpus.id',
        role: 'Peneliti' as const,
        joinedDate: '2025-01-10',
        password: 'sandi-korpus'
      },
      {
        uid: 'admin-auth-uid-placeholder-1',
        name: 'Administrator Utama',
        email: 'admin@korpus.id',
        role: 'Admin' as const,
        joinedDate: '2025-01-15',
        password: 'sandi-admin'
      },
      {
        uid: 'budi-auth-uid-placeholder-1',
        name: 'Budi Santoso',
        email: 'budi@korpus.id',
        role: 'Peserta' as const,
        joinedDate: '2025-03-22',
        password: 'sandi-korpus'
      },
      {
        uid: 'siti-auth-uid-placeholder-1',
        name: 'Siti Aminah',
        email: 'siti@korpus.id',
        role: 'Peserta' as const,
        joinedDate: '2025-04-05',
        password: 'sandi-korpus'
      },
      {
        uid: 'ali-auth-uid-placeholder-1',
        name: 'Muhammad Ali',
        email: 'ali@korpus.id',
        role: 'Peserta' as const,
        joinedDate: '2025-05-18',
        password: 'sandi-korpus'
      }
    ];

    if (existingUsers.length === 0) {
      console.log('Seeding initial users...');
      await db.insert(users).values(defaultUsers);
    }

    // Connect all PostgreSQL users to Firebase Authentication if they do not exist
    console.log('Syncing all PostgreSQL users with Firebase Authentication...');
    const allUsers = await db.select().from(users);
    for (const u of allUsers) {
      if (!isFirebaseAuthAvailable) {
        break;
      }
      try {
        await adminAuth.getUserByEmail(u.email);
        console.log(`User ${u.email} already exists in Firebase Auth.`);
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found' || authError.message?.includes('user-not-found')) {
          console.log(`Creating user ${u.email} in Firebase Auth...`);
          try {
            let password = 'sandi-korpus';
            if (u.email === 'admin@korpus.id') password = 'sandi-admin';
            
            await adminAuth.createUser({
              uid: u.uid,
              email: u.email,
              password: password,
              displayName: u.name,
              emailVerified: true
            });
            console.log(`Successfully created user ${u.email} in Firebase Auth.`);
          } catch (createErr: any) {
            if (createErr.message?.includes('identitytoolkit') || createErr.message?.includes('API has not been used') || createErr.code?.includes('api-key-not-valid') || createErr.message?.includes('BILLING_NOT_ENABLED')) {
              console.warn(`Firebase Identity Toolkit API is not fully enabled or configured. Bypassing Firebase Auth Sync.`);
              isFirebaseAuthAvailable = false;
              break;
            }
            console.warn(`Failed to create user ${u.email} in Firebase Auth:`, createErr.message);
          }
        } else {
          if (authError.message?.includes('identitytoolkit') || authError.message?.includes('API has not been used') || authError.code?.includes('api-key-not-valid') || authError.message?.includes('BILLING_NOT_ENABLED')) {
            console.warn(`Firebase Identity Toolkit API is not fully enabled or configured. Bypassing Firebase Auth Sync.`);
            isFirebaseAuthAvailable = false;
            break;
          }
          console.warn(`Could not verify user ${u.email} in Firebase Auth:`, authError.message);
        }
      }
    }

    // 4. Articles (News)
    const existingArticles = await db.select().from(articles);
    if (existingArticles.length === 0 && false) {
      console.log('Seeding articles...');
      const defaultArticles = [
        {
          id: 'art-1',
          title: 'Penerapan Metode Baru Pembelajaran Bahasa Arab di Kampus',
          author: 'Prof. Dr. Faisal Amin',
          category: 'Pendidikan Kampus',
          date: '2026-06-15',
          wordCount: 120,
          image: '',
          summary: 'Penelitian terbaru di Departemen Bahasa Arab mengenai efektivitas metode komunikatif-interaktif bagi mahasiswa tingkat awal dalam meningkatkan kefasihan berbicara.',
          content: `Universitas sedang menerapkan kurikulum and metode pengajaran modern untuk pembelajaran bahasa Arab bagi mahasiswa di fakultas. Dosen menggunakan berbagai sarana teknologi canggih di dalam kelas untuk membantu mahasiswa memahami kaidah tata bahasa (nahwu) dengan cepat dan menyenangkan.
Penelitian akademis ini bertujuan agar mahasiswa dapat berbicara dengan lancar dan fasih, serta menulis karya ilmiah dengan gaya bahasa sastra yang tinggi. Mahasiswa berkumpul di ruang kuliah setiap hari untuk berlatih dialog dan berdiskusi dengan para dosen dan pakar bahasa.
Hasil awal dari metode ini menunjukkan keberhasilan yang sangat besar dalam meningkatkan keterampilan mendengar, membaca, dan menulis bagi generasi baru pembelajar bahasa Arab.`
        },
        {
          id: 'art-2',
          title: 'Peran Mahasiswa ArabNet dalam Penelitian Linguistik Komputasi',
          author: 'Dr. Ahmad Fauzi, M.T.',
          category: 'Teknologi & Riset',
          date: '2026-06-20',
          wordCount: 135,
          image: '',
          summary: 'Kolaborasi mahasiswa informatika dan bahasa dalam mengembangkan algoritma tokenisasi otomatis untuk mendeteksi kolokasi kata kerja Arab di platform ArabNet.',
          content: `Mahasiswa program studi Teknik Informatika di universitas mempresentasikan penelitian luar biasa dalam bidang linguistik komputasi untuk bahasa Arab. Penelitian ilmiah ini bertujuan menciptakan algoritma baru untuk menganalisis kata dan teks bahasa Arab secara otomatis tanpa intervensi manual manusia.
Mahasiswa menggunakan teknologi pemrograman modern untuk mengetahui perbedaan makna antar kata dan menghitung tingkat frekuensi kata dalam korpus data. Studi ini sangat membantu dalam membangun kamus komputasi raksasa yang bermanfaat bagi para peneliti di seluruh dunia.
Proyek penelitian ini dibimbing langsung oleh profesor spesialis yang mengarahkan mahasiswa untuk menerapkan standar ilmiah tertinggi dalam mengumpulkan dan mengklasifikasikan data.`
        },
        {
          id: 'art-3',
          title: 'Seminar Internasional Kajian Sastra Arab Kontemporer',
          author: 'Panitia Milad Kampus',
          category: 'Berita Kampus',
          date: '2026-06-28',
          wordCount: 110,
          image: '',
          summary: 'Menghadirkan pembicara internasional, seminar akbar ini mengupas tuntas transformasi puisi dan prosa sastra Arab di era komunikasi digital.',
          content: `Aula konferensi utama universitas menjadi saksi peluncuran forum internasional untuk kajian sastra dan puisi Arab modern. Seminar akbar ini dihadiri oleh banyak akademisi, dosen, dan peneliti dari berbagai fakultas serta lembaga ilmiah.
Sesi-sesi pertemuan membahas keindahan teks sastra serta pentingnya pengajaran retorika (balaghah) dan kritik sastra bagi mahasiswa program pascasarjana di fakultas sastra. Mahasiswa juga mempresentasikan kumpulan makalah ilmiah yang membahas isu identitas dan pembaruan dalam puisi Arab kontemporer.
Pada akhir sesi, seminar merekomendasikan pentingnya mendukung publikasi ilmiah bagi penelitian unggulan serta memperkuat kerjasama akademik antar universitas di wilayah tersebut.`
        },
        {
          id: 'art-4',
          title: 'Pentingnya Perpustakaan Kampus Sebagai Pusat Literasi Arab',
          author: 'Dra. Siti Rahmah, M.Hum',
          category: 'Fasilitas Kampus',
          date: '2026-07-02',
          wordCount: 125,
          image: '',
          summary: 'Perpustakaan pusat menambah ribuan koleksi manuskrip digital dan literatur tata bahasa Arab klasik yang bebas diakses oleh mahasiswa.',
          content: `Perpustakaan universitas dianggap sebagai jantung utama bagi penelitian ilmiah and pengajaran bahasa serta sastra Arab. Perpustakaan ini menyimpan ribuan buku dan manuskrip langka yang dikunjungi oleh mahasiswa dan dosen setiap hari untuk menyusun studi dan riset mereka.
Pihak perpustakaan menyediakan ruang baca yang tenang serta perangkat komputer yang terhubung ke basis data global guna memudahkan proses pencarian sumber dan referensi akademis. Mahasiswa menghabiskan waktu berjam-jam di antara rak-rak untuk mengumpulkan informasi serta membaca buku sejarah dan bahasa.
Manajemen perpustakaan selalu berupaya meningkatkan layanan digital dan menyediakan buku elektronik (e-book) bagi seluruh peneliti untuk memfasilitasi pembelajaran mandiri yang berkelanjutan.`
        },
        {
          id: 'art-5',
          title: 'Kolaborasi Akademik Antara Universitas Timur Tengah dan Kampus Kita',
          author: 'Hubungan Internasional Kampus',
          category: 'Berita Kampus',
          date: '2026-07-05',
          wordCount: 130,
          image: '',
          summary: 'Penandatanganan kerjasama program pertukaran pelajar internasional (student exchange) dan joint research di bidang sastra dan ilmu linguistik.',
          content: `Universitas kita telah menandatangani kesepakatan kerjasama akademik bersama dengan salah satu universitas terkemuka di Timur Tengah untuk memperkuat program pertukaran mahasiswa dan dosen. Kerjasama ini mencakup pemberian beasiswa bagi mahasiswa fakultas bahasa Arab untuk belajar selama dua semester akademik di luar negeri.
Kemitraan ini bertujuan untuk melaksanakan penelitian ilmiah bersama antara para peneliti di bidang linguistik dan sejarah. Dekan fakultas menyatakan kegembiraannya atas kesepakatan ini yang akan membuka cakrawala baru bagi mahasiswa kami untuk merasakan kehidupan universitas yang kaya dan beragam.
Program pertukaran mahasiswa ini akan dimulai pada semester akademik mendatang, yang memungkinkan mahasiswa berinteraksi langsung dengan budaya dan penutur asli bahasa Arab.`
        }
      ];
      await db.insert(articles).values(defaultArticles);
    }

    // 5. Corpus Docs
    const existingCorpusDocs = await db.select().from(corpusDocs);
    if (existingCorpusDocs.length === 0 && false) {
      console.log('Seeding corpus documents...');
      const defaultCorpusDocs = [
        {
          id: 'corp-1',
          title: 'Naskah 1: Pentingnya Ilmu dalam Kehidupan (العلم والتعليم)',
          author: 'Syeikh Abdul Fattah',
          category: 'Studi Keagamaan',
          date: '2025-01-10',
          wordCount: 75,
          image: '',
          summary: 'Naskah klasik berbahasa Arab tentang pentingnya mencari ilmu dan keutamaan para penuntut ilmu di dalam masyarakat.',
          content: `العِلْمُ نُورٌ يَسْعَى الإِنْسَانُ إِلَيْهِ لِيُنِيرَ طَرِيقَهُ فِي الحَيَاةِ وَيَحْصُلَ عَلَى Mَعْرِفَةِ النَّافِعَةِ. كُلُّ مَنْ طَلَبَ العِلْمَ بِإِخْلَاصٍ وَجَدَ النَّجَاحَ وَالتَّوْفِيقَ فِي دُنْيَاهُ وَآخِرَتِهِ.
الدِّرَاسَةُ العِلْمِيَّةُ تُسَاعِدُ الشَّبَابَ عَلَى فَهْمِ مَسْؤُولِيَّتِهِمْ نَحْوَ بِنَاءِ المُجْتَمَعِ القَوِيِّ المَبْنِيِّ عَلَى الحِكْمَةِ وَالمَعْرِفَةِ. يَتَجَمَّعُ الطُّلَّابُ فِي جَامِعَةِ الكُتُبِ وَالمَدَارِسِ لِيَسْتَمِعُوا إِلَى نَصَائِحِ العُلَمَاءِ وَالأَسَاتِذَةِ الكِبَارِ.
إِنَّ طَلَبَ العِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ وَمُسْلِمَةٍ، وَهُوَ السَّبِيلُ الأَسَاسِيُّ لِتَحْقِيقِ التَّقَدُّمِ وَالرِّفْعَةِ بَيْنَ الأُمَمِ.`,
          documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          morfologiUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          sintaksisUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          semantikUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing'
        },
        {
          id: 'corp-2',
          title: 'Naskah 2: Keindahan Tata Bahasa Arab (جمال اللغة العربية)',
          author: 'Prof. Dr. Khalil Ahmad',
          category: 'Linguistik & Sastra',
          date: '2025-03-22',
          wordCount: 82,
          image: '',
          summary: 'Ulasan mengenai karakteristik bahasa Arab, keindahan balaghah (retorika), and keteraturan ilmu nahwu saraf (tata bahasa).',
          content: `اللُّغَةُ العَرَبِيَّةُ مِنْ أَجْمَلِ لُغَاتِ العَالَمِ بِسَبَبِ كَثْرَةِ مُفْرَدَاتِهَا وَدِقَّةِ قَوَاعِدِهَا النَّحْوِيَّةِ وَالصَّرْفِيَّةِ. نَزَلَ القُرْآنُ الكَرِيمُ بِهَذِهِ اللُّغَةِ الشَّرِيفَةِ لِيَكُونَ مُعْجِزَةً خَالِدَةً فِي بَيَانِهَا وَأُسْلُوبِهَا Bَلِيغِ.
يَدْرُسُ مَلَايِينُ النَّاسِ هَذِهِ اللُّغَةَ العَظِيمَةَ لِيَفْهَمُوا تُرَاثَ الإِسْلَامِ وَيَتَذَوَّقُوا شِعْرَ العَرَبِ القَدِيمِ وَالحَدِيثِ فِي دِيوَانِ الأَدَبِ.
الدِّرَاسَةُ اللُّغَوِيَّةُ لِلْقُرْآنِ تَكْشِفُ عَنْ أَسْرَارٍ بَلَاغِيَّةٍ لَا تَنْتَهِي، وَتُعْطِي العَقْلَ قُدْرَةً عَلَى التَّفْكِيرِ العَمِيقِ وَالتَّعْبِيرِ الرَّاقِي عَنِ Mَشَاعِرِ وَالأَفْكَارِ.`,
          documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          morfologiUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          sintaksisUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          semantikUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing'
        },
        {
          id: 'corp-3',
          title: 'Naskah 3: Peran Teknologi dalam Analisis Bahasa (التكنولوجيا واللغة)',
          author: 'Dr. Fuad Masduqi',
          category: 'Linguistik Komputasi',
          date: '2026-02-15',
          wordCount: 52,
          image: '',
          summary: 'Studi komputasi tentang pemanfaatan kecerdasan buatan dan basis data korpus dalam memproses teks bahasa Arab modern.',
          content: `تَدْخُلُ التِّكْنُولُوجْيَا الحَدِيشَةُ فِي خِدْمَةِ اللُّغَةِ العَرَبِيَّةِ عَبْرَ عِلْمِ اللِّسَانِيَّاتِ الحَاسُوبِيَّةِ الَّذِي يَهْدِفُ إِلَى تَسْهِيلِ فَهْمِ الحَاسُوبِ لِلنُّصُوصِ البَشَرِيَّةِ.
يَسْتَخْدِمُ البَاحِثُونَ أَدَوَاتٍ بَرْمَجِيَّةً مُتَطَوِّرَةً لِتَحْلِيلِ كَلِمَاتِ الكُورْبُسِ وَمَعْرِفَةِ تِكْرَارَاتِ الأَلْفَاظِ وَاسْتِخْرَاجِ العَلَاقَاتِ الرَّابِطَةِ بَيْنَهَا بِسُرْعَةٍ وَدِقَّةٍ عَالِيَةٍ.
هَذِهِ الدِّرَاسَةُ التِّكْنُولُوجِيَّةُ تُسَاهِمُ فِي بِنَاءِ مَعَاجِمَ حَاسُوبِيَّةٍ ذَكِيَّةٍ تُسَاعِدُ الطُّلَّابَ وَالمُتَرْجِمِينَ فِي جَمِيعِ أَنْحَاءِ العَالَمِ.`,
          documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          morfologiUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          sintaksisUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          semantikUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing'
        },
        {
          id: 'corp-4',
          title: 'Naskah 4: Nilai Sosial Sastra Klasik (الأدب العربي القديم)',
          author: 'Prof. Dr. Faisal Amin',
          category: 'Sastra Kontemporer',
          date: '2026-05-18',
          wordCount: 56,
          image: '',
          summary: 'Penjelasan mengenai puisi-puisi Arab peninggalan masa lampau yang sarat dengan nilai-nilai kebijaksanaan sosial dan filsafat hidup.',
          content: `الأَدَبُ العَرَبِيُّ القَدِيمُ لَيْسَ مُجَرَّدَ كَلِمَاتٍ جَمِيلَةٍ، بَلْ هُوَ مِرْآةٌ تَعْكِسُ قِيَمَ المُجْتَمَعِ وَأَخْلَاقَهُ مِثْلَ الكَرَمِ وَالشَّجَاعَةِ وَحُبِّ العِلْمِ وَالوَفَاءِ.
تَجِدُ فِي كُتُبِ التَّارِيخِ رِوَايَاتٍ كَثِيرَةً تُظْهِرُ كَيْفَ كَانَ الشِّعْرُ وَسِيلَةً لإِعْلَانِ الحَقِّ وَمُسَاعَدَةِ الفُقَرَاءِ وَنَشْرِ السَّلَامِ بَيْنَ القَبَائِلِ.
دِرَاسَةُ هَذَا الأَدَبِ اليَوْمَ تُقَدِّمُ لِلْأَجْيَالِ الجَدِيدَةِ مَصْدَراً غَنِيّاً لِفَهْمِ الجُذُورِ الثَّقَافِيَّةِ وَالرَّوَابِطِ الإِنْسَانِيَّةِ الَّتِي تَجْمَعُ الشُّعُوبَ.`,
          documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          morfologiUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          sintaksisUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing',
          semantikUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/edit?usp=sharing'
        }
      ];
      await db.insert(corpusDocs).values(defaultCorpusDocs);
    }

    console.log('Database seeding checks complete.');
  } catch (err) {
    console.error('Error seeding default data:', err);
  }
}

// REST API Routes

// 1. Articles (News)
app.get('/api/articles', async (req, res) => {
  if (isSqlAvailable) {
    try {
      const list = await db.select().from(articles).orderBy(desc(articles.date));
      return res.json(list);
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to get articles from DB:', error);
      }
    }
  }
  res.json(memoryArticles);
});

app.post('/api/articles', async (req, res) => {
  const art = req.body;
  if (isSqlAvailable) {
    try {
      const existing = await db.select().from(articles).where(eq(articles.id, art.id));
      if (existing.length > 0) {
        await db.update(articles).set(art).where(eq(articles.id, art.id));
      } else {
        await db.insert(articles).values(art);
      }
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to save article in DB:', error);
      }
    }
  }
  // Sync in-memory fallback
  const idx = memoryArticles.findIndex(a => a.id === art.id);
  if (idx >= 0) {
    memoryArticles[idx] = art;
  } else {
    memoryArticles.unshift(art);
  }
  res.json({ success: true });
});

app.delete('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  if (isSqlAvailable) {
    try {
      await db.delete(articles).where(eq(articles.id, id));
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to delete article in DB:', error);
      }
    }
  }
  const idx = memoryArticles.findIndex(a => a.id === id);
  if (idx >= 0) memoryArticles.splice(idx, 1);
  res.json({ success: true });
});

// 2. Corpus Docs
app.get('/api/corpus_docs', async (req, res) => {
  if (isSqlAvailable) {
    try {
      const list = await db.select().from(corpusDocs).orderBy(desc(corpusDocs.date));
      return res.json(list);
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to get corpus docs from DB:', error);
      }
    }
  }
  res.json(memoryCorpusDocs);
});

app.post('/api/corpus_docs', async (req, res) => {
  const docItem = req.body;
  if (isSqlAvailable) {
    try {
      const existing = await db.select().from(corpusDocs).where(eq(corpusDocs.id, docItem.id));
      if (existing.length > 0) {
        await db.update(corpusDocs).set(docItem).where(eq(corpusDocs.id, docItem.id));
      } else {
        await db.insert(corpusDocs).values(docItem);
      }
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to save corpus doc in DB:', error);
      }
    }
  }
  const idx = memoryCorpusDocs.findIndex(d => d.id === docItem.id);
  if (idx >= 0) {
    memoryCorpusDocs[idx] = docItem;
  } else {
    memoryCorpusDocs.unshift(docItem);
  }
  res.json({ success: true });
});

app.delete('/api/corpus_docs/:id', async (req, res) => {
  const { id } = req.params;
  if (isSqlAvailable) {
    try {
      await db.delete(corpusDocs).where(eq(corpusDocs.id, id));
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to delete corpus doc in DB:', error);
      }
    }
  }
  const idx = memoryCorpusDocs.findIndex(d => d.id === id);
  if (idx >= 0) memoryCorpusDocs.splice(idx, 1);
  res.json({ success: true });
});

// 3. Gallery
app.get('/api/gallery', async (req, res) => {
  if (isSqlAvailable) {
    try {
      const list = await db.select().from(gallery).orderBy(desc(gallery.id));
      return res.json(list);
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to get gallery from DB:', error);
      }
    }
  }
  res.json(memoryGallery);
});

app.post('/api/gallery', async (req, res) => {
  const item = req.body;
  const cleanItem = {
    id: Number(item.id),
    title: item.title,
    desc: item.desc,
    image: item.image || ''
  };
  if (isSqlAvailable) {
    try {
      const existing = await db.select().from(gallery).where(eq(gallery.id, cleanItem.id));
      if (existing.length > 0) {
        await db.update(gallery).set(cleanItem).where(eq(gallery.id, cleanItem.id));
      } else {
        await db.insert(gallery).values(cleanItem);
      }
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to save gallery item in DB:', error);
      }
    }
  }
  const idx = memoryGallery.findIndex(g => g.id === cleanItem.id);
  if (idx >= 0) {
    memoryGallery[idx] = cleanItem;
  } else {
    memoryGallery.unshift(cleanItem);
  }
  res.json({ success: true });
});

app.delete('/api/gallery/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isSqlAvailable) {
    try {
      await db.delete(gallery).where(eq(gallery.id, id));
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to delete gallery item in DB:', error);
      }
    }
  }
  const idx = memoryGallery.findIndex(g => g.id === id);
  if (idx >= 0) memoryGallery.splice(idx, 1);
  res.json({ success: true });
});

// 4. Genres
app.get('/api/genres', async (req, res) => {
  if (isSqlAvailable) {
    try {
      const list = await db.select().from(genres);
      return res.json(list);
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to get genres from DB:', error);
      }
    }
  }
  res.json(memoryGenres);
});

app.post('/api/genres', async (req, res) => {
  const genreItem = req.body;
  if (isSqlAvailable) {
    try {
      const existing = await db.select().from(genres).where(eq(genres.id, genreItem.id));
      if (existing.length > 0) {
        await db.update(genres).set(genreItem).where(eq(genres.id, genreItem.id));
      } else {
        await db.insert(genres).values(genreItem);
      }
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to save genre in DB:', error);
      }
    }
  }
  const idx = memoryGenres.findIndex(g => g.id === genreItem.id);
  if (idx >= 0) {
    memoryGenres[idx] = genreItem;
  } else {
    memoryGenres.push(genreItem);
  }
  res.json({ success: true });
});

app.delete('/api/genres/:id', async (req, res) => {
  const { id } = req.params;
  if (isSqlAvailable) {
    try {
      await db.delete(genres).where(eq(genres.id, id));
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to delete genre in DB:', error);
      }
    }
  }
  const idx = memoryGenres.findIndex(g => g.id === id);
  if (idx >= 0) memoryGenres.splice(idx, 1);
  res.json({ success: true });
});

// 5. Users
app.get('/api/users', async (req, res) => {
  if (isSqlAvailable) {
    try {
      const list = await db.select().from(users).orderBy(desc(users.joinedDate));
      const mapped = list.map(u => ({
        id: u.email,
        name: u.name,
        email: u.email,
        role: u.role,
        joinedDate: u.joinedDate,
        password: u.password || 'sandi-korpus'
      }));
      return res.json(mapped);
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to get users from DB:', error);
      }
    }
  }
  res.json(memoryUsers);
});

app.get('/api/users/:email', async (req, res) => {
  const email = req.params.email.toLowerCase();
  if (isSqlAvailable) {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      if (result.length > 0) {
        const u = result[0];
        return res.json({
          id: u.email,
          name: u.name,
          email: u.email,
          role: u.role,
          joinedDate: u.joinedDate,
          password: u.password || 'sandi-korpus'
        });
      }
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to get user from DB:', error);
      }
    }
  }
  const found = memoryUsers.find(u => u.email === email);
  if (found) {
    return res.json(found);
  }
  res.status(404).json({ error: 'User not found' });
});

app.post('/api/users', async (req, res) => {
  const userItem = req.body;
  const email = userItem.email.toLowerCase();
  const passwordVal = userItem.password || 'sandi-korpus';
  const record = {
    uid: userItem.uid || userItem.id || 'placeholder-uid-' + Date.now(),
    name: userItem.name,
    email: email,
    role: userItem.role || 'Peserta',
    joinedDate: userItem.joinedDate || new Date().toISOString().split('T')[0],
    password: passwordVal
  };

  if (isSqlAvailable) {
    try {
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) {
        await db.update(users).set(record).where(eq(users.email, email));
      } else {
        await db.insert(users).values(record);
      }
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to save user in DB:', error);
      }
    }
  }

  // Sync in-memory user
  const idx = memoryUsers.findIndex(u => u.email === email);
  if (idx >= 0) {
    memoryUsers[idx] = record;
  } else {
    memoryUsers.push(record);
  }

  // Firebase Auth sync
  if (isFirebaseAuthAvailable) {
    try {
      const firebaseUser = await adminAuth.getUserByEmail(email);
      const updateParams: any = { displayName: record.name };
      if (userItem.password) updateParams.password = userItem.password;
      await adminAuth.updateUser(firebaseUser.uid, updateParams);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found' || authError.message?.includes('user-not-found')) {
        try {
          await adminAuth.createUser({
            uid: record.uid,
            email: record.email,
            password: passwordVal,
            displayName: record.name,
            emailVerified: true
          });
        } catch (createErr: any) {
          console.warn(`Failed to create user ${email} in Firebase Auth:`, createErr.message);
        }
      }
    }
  }

  res.json({ success: true });
});

app.delete('/api/users/:email', async (req, res) => {
  const email = req.params.email.toLowerCase();
  if (isSqlAvailable) {
    try {
      await db.delete(users).where(eq(users.email, email));
    } catch (error: any) {
      if (!handleSqlError(error)) {
        console.error('Failed to delete user in DB:', error);
      }
    }
  }
  const idx = memoryUsers.findIndex(u => u.email === email);
  if (idx >= 0) memoryUsers.splice(idx, 1);
  res.json({ success: true });
});

// Helper to strip HTML tags, styles, scripts, and code tags from fetched documents
function cleanExtractedDocText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\\[a-zA-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 6. Document text extraction API for Word and Google Docs links
app.post('/api/parse-doc-text', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL target tidak valid' });
    }

    let targetUrl = url.trim();

    // Handle Base64 Data URL directly
    if (targetUrl.startsWith('data:')) {
      const parts = targetUrl.split(',');
      if (parts.length >= 2) {
        const base64Data = parts[1];
        const buffer = Buffer.from(base64Data, 'base64');
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          if (result.value && result.value.trim()) {
            const cleaned = cleanExtractedDocText(result.value);
            return res.json({ text: cleaned });
          }
        } catch (e) {
          // Fallback to text decoding
        }
        const text = buffer.toString('utf-8');
        const cleaned = cleanExtractedDocText(text);
        return res.json({ text: cleaned });
      }
    }

    // Google Docs document link -> export plain text
    const matchDoc = targetUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    if (matchDoc && matchDoc[1]) {
      targetUrl = `https://docs.google.com/document/d/${matchDoc[1]}/export?format=txt`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Gagal mengambil isi dari link dokumen. Pastikan link publik atau dapat diakses.' });
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text') || contentType.includes('plain')) {
      const text = await response.text();
      const cleaned = cleanExtractedDocText(text);
      return res.json({ text: cleaned });
    }

    // Try mammoth arrayBuffer for docx
    const arrayBuffer = await response.arrayBuffer();
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      if (result.value && result.value.trim()) {
        const cleaned = cleanExtractedDocText(result.value);
        return res.json({ text: cleaned });
      }
    } catch (e) {
      // Fallback
    }

    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(arrayBuffer);
    const cleaned = cleanExtractedDocText(rawText);

    return res.json({ text: cleaned });
  } catch (err: any) {
    console.error('Error parsing doc text:', err);
    return res.status(500).json({ error: 'Gagal mengekstrak teks dari link dokumen.' });
  }
});

// Setup Vite & Static Files serving
async function startServer() {
  try {
    await seedDefaultData();
  } catch (err: any) {
    console.warn('⚠️ Database seeding skipped or failed (Ensure SQL database environment variables are configured on Render):', err.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Aplikasi belum di-build. Pastikan Build Command di Render adalah: npm run build');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
