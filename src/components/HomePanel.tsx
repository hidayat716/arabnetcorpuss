import React from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  FileText, 
  Database, 
  Layers, 
  TrendingUp, 
  ChevronRight, 
  Search, 
  Info, 
  HelpCircle 
} from 'lucide-react';
import { Article, CorpusStats } from '../types';
import { generateFrequencyList } from '../data/initialData';

interface HomePanelProps {
  corpusStats: CorpusStats;
  corpusDocs: Article[];
  setCurrentTab: (tab: 'beranda' | 'berita' | 'korpus' | 'galeri' | 'tentang' | 'login' | 'pengguna') => void;
  setKorpusSubTab: (subTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah') => void;
  kwicQuery: string;
  setKwicQuery: (q: string) => void;
  kwicIgnoreHarakat: boolean;
  setKwicIgnoreHarakat: (val: boolean) => void;
  handleKwicSearch: () => void;
}

export default function HomePanel({
  corpusStats,
  corpusDocs,
  setCurrentTab,
  setKorpusSubTab,
  kwicQuery,
  setKwicQuery,
  kwicIgnoreHarakat,
  setKwicIgnoreHarakat,
  handleKwicSearch
}: HomePanelProps) {
  
  // Calculate top 5 words frequency list
  const frequencyList = generateFrequencyList(corpusDocs, { ignoreHarakat: true, removeStopwords: true });
  const topFiveWords = frequencyList.slice(0, 5);
  const maxCount = topFiveWords[0]?.count || 1;

  return (
    <div className="space-y-10 animate-fade-in" id="panel-beranda">
      
      {/* HERO SECTION */}
      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
        
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-800 text-xs font-semibold mb-6">
            <span>Aplikasi Korpus Terintegrasi</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
            Selamat Datang di <br />
            <span className="text-[#056a3e]">ArabNet Corpus</span>
          </h1>
          
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            Platform korpus digital bahasa Arab berbasis big data untuk mendukung penelitian, pembelajaran, dan analisis linguistik.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => { setCurrentTab('korpus'); setKorpusSubTab('pencarian'); }}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Mulai Analisis Korpus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCurrentTab('korpus'); setKorpusSubTab('daftar'); }}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Lihat Daftar Artikel</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Dokumen', value: corpusStats.totalArticles, unit: 'Artikel', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { label: 'Ukuran Korpus', value: corpusStats.totalWords, unit: 'Kata', icon: Database, color: 'text-teal-600', bg: 'bg-teal-50/50' },
          { label: 'Kosakata Unik', value: corpusStats.uniqueWords, unit: 'Lemari Kata', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50/50' },
          { label: 'TTR (Type-Token Ratio)', value: `${corpusStats.ttr.toFixed(1)}%`, unit: 'Kekayaan Kosa Kata', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">{stat.label}</span>
              <span className="text-2xl font-bold text-slate-900 block">{stat.value}</span>
              <span className="text-[10px] text-slate-500 font-semibold">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* GRID OF FEATURE SNEAK PEEK & WORD CLOUD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: Top Words Distribution */}
        <div className="md:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Kosakata Terpopuler</h3>
              <p className="text-xs text-slate-500">Kata yang paling sering muncul di seluruh artikel (tanpa kata tugas)</p>
            </div>
            <button 
              onClick={() => { setCurrentTab('korpus'); setKorpusSubTab('frekuensi'); }}
              className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Custom SVG Bar Chart */}
          <div className="space-y-4">
            {topFiveWords.map((item, index) => {
              const barPercent = (item.count / maxCount) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-arabic-cairo font-bold text-slate-800 text-lg" dir="rtl">
                      {item.word}
                    </span>
                    <span className="text-slate-500">
                      <strong>{item.count}</strong> kali ({item.percentage.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-600 h-2.5 rounded-full transition-all duration-1000"
                      style={{ width: `${barPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Berdasarkan analisis statistik otomatis
            </span>
            <span>Frekuensi Tertinggi: {topFiveWords[0]?.word || ''}</span>
          </div>
        </div>

        {/* Right Column: Mini Interactive Playground */}
        <div className="md:col-span-5 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2 bg-white/10 rounded-lg w-fit text-teal-300 mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Cari Instan di Korpus</h3>
            <p className="text-xs text-teal-100/70 mt-1 mb-6">
              Masukkan kata bahasa Arab untuk melihat concordances (KWIC) secara langsung dari basis data kami.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                dir="rtl"
                value={kwicQuery}
                onChange={(e) => setKwicQuery(e.target.value)}
                placeholder="Masukkan kata..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 focus:border-white/40 focus:ring-1 focus:ring-white rounded-xl text-white font-arabic-cairo text-right placeholder-teal-200/50 text-lg outline-none"
              />
              <div className="flex items-center justify-between text-xs text-teal-200">
                <span>Abaikan Harakat</span>
                <input
                  type="checkbox"
                  checked={kwicIgnoreHarakat}
                  onChange={(e) => setKwicIgnoreHarakat(e.target.checked)}
                  className="rounded border-teal-500 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              handleKwicSearch();
              setCurrentTab('korpus');
              setKorpusSubTab('pencarian');
            }}
            className="mt-6 w-full py-3 bg-white hover:bg-teal-50 text-teal-950 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Cari Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* QUICK GUIDE SECTION */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xs">
        <h3 className="text-xl font-bold text-slate-950 mb-6 flex items-center gap-2">
          <HelpCircle className="w-5.5 h-5.5 text-teal-600" />
          <span>Bagaimana Cara Kerja Analisis Korpus?</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
            <div className="text-teal-600 font-bold text-lg mb-2">1. Tokenisasi & Normalisasi</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem secara cerdas memecah rangkaian tulisan Arab menjadi kata-kata mandiri, memisahkan tanda baca, dan menormalisasi varian huruf (seperti Alif Hamzah dan Ya/Alif Maksura) untuk pencarian yang presisi.
            </p>
          </div>
          <div className="p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
            <div className="text-teal-600 font-bold text-lg mb-2">2. KWIC (Keyword in Context)</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Menampilkan kata kunci di tengah-tengah teks beserta kata sebelum dan sesudahnya. Memudahkan ahli bahasa memahami konteks semantik penggunaan suatu istilah.
            </p>
          </div>
          <div className="p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
            <div className="text-teal-600 font-bold text-lg mb-2">3. Kolokasi & N-Gram</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Menghitung asosiasi kemunculan bersama antar kata terdekat (kolokasi) dan mengekstrak frasa berulang (N-gram) untuk mendeteksi pola khas gaya penulisan pengarang.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
