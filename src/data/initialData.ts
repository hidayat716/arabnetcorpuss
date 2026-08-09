/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Article } from '../types';

// Stop words list (frequently used functional words in Indonesian)
export const ARABIC_STOPWORDS = [
  'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dalam', 'dengan', 'adalah', 'yang', 'itu', 'ini', 'ia', 'kita', 'mereka', 'saya', 'kami', 'atau', 'bahwa', 'oleh', 'juga', 'telah', 'sudah', 'akan', 'bisa', 'dapat', 'karena', 'maka', 'tentang', 'seperti', 'tersebut', 'ada', 'adanya', 'adapun', 'agak', 'agaknya', 'agar', 'akan', 'akankah', 'akhir', 'akhirnya', 'aku', 'maupun', 'olehnya'
];

// Diacritic unicode range (unused for Latin, kept for compatibility)
export const DIACRITICS_REGEX = /[\u064B-\u0652\u0670]/g;

// Normalize text for uniform searching and analysis (supports full Arabic normalization)
export function normalizeArabic(text: string, options: { removeHarakat?: boolean, normalizeAlif?: boolean, normalizeYa?: boolean, normalizeTeh?: boolean } = { removeHarakat: true, normalizeAlif: true, normalizeYa: true, normalizeTeh: false }): string {
  let norm = text.toLowerCase().trim();
  
  // 1. Remove Harakat/Diacritics
  if (options.removeHarakat !== false) {
    norm = norm.replace(/[\u064B-\u0652\u0670]/g, '');
  }
  
  // 2. Normalize Alif variants (أ, إ, آ, ٱ to ا)
  if (options.normalizeAlif !== false) {
    norm = norm.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');
  }
  
  // 3. Normalize Ya / Alif Maqsura (ى to ي)
  if (options.normalizeYa !== false) {
    norm = norm.replace(/\u0649/g, '\u064A');
  }
  
  // 4. Normalize Teh Marbuta (ة to ه)
  if (options.normalizeTeh === true) {
    norm = norm.replace(/\u0629/g, '\u0647');
  }

  return norm;
}

// Tokenize text into words while cleaning punctuation, HTML tags, and code noise
export function tokenizeArabic(text: string): string[] {
  if (!text) return [];

  // 1. Strip HTML tags, scripts, styles, and HTML entities
  const noHtml = text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ');

  // 2. Replace punctuation, special characters, code symbols, and slashes with spaces
  const cleaned = noHtml.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»؛،؟!\\|<>\+\d\[\]]/g, ' ');

  // 3. Filter out empty tokens
  const rawTokens = cleaned.trim().split(/\s+/).filter(word => word.length > 0);

  // Set of HTML/CSS/JS code noise tokens to exclude
  const codeNoise = new Set([
    'div', 'span', 'goog', 'row', 'dir', 'rtl', 'ltr', 'background', 'inline', 'id',
    'class', 'style', 'href', 'http', 'https', 'www', 'com', 'width', 'height', 'flex',
    'padding', 'margin', 'border', 'color', 'font', 'text', 'align', 'center', 'block',
    'none', 'solid', 'px', 'rem', 'em', 'vh', 'vw', 'table', 'tbody', 'thead', 'tr',
    'td', 'th', 'p', 'b', 'i', 'u', 'br', 'hr', 'img', 'src', 'alt', 'input', 'button',
    'head', 'body', 'html', 'meta', 'link', 'script', 'title', 'var', 'let',
    'const', 'function', 'return', 'if', 'else', 'for', 'while', 'null', 'undefined',
    'true', 'false', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c',
    'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
    't', 'u', 'v', 'w', 'x', 'y', 'z'
  ]);

  // Check if text contains Arabic characters
  const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

  return rawTokens.filter(t => {
    // Single character non-Arabic tokens are noise
    if (t.length <= 1 && !/[\u0600-\u06FF]/.test(t)) return false;
    
    // Code noise check
    if (codeNoise.has(t.toLowerCase())) return false;

    // If document has Arabic content, strictly keep Arabic words or meaningful terms
    if (hasArabicChars) {
      const isArabicWord = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(t);
      if (isArabicWord) return true;
      // Skip pure English code noise in Arabic document
      return false;
    }

    return true;
  });
}

