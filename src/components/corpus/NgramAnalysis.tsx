import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Layers, 
  Search, 
  FileText, 
  Filter, 
  Loader2, 
  BookOpen, 
  X, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Article } from '../../types';
import { generateNgramList, normalizeArabic } from '../../data/initialData';
import { extractTextFromDocUrl } from '../../utils/docExtractor';

interface NgramAnalysisProps {
  corpusDocs: Article[];
  articles?: Article[];
  ngramN: number;
  setNgramN: (val: number) => void;
  ngramRemoveStopwords: boolean;
  setNgramRemoveStopwords: (val: boolean) => void;
  selectedNgramDocIds?: string[];
  setSelectedNgramDocIds?: React.Dispatch<React.SetStateAction<string[]>> | ((val: string[]) => void);
  ngramList?: any[];
  setKwicQuery?: (val: string) => void;
  setKwicExact?: (val: boolean) => void;
  handleKwicSearch?: () => void;
  setKorpusSubTab?: (subTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah') => void;
  onViewDocument?: (articleId: string, keyword: string) => void;
}

export default function NgramAnalysis({
  corpusDocs = [],
  articles = [],
  ngramN,
  setNgramN,
  ngramRemoveStopwords,
  setNgramRemoveStopwords,
  selectedNgramDocIds,
  setSelectedNgramDocIds,
  setKwicQuery,
  setKwicExact,
  handleKwicSearch,
  setKorpusSubTab,
  onViewDocument
}: NgramAnalysisProps) {
  const [localSelectedDocIds, setLocalSelectedDocIds] = useState<string[]>([]);
  const activeSelectedDocIds = selectedNgramDocIds || localSelectedDocIds;
  const setActiveSelectedDocIds = setSelectedNgramDocIds || setLocalSelectedDocIds;

  const [isDocListExpanded, setIsDocListExpanded] = useState<boolean>(false);
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hydratedDocs, setHydratedDocs] = useState<Article[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 30;
  const docListContainerRef = useRef<HTMLDivElement>(null);

  // Combine corpusDocs and articles
  const allAvailableDocs = useMemo(() => {
    const docMap = new Map<string, Article>();
    corpusDocs.forEach(d => docMap.set(d.id, { ...d }));
    articles.forEach(a => {
      if (!docMap.has(a.id)) {
        docMap.set(a.id, { ...a });
      }
    });
    return Array.from(docMap.values());
  }, [corpusDocs, articles]);

  // Extract real text from Word documents (.docx, .doc, Base64, Google Docs) for N-Gram calculation
  useEffect(() => {
    let isMounted = true;
    const processDocs = async () => {
      setIsLoading(true);
      try {
        const processed = await Promise.all(
          allAvailableDocs.map(async (doc) => {
            const docTarget = doc.documentUrl || doc.spreadsheetUrl || doc.morfologiUrl || '';
            if (docTarget && docTarget.trim()) {
              try {
                const extractedText = await extractTextFromDocUrl(docTarget.trim(), doc.content);
                if (extractedText && extractedText.trim()) {
                  return {
                    ...doc,
                    content: extractedText.trim(),
                    wordCount: extractedText.trim().split(/\s+/).filter(Boolean).length
                  };
                }
              } catch (err) {
                console.warn(`Error extracting text for ${doc.title}:`, err);
              }
            }
            return doc;
          })
        );
        if (isMounted) {
          setHydratedDocs(processed);
        }
      } catch (e) {
        console.error('Error hydrating N-Gram documents:', e);
        if (isMounted) {
          setHydratedDocs(allAvailableDocs);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (allAvailableDocs.length > 0) {
      processDocs();
    } else {
      setHydratedDocs([]);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [allAvailableDocs]);

  // Filter target documents based on selection (multi-select activeSelectedDocIds)
  const targetDocs = useMemo(() => {
    if (!activeSelectedDocIds || activeSelectedDocIds.length === 0) {
      return hydratedDocs;
    }
    return hydratedDocs.filter(d => activeSelectedDocIds.includes(d.id));
  }, [hydratedDocs, activeSelectedDocIds]);

  // Filter hydratedDocs for the document checklist search
  const filteredHydratedDocs = useMemo(() => {
    if (!docSearchQuery.trim()) return hydratedDocs;
    const q = docSearchQuery.toLowerCase().trim();
    return hydratedDocs.filter(d => d.title.toLowerCase().includes(q) || (d.author && d.author.toLowerCase().includes(q)));
  }, [hydratedDocs, docSearchQuery]);

  // Scroll helpers for document checklist
  const scrollDocListUp = () => {
    if (docListContainerRef.current) {
      docListContainerRef.current.scrollBy({ top: -120, behavior: 'smooth' });
    }
  };
  const scrollDocListDown = () => {
    if (docListContainerRef.current) {
      docListContainerRef.current.scrollBy({ top: 120, behavior: 'smooth' });
    }
  };

  const selectedDocTitle = useMemo(() => {
    if (activeSelectedDocIds.length === 0 || activeSelectedDocIds.length === hydratedDocs.length) {
      return `Seluruh Dokumen Korpus (${hydratedDocs.length} Dokumen)`;
    }
    if (activeSelectedDocIds.length === 1) {
      const found = hydratedDocs.find(d => d.id === activeSelectedDocIds[0]);
      return found ? found.title : '1 Dokumen Terpilih';
    }
    return `${activeSelectedDocIds.length} dari ${hydratedDocs.length} Dokumen Terpilih`;
  }, [activeSelectedDocIds, hydratedDocs]);

  // Reset pagination when filters/search/doc selections change
  useEffect(() => {
    setCurrentPage(1);
  }, [ngramN, ngramRemoveStopwords, searchQuery, activeSelectedDocIds]);

  // Compute N-gram list derived directly from extracted Word document text
  const computedNgramList = useMemo(() => {
    if (targetDocs.length === 0) return [];
    
    // Generate n-grams (supports 2 = Bi-Gram, 3 = Tri-Gram, 4 = Tetra-Gram)
    const rawNgrams = generateNgramList(targetDocs, ngramN, {
      ignoreHarakat: true,
      removeStopwords: ngramRemoveStopwords
    });

    // Apply search query filter if user typed in search box
    if (searchQuery.trim()) {
      const qNorm = normalizeArabic(searchQuery.trim()).toLowerCase();
      return rawNgrams.filter(item => {
        const phraseNorm = normalizeArabic(item.phrase).toLowerCase();
        return phraseNorm.includes(qNorm);
      });
    }

    return rawNgrams;
  }, [targetDocs, ngramN, ngramRemoveStopwords, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(computedNgramList.length / ITEMS_PER_PAGE));
  const currentPageValid = Math.min(Math.max(1, currentPage), totalPages);

  const pagedNgramList = useMemo(() => {
    const start = (currentPageValid - 1) * ITEMS_PER_PAGE;
    return computedNgramList.slice(start, start + ITEMS_PER_PAGE);
  }, [computedNgramList, currentPageValid]);

  // Calculate max frequency for progress bar scaling
  const maxCount = useMemo(() => {
    if (computedNgramList.length === 0) return 1;
    return Math.max(...computedNgramList.map(item => item.count), 1);
  }, [computedNgramList]);

  // Handle clicking an N-Gram phrase to view directly in the full document article reader
  const handleOpenDocumentForPhrase = (phrase: string) => {
    if (!phrase) return;
    let targetDocId = '';

    const pNorm = normalizeArabic(phrase).toLowerCase();
    const match = targetDocs.find(d => {
      const textNorm = normalizeArabic(d.content || '').toLowerCase();
      return textNorm.includes(pNorm);
    }) || hydratedDocs.find(d => {
      const textNorm = normalizeArabic(d.content || '').toLowerCase();
      return textNorm.includes(pNorm);
    });

    if (match) {
      targetDocId = match.id;
    } else if (targetDocs.length > 0) {
      targetDocId = targetDocs[0].id;
    } else if (hydratedDocs.length > 0) {
      targetDocId = hydratedDocs[0].id;
    }

    if (onViewDocument && targetDocId) {
      onViewDocument(targetDocId, phrase);
    } else if (setKwicQuery && setKwicExact && handleKwicSearch && setKorpusSubTab) {
      setKwicQuery(phrase);
      setKwicExact(true);
      handleKwicSearch();
      setKorpusSubTab('pencarian');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in" id="subpanel-ngram">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
              Analisis N-Gram
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Deteksi urutan kata berulang langsung dari dokumen
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50/90 border border-emerald-200/80 text-[#056a3e] rounded-xl text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>Tersambung ke Daftar Dokumen</span>
            </div>
          </div>
        </div>

        {/* CONTROLS PANEL */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-3.5 shadow-3xs">
          
          {/* MULTI-DOCUMENT SELECTOR */}
          <div className="space-y-2 border-b border-slate-200/60 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#056a3e]" />
                <span>Pilih Dokumen N-Gram ({activeSelectedDocIds.length} / {hydratedDocs.length} Dokumen):</span>
              </label>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setActiveSelectedDocIds(hydratedDocs.map(d => d.id))}
                  className="text-[11px] text-[#056a3e] hover:text-[#044d2d] font-bold hover:underline cursor-pointer"
                  title="Pilih Semua Dokumen"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300 text-[10px]">|</span>
                <button
                  type="button"
                  onClick={() => setActiveSelectedDocIds([])}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                  title="Batalkan Semua Pilihan"
                >
                  Batal
                </button>
                <span className="text-slate-300 text-[10px]">|</span>
                <button
                  type="button"
                  onClick={() => setIsDocListExpanded(!isDocListExpanded)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-all cursor-pointer shadow-3xs"
                  title={isDocListExpanded ? "Sembunyikan Daftar Dokumen" : "Buka Daftar Dokumen"}
                >
                  {isDocListExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-[#056a3e]" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-[#056a3e]" />
                      <span>Atur Dokumen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsed View Summary Box */}
            {!isDocListExpanded && (
              <div 
                onClick={() => setIsDocListExpanded(true)}
                className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all text-xs text-slate-600 shadow-3xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckSquare className="w-4 h-4 text-[#056a3e] shrink-0" />
                  <span className="truncate font-medium">
                    {activeSelectedDocIds.length === 0 
                      ? 'Seluruh dokumen korpus dianalisis' 
                      : `${activeSelectedDocIds.length} dari ${hydratedDocs.length} artikel terpilih`}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#056a3e] bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 ml-2">
                  Buka List
                </span>
              </div>
            )}

            {/* Expanded Checklist Container */}
            {isDocListExpanded && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <div className="flex items-center gap-2">
                  {hydratedDocs.length > 1 && (
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        placeholder="Cari judul dokumen..."
                        className="w-full pl-8 pr-6 py-1 text-[11px] bg-white border border-slate-200 rounded-lg outline-none focus:border-[#056a3e] text-slate-800 placeholder:text-slate-400"
                      />
                      {docSearchQuery && (
                        <button 
                          onClick={() => setDocSearchQuery('')}
                          className="absolute right-2 top-1 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-3xs shrink-0 ml-auto">
                    <span className="text-[10px] text-slate-400 font-medium px-1">Navigasi:</span>
                    <button
                      type="button"
                      onClick={scrollDocListUp}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer transition-colors"
                      title="Gulir ke Atas"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-[#056a3e]" />
                    </button>
                    <button
                      type="button"
                      onClick={scrollDocListDown}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer transition-colors"
                      title="Gulir ke Bawah"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-[#056a3e]" />
                    </button>
                  </div>
                </div>

                <div 
                  ref={docListContainerRef}
                  className="max-h-48 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl space-y-1"
                >
                  {filteredHydratedDocs.map((doc) => {
                    const isSelected = activeSelectedDocIds.includes(doc.id);
                    return (
                      <label 
                        key={doc.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          isSelected ? 'bg-emerald-50/80 text-emerald-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setActiveSelectedDocIds(activeSelectedDocIds.filter(id => id !== doc.id));
                              } else {
                                setActiveSelectedDocIds([...activeSelectedDocIds, doc.id]);
                              }
                            }}
                            className="rounded border-slate-300 text-[#056a3e] focus:ring-[#056a3e] h-3.5 w-3.5 cursor-pointer shrink-0"
                          />
                          <span className="truncate">{doc.title}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {doc.wordCount || 0} kata
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            
            {/* N-Gram Length Segmented Buttons */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#056a3e]" />
                <span>Panjang Frasa:</span>
              </label>
              <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200 rounded-lg shadow-3xs">
                <button
                  type="button"
                  onClick={() => setNgramN(2)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                    ngramN === 2
                      ? 'bg-[#056a3e] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Bi-Gram (2)
                </button>
                <button
                  type="button"
                  onClick={() => setNgramN(3)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                    ngramN === 3
                      ? 'bg-[#056a3e] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Tri-Gram (3)
                </button>
                <button
                  type="button"
                  onClick={() => setNgramN(4)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                    ngramN === 4
                      ? 'bg-[#056a3e] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Tetra (4)
                </button>
              </div>
            </div>

            {/* Stopwords Checkbox */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#056a3e]" />
                <span>Opsi Filter:</span>
              </label>
              <label className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer shadow-3xs hover:bg-emerald-50/40 transition-colors">
                <span className="text-xs font-bold text-slate-700">Abaikan Kata Tugas (Stopwords)</span>
                <input
                  type="checkbox"
                  checked={ngramRemoveStopwords}
                  onChange={(e) => setNgramRemoveStopwords(e.target.checked)}
                  className="rounded border-slate-300 text-[#056a3e] focus:ring-[#056a3e] h-3.5 w-3.5 cursor-pointer"
                />
              </label>
            </div>

          </div>

          {/* Search Box */}
          <div className="pt-2.5 border-t border-slate-200/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari frasa Arab tertentu dalam hasil N-Gram..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/20 shadow-3xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ACTIVE SOURCE BANNER */}
        <div className="bg-amber-50/90 border border-amber-200/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 shadow-3xs">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              Menampilkan frasa berulang dari: <strong className="font-bold underline text-amber-900">{selectedDocTitle}</strong> ({computedNgramList.length} frasa).
            </span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs bg-emerald-100/60 px-2.5 py-0.5 rounded-lg">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              <span>Mengekstrak naskah Word...</span>
            </div>
          )}
        </div>

        {/* N-GRAM SYMMETRICAL CARDS GRID WITH OPTIMIZED FONT SIZES & PAGINATION */}
        {isLoading ? (
          <div className="py-12 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Loader2 className="w-7 h-7 text-[#056a3e] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700">Mengekstrak dan menganalisis frasa dari dokumen Word...</p>
            <p className="text-[10px] text-slate-400">Harap tunggu sebentar, data teks sedang diproses.</p>
          </div>
        ) : computedNgramList.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {pagedNgramList.map((item, index) => {
                const barWidthPct = Math.min(100, Math.max(12, (item.count / maxCount) * 100));
                const overallRank = (currentPageValid - 1) * ITEMS_PER_PAGE + index + 1;
                const isTop3 = overallRank <= 3;

                return (
                  <div
                    key={overallRank}
                    onClick={() => handleOpenDocumentForPhrase(item.phrase)}
                    className={`group relative flex flex-col justify-between p-2.5 sm:p-3 bg-white border transition-all rounded-lg shadow-3xs hover:shadow-xs cursor-pointer overflow-hidden ${
                      isTop3
                        ? 'border-emerald-200 hover:border-[#056a3e]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Card Header: Rank Number & Action Button */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0 shadow-3xs transition-all ${
                          overallRank === 1
                            ? 'bg-amber-500 text-white shadow-amber-200'
                            : overallRank === 2
                            ? 'bg-slate-400 text-white'
                            : overallRank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-[#056a3e] group-hover:text-white'
                        }`}>
                          {overallRank}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDocumentForPhrase(item.phrase);
                        }}
                        title="Buka Teks Artikel & Tandai Frasa Ini"
                        className="flex items-center gap-1 px-2 py-0.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-3xs shrink-0 active:scale-95"
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span>Buka Teks</span>
                      </button>
                    </div>

                    {/* Phrase Display (Comfortable Arabic Typography Size) */}
                    <div className="my-0.5 py-0.5">
                      <span dir="rtl" className="font-sans font-bold text-sm sm:text-base text-slate-800 leading-snug block text-right tracking-wide">
                        {item.phrase}
                      </span>
                    </div>

                    {/* Relative Frequency Bar & Count Badge */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[10px] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Kemunculan
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-[#056a3e] rounded text-[11px] font-bold">
                            {item.count} kali
                          </span>
                          <span className="text-slate-400 text-[9px] font-medium">
                            ({item.percentage.toFixed(3)}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop3 ? 'bg-[#056a3e]' : 'bg-emerald-500/80'
                          }`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/70">
                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan <strong className="font-bold text-slate-800">{(currentPageValid - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPageValid * ITEMS_PER_PAGE, computedNgramList.length)}</strong> dari <strong className="font-bold text-slate-800">{computedNgramList.length}</strong> frasa
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
          <div className="py-16 text-center text-slate-400 space-y-2 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 p-6">
            <Layers className="w-8 h-8 mx-auto text-slate-300" />
            <h4 className="text-xs font-bold text-slate-700">Tidak ada frasa N-Gram yang cocok</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Cobalah memilih dokumen Word lain, mengubah panjang N-Gram (Bi-Gram, Tri-Gram, atau Tetra-Gram), atau menonaktifkan pemfilteran kata tugas.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
