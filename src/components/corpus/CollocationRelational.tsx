import React from 'react';
import { TrendingUp } from 'lucide-react';

interface CollocationRelationalProps {
  collocationQuery: string;
  setCollocationQuery: (val: string) => void;
  collocationWindowSize: number;
  setCollocationWindowSize: (val: number) => void;
  handleCollocationSearch: () => void;
  hasSearchedCollocation: boolean;
  collocationResults: any[];
  setKwicQuery: (val: string) => void;
  setKwicExact: (val: boolean) => void;
  handleKwicSearch: () => void;
  setKorpusSubTab: (subTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah') => void;
}

export default function CollocationRelational({
  collocationQuery,
  setCollocationQuery,
  collocationWindowSize,
  setCollocationWindowSize,
  handleCollocationSearch,
  hasSearchedCollocation,
  collocationResults,
  setKwicQuery,
  setKwicExact,
  handleKwicSearch,
  setKorpusSubTab
}: CollocationRelationalProps) {
  return (
    <div className="space-y-6 animate-fade-in" id="subpanel-kolokasi">
      {/* Search Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Analisis Kolokasi Kata (Semantic Co-occurrence)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs text-slate-500 font-semibold block">Kata Kunci:</label>
            <input
              type="text"
              dir="ltr"
              value={collocationQuery}
              onChange={(e) => setCollocationQuery(e.target.value)}
              placeholder="Contoh: bahasa, mahasiswa, penelitian"
              className="w-full px-4 py-2.5 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl font-sans text-left text-sm outline-none bg-white text-slate-900"
            />
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs text-slate-500 font-semibold block">Batas Jarak Tetangga: ±{collocationWindowSize} kata</label>
            <input
              type="range"
              min="2"
              max="5"
              value={collocationWindowSize}
              onChange={(e) => setCollocationWindowSize(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 py-2.5"
            />
          </div>

          <div className="md:col-span-3">
            <button
              onClick={handleCollocationSearch}
              className="w-full py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:shadow-sm"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analisis Kolokasi</span>
            </button>
          </div>

        </div>
      </div>

      {/* Collocation Results Display */}
      {hasSearchedCollocation && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs text-slate-500 font-semibold">
              Pasangan kolokasi untuk kata "<span className="font-sans text-teal-700 font-bold">{collocationQuery}</span>" (Telah menyaring kata tugas)
            </span>
          </div>

          {collocationResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/10 text-center">
                    <th className="py-3 px-6 text-left w-16">No</th>
                    <th className="py-3 px-6 text-left font-sans">Kata Tetangga</th>
                    <th className="py-3 px-6">Frekuensi Kemunculan Bersama</th>
                    <th className="py-3 px-6">Kekuatan Asosiasi (% Ko-okurensi)</th>
                    <th className="py-3 px-6">Rata-rata Jarak Posisi</th>
                    <th className="py-3 px-6 w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {collocationResults.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/40 text-center transition-colors">
                      <td className="py-3.5 px-6 text-left font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td dir="ltr" className="py-3.5 px-6 text-left font-sans font-bold text-slate-900 text-sm">
                        {item.word}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-700">
                        {item.count} kali
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-teal-700 font-mono">{item.strength}%</span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, item.strength * 5)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 text-xs font-semibold">
                        &plusmn; {item.distance} kata
                      </td>
                      <td className="py-3.5 px-6">
                        <button
                          onClick={() => {
                            setKwicQuery(`${collocationQuery} ${item.word}`);
                            setKwicExact(false);
                            handleKwicSearch();
                            setKorpusSubTab('pencarian');
                          }}
                          className="text-[10px] text-teal-600 hover:text-teal-800 font-bold hover:underline cursor-pointer"
                        >
                          Cari Berpasangan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <TrendingUp className="w-12 h-12 text-slate-200 animate-pulse" />
              <h4 className="font-semibold text-slate-700">Belum Ada Hasil Kolokasi</h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Tidak ditemukan asosiasi kata tetangga yang kuat untuk "<span className="font-sans font-bold">{collocationQuery}</span>". Coba perluas jendela pencarian atau cari kata lain.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