// Default pre-loaded Arabic corpus articles
export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'تطبيق الطرق الحديثة في تعليم اللغة العربية بالجامعة',
    author: 'Prof. Dr. Faisal Amin',
    category: 'Pendidikan Kampus',
    date: '2026-06-15',
    wordCount: 0, // Will be computed dynamically
    image: '',
    summary: '',
    content: `Universitas sedang menerapkan kurikulum and metode pengajaran modern untuk pembelajaran bahasa Arab bagi mahasiswa di fakultas. Dosen menggunakan berbagai sarana teknologi canggih di dalam kelas untuk membantu mahasiswa memahami kaidah tata bahasa (nahwu) dengan cepat dan menyenangkan.

Penelitian akademis ini bertujuan agar mahasiswa dapat berbicara dengan lancar dan fasih, serta menulis karya ilmiah dengan gaya bahasa sastra yang tinggi. Mahasiswa berkumpul di ruang kuliah setiap hari untuk berlatih dialog dan berdiskusi dengan para dosen dan pakar bahasa.

Hasil awal dari metode ini menunjukkan keberhasilan yang sangat besar dalam meningkatkan keterampilan mendengar, membaca, dan menulis bagi generasi baru pembelajar bahasa Arab.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  },
  {
    id: 'art-2',
    title: 'دور طلاب عرب نت في أبحاث اللغويات الحاسوبية',
    author: 'Dr. Ahmad Fauzi, M.T.',
    category: 'Teknologi & Riset',
    date: '2026-06-20',
    wordCount: 0,
    image: '',
    summary: '',
    content: `Mahasiswa program studi Teknik Informatika di universitas mempresentasikan penelitian luar biasa dalam bidang linguistik komputasi untuk bahasa Arab. Penelitian ilmiah ini bertujuan menciptakan algoritma baru untuk menganalisis kata dan teks bahasa Arab secara otomatis tanpa intervensi manual manusia.

Mahasiswa menggunakan teknologi pemrograman modern untuk mengetahui perbedaan makna antar kata dan menghitung tingkat frekuensi kata dalam korpus data. Studi ini sangat membantu dalam membangun kamus komputasi raksasa yang bermanfaat bagi para peneliti di seluruh dunia.

