import React from 'react';
import { 
  Search, 
  Filter, 
  BarChart3, 
  CheckCircle2, 
  X, 
  ChevronDown, 
  Eye, 
  Download, 
  Trash2, 
  Pencil, 
  Plus, 
  FileText,
  Globe,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Article, Genre } from '../../types';

interface DaftarDokumenProps {
  filteredArticles: Article[];
  corpusDocs: Article[];
  corpusSearchQuery: string;
  setCorpusSearchQuery: (val: string) => void;
  corpusGenreFilter: string;
  setCorpusGenreFilter: (val: string) => void;
  genres: Genre[];
  selectedFreqDocIds: string[];
  setSelectedFreqDocIds: React.Dispatch<React.SetStateAction<string[]>> | ((val: string[]) => void);
  selectedNgramDocIds?: string[];
  setSelectedNgramDocIds?: React.Dispatch<React.SetStateAction<string[]>> | ((val: string[]) => void);
  setKorpusSubTab: (subTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah') => void;
  hasWriteAccess: boolean;
  onUpdateArticle: (art: Article) => void;
  setActiveSpreadsheetArticle: (art: Article | null) => void;
  setSpreadsheetTab: (tab: 'analisis' | 'morfologi' | 'sintaksis' | 'semantik' | 'google-sheet') => void;
  setEditingArticle: (art: Article | null) => void;
  handleDeleteArticle: (id: string, e: React.MouseEvent) => void;
}

export default function DaftarDokumen({
  filteredArticles,
  corpusDocs,
  corpusSearchQuery,
  setCorpusSearchQuery,
  corpusGenreFilter,
  setCorpusGenreFilter,
  genres,
  selectedFreqDocIds,
  setSelectedFreqDocIds,
  selectedNgramDocIds,
  setSelectedNgramDocIds,
  setKorpusSubTab,
  hasWriteAccess,
  onUpdateArticle,
  setActiveSpreadsheetArticle,
  setSpreadsheetTab,
  setEditingArticle,
  handleDeleteArticle
}: DaftarDokumenProps) {
  const [isPilihDropdownOpen, setIsPilihDropdownOpen] = React.useState(false);

  return (
    <div className="space-y-6 animate-fade-in" id="subpanel-daftar">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pangkalan Data Dokumen <span className="text-[#056a3e]">ArabNet Corpus</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Daftar lengkap berkas naskah berita ilmiah dan pendidikan Arab-Indonesia.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {corpusSearchQuery || corpusGenreFilter ? (
                <>Ditemukan: <strong className="text-[#056a3e]">{filteredArticles.length}</strong> dari {corpusDocs.length}</>
              ) : (
                <>Total: <strong className="text-slate-800">{corpusDocs.length}</strong></>
              )}{' '}Dokumen
            </span>
            {hasWriteAccess && (
              <button
                onClick={() => setKorpusSubTab('tambah')}
                className="px-3.5 py-1.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Dokumen</span>
              </button>
            )}
          </div>
        </div>

        {/* Pencarian dan Filter Dokumen */}
        <div className="p-4 bg-slate-50/30 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari judul artikel atau nama penulis..."
              value={corpusSearchQuery}
              onChange={(e) => setCorpusSearchQuery(e.target.value)}
              className="w-full pl-9 pr-12 py-2.5 bg-white border border-slate-200 focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 rounded-xl text-xs outline-none text-slate-800 font-medium transition-all"
            />
            {corpusSearchQuery && (
              <button
                onClick={() => setCorpusSearchQuery('')}
                className="absolute right-3 top-3 text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider"
              >
                Batal
              </button>
            )}
          </div>

          <div className="relative w-full md:w-64">
            <select
              value={corpusGenreFilter}
              onChange={(e) => setCorpusGenreFilter(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 rounded-xl text-xs outline-none text-slate-800 font-medium transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Genre / Kategori</option>
              {genres.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {(corpusSearchQuery || corpusGenreFilter) && (
            <button
              onClick={() => {
                setCorpusSearchQuery('');
                setCorpusGenreFilter('');
              }}
              className="w-full md:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
            >
              Atur Ulang
            </button>
          )}
        </div>

        {selectedFreqDocIds.length > 0 && (
          <div className="mx-6 my-4 p-4 bg-teal-50 border border-teal-100 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-600 text-white rounded-xl shadow-2xs mt-0.5">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-950">
                  Terpilih <span className="text-teal-700 font-black bg-teal-100/80 px-1.5 py-0.5 rounded-md">{selectedFreqDocIds.length}</span> dari <span className="text-slate-700 font-bold">{corpusDocs.length}</span> dokumen untuk analisis korpus.
                </p>
                <p className="text-[10px] text-teal-800/80 mt-1 font-medium">
                  Pilih mode analisis untuk melihat data dari dokumen terpilih:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto shrink-0">
              <button
                onClick={() => {
                  setKorpusSubTab('frekuensi');
                  const el = document.getElementById('panel-korpus');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analisis Frekuensi Kata</span>
              </button>
              <button
                onClick={() => {
                  if (setSelectedNgramDocIds) {
                    setSelectedNgramDocIds(selectedFreqDocIds);
                  }
                  setKorpusSubTab('ngram');
                  const el = document.getElementById('panel-korpus');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Analisis N-Gram</span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/20">
                <th className="py-4 px-4 w-28 text-center select-none relative">
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsPilihDropdownOpen(!isPilihDropdownOpen)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold uppercase transition-all border border-slate-200/80 shadow-3xs cursor-pointer select-none"
                    >
                      <span>Pilih</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {isPilihDropdownOpen && (
                      <>
                        {/* Backdrop overlay */}
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setIsPilihDropdownOpen(false)} 
                        />
                        {/* Dropdown Menu */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-slate-700 animate-fade-in text-xs font-semibold text-left normal-case tracking-normal">
                          <button
                            type="button"
                            onClick={() => {
                              const uniqueIds = Array.from(new Set([...selectedFreqDocIds, ...filteredArticles.map(art => art.id)]));
                              setSelectedFreqDocIds(uniqueIds);
                              setIsPilihDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-teal-50 hover:text-[#056a3e] transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#056a3e]" />
                            <span>Pilih Semua</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const filteredIds = filteredArticles.map(art => art.id);
                              setSelectedFreqDocIds(selectedFreqDocIds.filter(id => !filteredIds.includes(id)));
                              setIsPilihDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-rose-50 hover:text-rose-700 border-t border-slate-100 transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <X className="w-4 h-4 text-rose-500" />
                            <span>Batal Pilih Semua</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </th>
                <th className="py-4 px-4 w-12 text-center">No</th>
                <th className="py-3 px-6">Judul</th>
                <th className="py-3 px-6">Penulis</th>
                <th className="py-3 px-6 w-48">Genre</th>
                <th className="py-3 px-4 w-40 text-center">Dokumen</th>
                <th className="py-3 px-4 min-w-[175px] w-48 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.length > 0 ? (
                filteredArticles.map((art, index) => {
                  const isSelected = selectedFreqDocIds.includes(art.id);
                  return (
                    <tr key={art.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-teal-50/20' : ''}`}>
                      {/* Pilih checkbox */}
                      <td className="py-4 px-4 text-center select-none">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedFreqDocIds(selectedFreqDocIds.filter(id => id !== art.id));
                              } else {
                                setSelectedFreqDocIds([...selectedFreqDocIds, art.id]);
                              }
                            }}
                            className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer transition-all duration-150 hover:scale-105"
                            title="Pilih dokumen ini untuk analisis frekuensi"
                          />
                        </div>
                      </td>

                      {/* No */}
                      <td className="py-4 px-4 text-center font-semibold text-slate-400 text-xs">
                        {index + 1}
                      </td>

                      {/* Judul */}
                      <td className="py-4 px-6">
                        {(() => {
                          const parenMatch = art.title.match(/^(.*?)\s*\(([\u0600-\u06FF\s\W]+)\)$/);
                          let indoPart = art.title;
                          let arabicPart = "";

                          if (parenMatch) {
                            indoPart = parenMatch[1].trim();
                            arabicPart = parenMatch[2].trim();
                          }

                          const content = (
                            <span dir="auto" className="font-bold text-slate-900 text-sm line-clamp-2 block max-w-md">
                              {arabicPart ? (
                                <>
                                  <span>{indoPart} </span>
                                  <span dir="rtl" className="inline-block text-slate-900">
                                    ({arabicPart})
                                  </span>
                                </>
                              ) : (
                                art.title
                              )}
                            </span>
                          );

                          return art.documentUrl ? (
                            <a
                              href={art.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-[#056a3e] transition-colors cursor-pointer block"
                              title="Buka Dokumen PDF"
                            >
                              {content}
                            </a>
                          ) : (
                            <div className="block">
                              {content}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Penulis */}
                      <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                        {art.author}
                      </td>

                      {/* Genre */}
                      <td className="py-4 px-6 text-sm text-slate-600 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-100 whitespace-nowrap">
                          {art.category || 'Lain-lain'}
                        </span>
                      </td>

                      {/* Dokumen */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          {(art.sourceUrl || art.documentUrl) ? (
                            <div className="flex items-center justify-center gap-2">
                              {/* Tanda Mata (Eye Icon) untuk membuka link berita asli / dokumen */}
                              <a
                                href={art.sourceUrl || art.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 text-xs font-bold transition-all cursor-pointer shadow-3xs hover:shadow-xs"
                                title={art.sourceUrl ? "Buka Link Berita Asli" : "Lihat Dokumen PDF"}
                              >
                                <Eye className="w-4 h-4 text-teal-700" />
                                <span>Lihat</span>
                              </a>

                              {/* Tanda Download (Download Icon) untuk mengunduh dokumen jika ada */}
                              {art.documentUrl && (
                                <a
                                  href={art.documentUrl}
                                  download={art.title ? `${art.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf` : 'dokumen_penelitian.pdf'}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 text-xs font-bold transition-all cursor-pointer shadow-3xs hover:shadow-xs"
                                  title="Unduh Dokumen PDF"
                                >
                                  <Download className="w-4 h-4 text-blue-700" />
                                  <span>Unduh</span>
                                </a>
                              )}

                              {/* Hapus Berkas (Trash) jika memiliki akses tulis */}
                              {hasWriteAccess && art.documentUrl && (
                                <button
                                  onClick={() => {
                                    onUpdateArticle({ ...art, documentUrl: '' });
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-100 transition-colors cursor-pointer"
                                  title="Hapus Berkas"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">Tidak ada berkas</span>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 text-center min-w-[175px]">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveSpreadsheetArticle(art);
                              setSpreadsheetTab(art.spreadsheetUrl ? 'google-sheet' : 'analisis');
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100/90 text-[#056a3e] border border-emerald-200/90 rounded-lg text-xs font-bold transition-all cursor-pointer w-full max-w-[165px] whitespace-nowrap text-center shadow-3xs"
                            title="Lihat Analisis Dokumen & Spreadsheet"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#056a3e] shrink-0" />
                            <span>Lihat Analisis</span>
                          </button>

                          <button
                            onClick={() => {
                              setKorpusSubTab('frekuensi');
                              setSelectedFreqDocIds([art.id]);
                              setSpreadsheetTab('analisis');
                              const el = document.getElementById('panel-korpus');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-bold transition-all cursor-pointer w-full max-w-[165px] whitespace-nowrap text-center"
                            title="Hubungkan ke Analisis & Grafik Frekuensi Kata"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-[#056a3e] shrink-0" />
                            <span>Analisis Frekuensi</span>
                          </button>

                          <button
                            onClick={() => {
                              if (setSelectedNgramDocIds) {
                                setSelectedNgramDocIds([art.id]);
                              }
                              setKorpusSubTab('ngram');
                              const el = document.getElementById('panel-korpus');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-teal-50/70 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-lg text-xs font-bold transition-all cursor-pointer w-full max-w-[165px] whitespace-nowrap text-center"
                            title="Analisis Frasa N-Gram Dokumen Ini"
                          >
                            <Layers className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>Analisis N-Gram</span>
                          </button>

                          {/* Standard admin/user actions */}
                          {hasWriteAccess && (
                            <div className="flex items-center justify-center gap-1.5 mt-1 border-t border-slate-100 pt-1 w-full max-w-[165px]">
                              <button
                                onClick={() => setEditingArticle(art)}
                                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Ubah Berita"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteArticle(art.id, e)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Hapus Dokumen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-12 h-12 text-slate-200 animate-pulse" />
                      <h4 className="font-semibold text-slate-700">
                        {corpusSearchQuery || corpusGenreFilter ? 'Tidak Ada Hasil' : 'Database Kosong'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {corpusSearchQuery || corpusGenreFilter 
                          ? 'Tidak ada dokumen yang cocok dengan kriteria pencarian dan filter Anda.'
                          : 'Belum ada dokumen/berita korpus yang tersimpan.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
