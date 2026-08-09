import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Sliders, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  X, 
  CheckCircle2,
  ListFilter,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import { ConcordanceResult } from '../../types';

interface ConcordanceKwicProps {
  kwicQuery: string;
  setKwicQuery: (val: string) => void;
  kwicWindowSize: number;
  setKwicWindowSize: (val: number) => void;
  kwicIgnoreHarakat: boolean;
  setKwicIgnoreHarakat: (val: boolean) => void;
  kwicExact: boolean;
  setKwicExact: (val: boolean) => void;
  handleKwicSearch: () => void;
  hasSearchedKwic: boolean;
  kwicResults: ConcordanceResult[];
  setSelectedArticleId: (val: string | null) => void;
  handleWordClick: (rawWord: string) => void;
  setCurrentTab: (tab: 'beranda' | 'berita' | 'korpus' | 'galeri' | 'tentang' | 'login' | 'pengguna') => void;
  onViewDocument?: (articleId: string, keyword: string) => void;
}

export default function ConcordanceKwic({
  kwicQuery,
  setKwicQuery,
  kwicWindowSize,
  setKwicWindowSize,
  kwicIgnoreHarakat,
  setKwicIgnoreHarakat,
  kwicExact,
  setKwicExact,
  handleKwicSearch,
  hasSearchedKwic,
  kwicResults,
  setSelectedArticleId,
  handleWordClick,
  setCurrentTab,
  onViewDocument
}: ConcordanceKwicProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const ITEMS_PER_PAGE = 30;

  // Reset pagination when search parameters or results change
  useEffect(() => {
    setCurrentPage(1);
  }, [kwicResults, kwicQuery]);

  const totalPages = Math.max(1, Math.ceil(kwicResults.length / ITEMS_PER_PAGE));
  const currentPageValid = Math.min(Math.max(1, currentPage), totalPages);

  const pagedResults = useMemo(() => {
    const start = (currentPageValid - 1) * ITEMS_PER_PAGE;
    return kwicResults.slice(start, start + ITEMS_PER_PAGE);
  }, [kwicResults, currentPageValid]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleKwicSearch();
    }
  };

  const openDocument = (articleId: string, keyword: string) => {
    if (onViewDocument) {
      onViewDocument(articleId, keyword || kwicQuery);
    } else {
      setSelectedArticleId(articleId);
      handleWordClick(keyword || kwicQuery);
      setCurrentTab('berita');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in" id="subpanel-pencarian">
      
      {/* SEARCH CONTROL CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        
        {/* Header & Description */}
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
            Concordance Key Word in Context
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Analisis posisi kata kunci di tengah kalimat konteks kiri dan kanan langsung dari dokumen korpus.
          </p>
        </div>

        {/* Form Controls Grid - Symmetrical & Equal Height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          
          {/* Kata Kunci Input */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-xs text-slate-700 font-bold block flex items-center justify-between h-4">
              <span>Kata Kunci Pencarian:</span>
              {kwicQuery && (
                <button 
                  type="button"
                  onClick={() => setKwicQuery('')} 
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Bersihkan
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                dir="auto"
                value={kwicQuery}
                onKeyDown={handleKeyDown}
                onChange={(e) => setKwicQuery(e.target.value)}
                placeholder="Ketik kata... (contoh: Bahasa, metode, العربية)"
                className="w-full pl-3.5 pr-10 h-[42px] border border-slate-200 focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e] rounded-xl font-sans text-sm outline-none bg-white text-slate-900 shadow-3xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Jendela Konteks (Slider) */}
          <div className="lg:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs h-4">
              <span className="text-slate-700 font-bold">Jendela Konteks:</span>
              <span className="px-2 py-0.5 bg-[#056a3e] text-white rounded font-bold text-[10px]">
                ±{kwicWindowSize} kata
              </span>
            </div>
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-1.5 flex flex-col justify-center h-[42px] space-y-1">
              <input
                type="range"
                min="3"
                max="10"
                value={kwicWindowSize}
                onChange={(e) => setKwicWindowSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#056a3e]"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-medium leading-none">
                <span>3 (Sempit)</span>
                <span>10 (Luas)</span>
              </div>
            </div>
          </div>

          {/* Checkboxes Options */}
          <div className="lg:col-span-3 space-y-1.5">
            <div className="text-xs text-slate-700 font-bold h-4">
              Opsi Pencarian:
            </div>
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 flex items-center justify-around h-[42px] gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kwicIgnoreHarakat}
                  onChange={(e) => setKwicIgnoreHarakat(e.target.checked)}
                  className="rounded border-slate-300 text-[#056a3e] focus:ring-[#056a3e] h-3.5 w-3.5 cursor-pointer"
                />
                <span>Abaikan Harakat</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kwicExact}
                  onChange={(e) => setKwicExact(e.target.checked)}
                  className="rounded border-slate-300 text-[#056a3e] focus:ring-[#056a3e] h-3.5 w-3.5 cursor-pointer"
                />
                <span>Eksak</span>
              </label>
            </div>
          </div>

          {/* Search Action Button */}
          <div className="lg:col-span-2 space-y-1.5">
            <div className="h-4 hidden lg:block" />
            <button
              onClick={handleKwicSearch}
              className="w-full h-[42px] px-4 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl font-bold text-xs shadow-3xs flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:shadow-xs active:scale-98"
            >
              <Search className="w-4 h-4" />
              <span>Cari Konteks</span>
            </button>
          </div>

        </div>
      </div>

      {/* SEARCH RESULTS SECTION */}
      {hasSearchedKwic && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-0">
          
          {/* Results Summary Bar & View Controls */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span className="px-2.5 py-1 bg-emerald-100 text-[#056a3e] border border-emerald-200 rounded-lg font-bold">
                {kwicResults.length} Kemunculan Ditemukan
              </span>
              <span>
                untuk kata "<strong className="text-slate-900 font-bold">{kwicQuery}</strong>"
              </span>
            </div>

            {kwicResults.length > 0 && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Tampilan:</span>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#056a3e] text-white border-[#056a3e] shadow-3xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Tabel
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-[#056a3e] text-white border-[#056a3e] shadow-3xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Kartu
                </button>
              </div>
            )}
          </div>

          {kwicResults.length > 0 ? (
            <div className="p-4 space-y-4">
              
              {/* TABLE VIEW */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-3xs">
                  <table className="w-full border-collapse bg-white table-fixed min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] text-slate-600 font-bold bg-slate-50/90 select-none">
                        <th className="py-2.5 px-2.5 text-center w-14">Nomor</th>
                        <th className="py-2.5 px-3 text-right w-[28%]">Konteks Kiri (Sebelum)</th>
                        <th className="py-2.5 px-2 text-center w-[15%]">Kata Kunci</th>
                        <th className="py-2.5 px-3 text-left w-[28%]">Konteks Kanan (Sesudah)</th>
                        <th className="py-2.5 px-3 text-left w-[22%]">Dokumen Sumber</th>
                        <th className="py-2.5 px-2 text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {pagedResults.map((res, index) => {
                        const itemIndex = (currentPageValid - 1) * ITEMS_PER_PAGE + index + 1;
                        return (
                          <tr 
                            key={index} 
                            onClick={() => openDocument(res.articleId, res.keyword || kwicQuery)}
                            className="hover:bg-emerald-50/60 transition-colors cursor-pointer group"
                          >
                            {/* Row Index */}
                            <td className="py-3 px-2 text-center font-bold text-slate-400 text-[11px] group-hover:text-[#056a3e]">
                              {itemIndex}
                            </td>

                            {/* Left Context (Before keyword) - aligned right */}
                            <td dir="auto" className="py-3 px-3 text-right text-slate-600 font-sans leading-relaxed truncate group-hover:text-slate-900" title={res.leftContext}>
                              {res.leftContext}
                            </td>

                            {/* Center Keyword Badge */}
                            <td dir="auto" className="py-3 px-2 text-center truncate">
                              <span className="inline-block px-2.5 py-1 bg-emerald-100/90 border border-emerald-300 rounded-md font-sans font-bold text-xs text-[#056a3e] shadow-3xs group-hover:bg-amber-100 group-hover:border-amber-300 group-hover:text-amber-900 transition-all truncate max-w-full">
                                {res.keyword}
                              </span>
                            </td>

                            {/* Right Context (After keyword) - aligned left */}
                            <td dir="auto" className="py-3 px-3 text-left text-slate-600 font-sans leading-relaxed truncate group-hover:text-slate-900" title={res.rightContext}>
                              {res.rightContext}
                            </td>

                            {/* Source document */}
                            <td className="py-3 px-3 text-left text-slate-700 font-medium group-hover:text-[#056a3e]">
                              <span className="flex items-center gap-1.5 min-w-0" title={res.articleTitle}>
                                <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#056a3e] shrink-0" />
                                <span dir="auto" className="truncate font-sans leading-snug">{res.articleTitle}</span>
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDocument(res.articleId, res.keyword || kwicQuery);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-md text-[11px] font-bold transition-all cursor-pointer shadow-3xs shrink-0 active:scale-95"
                                title="Buka Naskah & Tandai Kata ini"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Buka</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CARDS VIEW */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pagedResults.map((res, index) => {
                    const itemIndex = (currentPageValid - 1) * ITEMS_PER_PAGE + index + 1;
                    return (
                      <div
                        key={index}
                        onClick={() => openDocument(res.articleId, res.keyword || kwicQuery)}
                        className="p-3.5 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl shadow-3xs hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[11px]">
                            Nomor #{itemIndex}
                          </span>
                          <span className="text-slate-500 font-medium flex items-center gap-1.5 max-w-[220px] truncate" title={res.articleTitle}>
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span dir="auto" className="truncate font-sans leading-snug">{res.articleTitle}</span>
                          </span>
                        </div>

                        {/* Sentence Snippet */}
                        <div dir="auto" className="p-2.5 bg-slate-50 rounded-lg text-xs leading-relaxed text-slate-800 font-sans border border-slate-100">
                          <span className="text-slate-500">{res.leftContext} </span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-[#056a3e] font-bold rounded border border-emerald-300">
                            {res.keyword}
                          </span>
                          <span className="text-slate-500"> {res.rightContext}</span>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDocument(res.articleId, res.keyword || kwicQuery);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-md text-[11px] font-bold transition-all cursor-pointer shadow-3xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Buka Dokumen</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan <strong className="font-bold text-slate-800">{(currentPageValid - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPageValid * ITEMS_PER_PAGE, kwicResults.length)}</strong> dari <strong className="font-bold text-slate-800">{kwicResults.length}</strong> kemunculan
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPageValid <= 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPageValid) <= 1)
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && <span className="text-xs text-slate-400 px-0.5">...</span>}
                              <button
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`w-7 h-7 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  page === currentPageValid
                                    ? 'bg-[#056a3e] text-white shadow-3xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      disabled={currentPageValid >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* EMPTY STATE RESULTS */
            <div className="py-16 text-center text-slate-500 space-y-3 p-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Kecocokan Ditemukan</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tidak dapat menemukan kata "<strong className="text-slate-800 font-bold">{kwicQuery}</strong>" dalam korpus dokumen. 
                Coba aktifkan opsi <span className="font-bold text-slate-700">"Abaikan Harakat"</span> atau matikan <span className="font-bold text-slate-700">"Pencarian Eksak"</span>.
              </p>
            </div>
          )}

        </div>
      )}

      {/* INITIAL PROMPT BEFORE SEARCH */}
      {!hasSearchedKwic && (
        <div className="py-12 px-6 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-2">
          <ArrowLeftRight className="w-8 h-8 text-[#056a3e]/60 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Siap Menganalisis Konkordansi</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Ketik kata kunci di atas dan klik tombol <span className="font-bold text-[#056a3e]">"Cari Konteks"</span> untuk menampilkan tabel konteks kata dalam kalimat dari seluruh korpus dokumen Word.
          </p>
        </div>
      )}

    </div>
  );
}