Proyek penelitian ini dibimbing langsung oleh profesor spesialis yang mengarahkan mahasiswa untuk menerapkan standar ilmiah tertinggi dalam mengumpulkan dan mengklasifikasikan data.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  },
  {
    id: 'art-3',
    title: 'الندوة الدولية للدراسات الأدبية العربية المعاصرة',
    author: 'Panitia Milad Kampus',
    category: 'Berita Kampus',
    date: '2026-06-28',
    wordCount: 0,
    image: '',
    summary: '',
    content: `Aula konferensi utama universitas menjadi saksi peluncuran forum internasional untuk kajian sastra dan puisi Arab modern. Seminar akbar ini dihadiri oleh banyak akademisi, dosen, dan peneliti dari berbagai fakultas serta lembaga ilmiah.

Sesi-sesi pertemuan membahas keindahan teks sastra serta pentingnya pengajaran retorika (balaghah) dan kritik sastra bagi mahasiswa program pascasarjana di fakultas sastra. Mahasiswa juga mempresentasikan kumpulan makalah ilmiah yang membahas isu identitas dan pembaruan dalam puisi Arab kontemporer.

Pada akhir sesi, seminar merekomendasikan pentingnya mendukung publikasi ilmiah bagi penelitian unggulan serta memperkuat kerjasama akademik antar universitas di wilayah tersebut.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  },
  {
    id: 'art-4',
    title: 'أهمية مكتبة الجامعة كمركز للثقافة والتعليم العربي',
    author: 'Dra. Siti Rahmah, M.Hum',
    category: 'Fasilitas Kampus',
    date: '2026-07-02',
    wordCount: 0,
    image: '',
    summary: '',
    content: `Perpustakaan universitas dianggap sebagai jantung utama bagi penelitian ilmiah and pengajaran bahasa serta sastra Arab. Perpustakaan ini menyimpan ribuan buku dan manuskrip langka yang dikunjungi oleh mahasiswa dan dosen setiap hari untuk menyusun studi dan riset mereka.

Pihak perpustakaan menyediakan ruang baca yang tenang serta perangkat komputer yang terhubung ke basis data global guna memudahkan proses pencarian sumber dan referensi akademis. Mahasiswa menghabiskan waktu berjam-jam di antara rak-rak untuk mengumpulkan informasi serta membaca buku sejarah dan bahasa.

Manajemen perpustakaan selalu berupaya meningkatkan layanan digital dan menyediakan buku elektronik (e-book) bagi seluruh peneliti untuk memfasilitasi pembelajaran mandiri yang berkelanjutan.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  },
  {
    id: 'art-5',
    title: 'التعاون الأكاديمي بين الجامعات العربية وجامعتنا',
    author: 'Hubungan Internasional Kampus',
    category: 'Berita Kampus',
    date: '2026-07-05',
    wordCount: 0,
    image: '',
    summary: '',
    content: `Universitas kita telah menandatangani kesepakatan kerjasama akademik bersama dengan salah satu universitas terkemuka di Timur Tengah untuk memperkuat program pertukaran mahasiswa dan dosen. Kerjasama ini mencakup pemberian beasiswa bagi mahasiswa fakultas bahasa Arab untuk belajar selama dua semester akademik di luar negeri.

Kemitraan ini bertujuan untuk melaksanakan penelitian ilmiah bersama antara para peneliti di bidang linguistik dan sejarah. Dekan fakultas menyatakan kegembiraannya atas kesepakatan ini yang akan membuka cakrawala baru bagi mahasiswa kami untuk merasakan kehidupan universitas yang kaya dan beragam.

Program pertukaran mahasiswa ini akan dimulai pada semester akademik mendatang, yang memungkinkan mahasiswa berinteraksi langsung dengan budaya dan penutur asli bahasa Arab.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  }
];

export const INITIAL_CORPUS_DOCS: Article[] = [
  {
    id: 'corp-1',
    title: 'أهمية العلم والتعليم في بناء المجتمع',
    author: 'Syeikh Abdul Fattah',
    category: 'Studi Keagamaan',
    date: '2025-01-10',
    wordCount: 0,
    image: '',
    summary: 'Kajian mendalam mengenai urgensi ilmu pengetahuan dan pendidikan dalam membangun peradaban manusia.',
    content: `العلم هو النور الذي يضيء طريق الإنسان في هذه الحياة ويمهد له سبل النجاح والتقدم. إن التعليم والبحث العلمي هما الأساس المتين لبناء المجتمعات القوية والمتقدمة في كافة المجالات العلمية والأدبية.

تؤكد الدراسات والأبحاث في الفكر الإسلامي أن طلب العلم فريضة على كل مسلم ومسلمة. العلماء والمعلمون هم ورثة الأنبياء الذين ينشرون المعرفة والنور بين الناس ويقضون على الجهل والظلام في كل مكان.

يجب على الطلاب والمحققين الإخلاص في طلب العلم والاجتهاد في تحصيل المعارف النافعة، والعمل بما تعلموه لخدمة المجتمع والأمة والنهوض بالحضارة والتعليم.

Pentingnya ilmu pengetahuan dalam kehidupan masyarakat merupakan pilar utama pembangunan moral dan intelektual. Melalui pendidikan, para penuntut ilmu dan peneliti dapat mengembangkan potensi diri serta memberikan kontribusi nyata bagi peradaban dunia.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  },
  {
    id: 'corp-2',
    title: 'جمال اللغة العربية وبلاغة قواعدها',
    author: 'Prof. Dr. Khalil Ahmad',
    category: 'Linguistik & Sastra',
    date: '2025-03-22',
    wordCount: 0,
    image: '',
    summary: 'Ulasan estetika struktur keilmuan Nahwu, Sharaf, dan Balaghah dalam sastra bahasa Arab.',
    content: `تعتبر اللغة العربية من أغنى وأجمل اللغات في العالم، حيث تتميز بدقة قواعدها وسعة مفرداتها وجمال أساليبها البلاغية والجمالية. علم النحو وعلم الصرف يشكلان العمود الفقري لفهم التراكيب والنصوص العربية الفصيحة.

تتنوع الأساليب البلاغية في الشعر والنثر العربي القديم والمعاصر، مما يمنح الباحثين والمتخصصين مجالاً واسعاً للدراسة والتحليل الأسلوبي والسيمائي. البلاغة العربية تضم المعاني والبيان بديع الصور.

إن دراسة النحو العربي تساعد الطلاب على ضبط الكلمات وإعراب الجمل بدقة متناهية، وفهم المقاصد والأفكار الواردة في أمات الكتب والمراجع التراثية القديمة.

Keindahan dan keagungan tata bahasa Arab terletak pada presisi sistem morfologi (sharaf) serta sintaksis (nahwu). Peneliti korpus linguistik dapat mengeksplorasi ragam makna, frasa, dan dinamika struktur kalimat secara komprehensif.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  },
  {
    id: 'corp-3',
    title: 'دور التكنولوجيا في تحليل النصوص واللغة',
    author: 'Dr. Fuad Masduqi',
    category: 'Linguistik Komputasi',
    date: '2026-02-15',
    wordCount: 0,
    image: '',
    summary: 'Penerapan teknologi informasi, AI, dan kecerdasan buatan dalam pengolahan bahasa alami (NLP) Arab.',
    content: `تسهم التكنولوجيا الحديثة والذكاء الاصطناعي بشكل كبير في تطوير المعالجة الآلية للغات الطبيعية وخاصة اللغة العربية. إن استخدام الحواسيب والبرمجيات يساعد الباحثين على معالجة المدونات اللغوية الضخمة واستخراج البيانات بدقة متناهية.

تتيح التقنيات الحديثة إمكانية بناء المعاجم الرقمية وتحليل الفراديات والمتلازمات اللفظية والسياقات المعجمية في وقت قياسي وبكفاءة عالية جداً. البرمجة اللغوية تفتح آفاقاً جديدة للبحث العلمي.

يهدف هذا البحث إلى تطبيق أدوات التحليل الحاسوبي والفرز الآلي على النصوص العربية للوصول إلى نتائج دقيقة تسهم في دعم التعلم الإلكتروني والتطبيقات الذكية.

Integrasi teknologi linguistik komputasi mempermudah analisis frekuensi kata, n-gram, kolokasi, serta pencarian KWIC (Key Word in Context) secara otomatis dari ribuan korpus teks secara cepat dan efisien.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  },
  {
    id: 'corp-4',
    title: 'القيم الاجتماعية في الأدب العربي القديم',
    author: 'Prof. Dr. Faisal Amin',
    category: 'Sastra Kontemporer',
    date: '2026-05-18',
    wordCount: 0,
    image: '',
    summary: 'Refleksi nilai kultural dan sosial dalam puisi serta prosa sastra Arab klasik.',
    content: `يعكس الأدب العربي القديم قيم المجتمع وثقافته وعاداته عبر العصور التاريخية المختلفة. لقد كان الشعر العربي وما زال ديوان العرب وسجل مفاخرهم وأحداثهم التاريخية والاجتماعية.

تناول الشعراء والأدباء في قصائدهم مواضيع الحكمة والوفاء والشجاعة والكرم، مما جعل هذه الأعمال الأدبية الخالدة مصدراً إلهامياً للجيل الجديد من القراء والناقدين المعاصرين.

إن قراءة النصوص الأدبية القديمة وتحليل سياقاتها الاجتماعية والثقافية تساعد الطلاب والباحثين على فهم التحولات الفكرية والجمالية في التراث العربي الأصيل.

Nilai-nilai sosial dan filosofis yang terkandung dalam karya sastra Arab klasik memberikan gambaran kaya mengenai peradaban, kemanusiaan, serta estetika kebahasaan yang tak lekang oleh waktu.`,
    documentUrl: '',
    spreadsheetUrl: '',
    morfologiUrl: '',
    sintaksisUrl: '',
    semantikUrl: ''
  }
];

// Initialize article word counts
export function getInitializedArticles(): Article[] {
  return INITIAL_ARTICLES.map(art => {
    const tokens = tokenizeArabic(art.content);
    return {
      ...art,
      wordCount: tokens.length
    };
  });
}

// Initialize corpus documents word counts
export function getInitializedCorpusDocs(): Article[] {
  return INITIAL_CORPUS_DOCS.map(doc => {
    const tokens = tokenizeArabic(doc.content);
    return {
      ...doc,
      wordCount: tokens.length
    };
  });
}

// Compute comprehensive statistics for the corpus
export function computeCorpusStats(articles: Article[]): {
  totalArticles: number;
  totalWords: number;
  uniqueWords: number;
  ttr: number;
  avgWordLength: number;
  avgSentenceLength: number;
} {
  const totalArticles = articles.length;
  let totalWords = 0;
  const allWords: string[] = [];
  let totalWordLengths = 0;
  let totalSentences = 0;

  articles.forEach(art => {
    const tokens = tokenizeArabic(art.content);
    totalWords += tokens.length;
    
    // For TTR and unique calculations, use normalized versions of words
    tokens.forEach(t => {
      const normalized = normalizeArabic(t);
      allWords.push(normalized);
      totalWordLengths += t.length;
    });

    // Count sentences roughly based on Arabic full stops (., ؛, !, ؟)
    const sentences = art.content.split(/[.؛؟!\n]+/).filter(s => s.trim().length > 0);
    totalSentences += sentences.length || 1;
  });

  const uniqueWordsSet = new Set(allWords);
  const uniqueWords = uniqueWordsSet.size;
  const ttr = totalWords > 0 ? (uniqueWords / totalWords) * 100 : 0;
  const avgWordLength = totalWords > 0 ? totalWordLengths / totalWords : 0;
  const avgSentenceLength = totalSentences > 0 ? totalWords / totalSentences : 0;

  return {
    totalArticles,
    totalWords,
    uniqueWords,
    ttr,
    avgWordLength,
    avgSentenceLength
  };
}

// Generate Frequency List
export function generateFrequencyList(
  articles: Article[],
  options: { ignoreHarakat?: boolean; removeStopwords?: boolean; searchFilter?: string } = {}
): { word: string; count: number; percentage: number; rank: number }[] {
  const ignoreHarakat = options.ignoreHarakat !== false;
  const removeStopwords = options.removeStopwords === true;
  const searchFilter = options.searchFilter || '';

  const frequencyMap: Record<string, number> = {};
  let totalTokensCount = 0;

  articles.forEach(art => {
    const tokens = tokenizeArabic(art.content);
    tokens.forEach(tok => {
      let processedWord = tok;
      if (ignoreHarakat) {
        processedWord = normalizeArabic(tok, { removeHarakat: true, normalizeAlif: false, normalizeYa: false, normalizeTeh: false });
      }

      // Check stopwords
      const normalizedForStopword = normalizeArabic(tok, { removeHarakat: true, normalizeAlif: true, normalizeYa: true, normalizeTeh: true }).trim();
      const isStopword = ARABIC_STOPWORDS.includes(normalizedForStopword);

      if (removeStopwords && isStopword) {
        return; // Skip stopwords
      }

      frequencyMap[processedWord] = (frequencyMap[processedWord] || 0) + 1;
      totalTokensCount++;
    });
  });

  // Convert to array and sort
  let items = Object.entries(frequencyMap).map(([word, count]) => ({
    word,
    count,
    percentage: totalTokensCount > 0 ? (count / totalTokensCount) * 100 : 0,
    rank: 0
  }));

  items.sort((a, b) => b.count - a.count);

  // Assign ranks
  items = items.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));

  // Apply search filter if present
  if (searchFilter.trim()) {
    const filterNorm = normalizeArabic(searchFilter.trim()).toLowerCase();
    items = items.filter(item => {
      const itemNorm = normalizeArabic(item.word).toLowerCase();
      return itemNorm.includes(filterNorm);
    });
  }

  return items;
}

// Generate N-Gram List (bi-grams or tri-grams)
export function generateNgramList(
  articles: Article[],
  n = 2,
  options = { ignoreHarakat: true, removeStopwords: false }
): { phrase: string; count: number; percentage: number }[] {
  const ngramMap: Record<string, number> = {};
  let totalNgramsCount = 0;

  articles.forEach(art => {
    const tokens = tokenizeArabic(art.content);
    const processedTokens = tokens.map(tok => {
      let processed = tok;
      if (options.ignoreHarakat) {
        processed = normalizeArabic(tok, { removeHarakat: true, normalizeAlif: false, normalizeYa: false, normalizeTeh: false });
      }
      return {
        original: tok,
        processed,
        normalizedStop: normalizeArabic(tok, { removeHarakat: true, normalizeAlif: true, normalizeYa: true, normalizeTeh: true }).trim()
      };
    });

    // Create n-grams
    for (let i = 0; i <= processedTokens.length - n; i++) {
      const window = processedTokens.slice(i, i + n);
      
      // Stopword filtering rule: if we filter stopwords, discard ngrams where all words or outer words are stopwords,
      // or optionally if ANY word is a stopword. Let's discard if ANY word is a stopword for cleaner phrase list.
      if (options.removeStopwords) {
        const containsStopword = window.some(w => ARABIC_STOPWORDS.includes(w.normalizedStop));
        if (containsStopword) continue;
      }

      const phrase = window.map(w => w.processed).join(' ');
      ngramMap[phrase] = (ngramMap[phrase] || 0) + 1;
      totalNgramsCount++;
    }
  });

  const items = Object.entries(ngramMap).map(([phrase, count]) => ({
    phrase,
    count,
    percentage: totalNgramsCount > 0 ? (count / totalNgramsCount) * 100 : 0
  }));

  items.sort((a, b) => b.count - a.count);
  return items.slice(0, 100); // Return top 100
}

// Generate Concordance / KWIC (Keyword in Context)
export function findConcordance(
  articles: Article[],
  keyword: string,
  options = { exactMatch: false, ignoreHarakat: true, windowSize: 5 }
): {
  leftContext: string;
  keyword: string;
  rightContext: string;
  articleId: string;
  articleTitle: string;
  wordIndex: number;
}[] {
  if (!keyword.trim()) return [];

  const results: {
    leftContext: string;
    keyword: string;
    rightContext: string;
    articleId: string;
    articleTitle: string;
    wordIndex: number;
  }[] = [];

  const normKeyword = normalizeArabic(keyword.trim(), {
    removeHarakat: options.ignoreHarakat,
    normalizeAlif: options.ignoreHarakat,
    normalizeYa: options.ignoreHarakat,
    normalizeTeh: options.ignoreHarakat
  }).toLowerCase();

  articles.forEach(art => {
    const tokens = tokenizeArabic(art.content);
    
    tokens.forEach((tok, idx) => {
      const normToken = normalizeArabic(tok, {
        removeHarakat: options.ignoreHarakat,
        normalizeAlif: options.ignoreHarakat,
        normalizeYa: options.ignoreHarakat,
        normalizeTeh: options.ignoreHarakat
      }).toLowerCase();

      let isMatch = false;
      if (options.exactMatch) {
        isMatch = normToken === normKeyword;
      } else {
        isMatch = normToken.includes(normKeyword);
      }

      if (isMatch) {
        // Extract context window
        const leftStartIndex = Math.max(0, idx - options.windowSize);
        const leftTokens = tokens.slice(leftStartIndex, idx);
        const leftContext = leftTokens.join(' ');

        const rightEndIndex = Math.min(tokens.length, idx + 1 + options.windowSize);
        const rightTokens = tokens.slice(idx + 1, rightEndIndex);
        const rightContext = rightTokens.join(' ');

        results.push({
          leftContext: leftStartIndex > 0 ? '... ' + leftContext : leftContext,
          keyword: tok, // Display the original token with its original harakat
          rightContext: rightEndIndex < tokens.length ? rightContext + ' ...' : rightContext,
          articleId: art.id,
          articleTitle: art.title,
          wordIndex: idx
        });
      }
    });
  });

  return results;
}

// Generate Collocations (words appearing near the keyword)
export function getCollocations(
  articles: Article[],
  keyword: string,
  options = { ignoreHarakat: true, windowSize: 3 }
): { word: string; count: number; strength: number; distance: number }[] {
  if (!keyword.trim()) return [];

  const collocationsMap: Record<string, { count: number; distanceSum: number }> = {};
  
  const normKeyword = normalizeArabic(keyword.trim(), {
    removeHarakat: options.ignoreHarakat,
    normalizeAlif: options.ignoreHarakat,
    normalizeYa: options.ignoreHarakat,
    normalizeTeh: options.ignoreHarakat
  }).toLowerCase();

  let keywordGlobalCount = 0;

  articles.forEach(art => {
    const tokens = tokenizeArabic(art.content).map(tok => ({
      original: tok,
      normalized: normalizeArabic(tok, {
        removeHarakat: options.ignoreHarakat,
        normalizeAlif: options.ignoreHarakat,
        normalizeYa: options.ignoreHarakat,
        normalizeTeh: options.ignoreHarakat
      }).toLowerCase(),
      normalizedStop: normalizeArabic(tok, { removeHarakat: true, normalizeAlif: true, normalizeYa: true, normalizeTeh: true }).trim()
    }));

    tokens.forEach((tok, idx) => {
      let isMatch = tok.normalized.includes(normKeyword);
      
      if (isMatch) {
        keywordGlobalCount++;
        
        // Look within window size left and right
        const start = Math.max(0, idx - options.windowSize);
        const end = Math.min(tokens.length - 1, idx + options.windowSize);

        for (let i = start; i <= end; i++) {
          if (i === idx) continue; // Skip the keyword itself
          
          const neighbor = tokens[i];
          
          // Skip stopwords for collocations to get meaningful semantic partners
          if (ARABIC_STOPWORDS.includes(neighbor.normalizedStop)) continue;
          if (neighbor.original.length <= 1) continue; // Skip single letters

          const wordDisplay = neighbor.original;
          const dist = Math.abs(i - idx);

          if (!collocationsMap[wordDisplay]) {
            collocationsMap[wordDisplay] = { count: 0, distanceSum: 0 };
          }
          collocationsMap[wordDisplay].count += 1;
          collocationsMap[wordDisplay].distanceSum += dist;
        }
      }
    });
  });

  // Convert to array and compute simple strength score
  // Simple strength = count * 2 + (windowSize - avgDistance)
  // Let's sort by count and filter
  const items = Object.entries(collocationsMap).map(([word, data]) => {
    const avgDistance = data.distanceSum / data.count;
    const strength = (data.count / (keywordGlobalCount || 1)) * 100; // Percentage of co-occurrence
    
    return {
      word,
      count: data.count,
      strength: parseFloat(strength.toFixed(1)),
      distance: parseFloat(avgDistance.toFixed(1))
    };
  });

  items.sort((a, b) => b.count - a.count);
  return items.slice(0, 50); // Top 50 collocations
}
