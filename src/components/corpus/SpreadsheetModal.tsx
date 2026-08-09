import React from 'react';
import { Table, X, ChevronLeft, ChevronRight, HelpCircle, ExternalLink, Search, FileX, Copy, Check, FileText, Download, BookOpen, Layers, Type, RefreshCw, Globe, Newspaper, Pencil } from 'lucide-react';
import { Article } from '../../types';
import { generateFrequencyList, normalizeArabic, ARABIC_STOPWORDS, tokenizeArabic } from '../../data/initialData';
import SpreadsheetEmbed, { getFallbackSpreadsheetData } from './SpreadsheetEmbed';
import { extractTextFromDocUrl } from '../../utils/docExtractor';

interface SpreadsheetModalProps {
  activeSpreadsheetArticle: Article;
  setActiveSpreadsheetArticle: (art: Article | null) => void;
  spreadsheetTab: 'analisis' | 'morfologi' | 'sintaksis' | 'semantik' | 'google-sheet';
  setSpreadsheetTab: (tab: 'analisis' | 'morfologi' | 'sintaksis' | 'semantik' | 'google-sheet') => void;
  hasWriteAccess: boolean;
  onUpdateArticle: (art: Article) => void;
  corpusSheetsCache: Record<string, string[][]>;
  corpusDocs?: Article[];
  articles?: Article[];
  initialHighlightQuery?: string;
}

export default function SpreadsheetModal({
  activeSpreadsheetArticle,
  setActiveSpreadsheetArticle,
  spreadsheetTab,
  setSpreadsheetTab,
  hasWriteAccess,
  onUpdateArticle,
  corpusSheetsCache,
  corpusDocs = [],
  articles = [],
  initialHighlightQuery
}: SpreadsheetModalProps) {
  // Modal internal states
  const [modalFreqLevel, setModalFreqLevel] = React.useState<'general' | 'morfologi' | 'sintaksis' | 'semantik'>('general');
  const [searchWordSpreadsheet, setSearchWordSpreadsheet] = React.useState('');
  const [spreadsheetPage, setSpreadsheetPage] = React.useState(1);

  // Article Reader states
  const [fetchedDocText, setFetchedDocText] = React.useState<string>('');
  const [loadingDocText, setLoadingDocText] = React.useState<boolean>(false);
  const [articleViewMode, setArticleViewMode] = React.useState<'reader' | 'embed'>('embed');
  const [articleSearchQuery, setArticleSearchQuery] = React.useState<string>('');
  const [copiedText, setCopiedText] = React.useState<boolean>(false);
  const [readerFontSize, setReaderFontSize] = React.useState<number>(20);
  const [readerFontFamily, setReaderFontFamily] = React.useState<string>('font-sans');
  const [editingSourceUrlInline, setEditingSourceUrlInline] = React.useState<boolean>(false);
  const [tempSourceUrl, setTempSourceUrl] = React.useState<string>('');

  // Auto-fetch raw text from Word document / link / Base64 when active article changes
  React.useEffect(() => {
    setModalFreqLevel('general');
    setSearchWordSpreadsheet('');
    setSpreadsheetPage(1);
    setFetchedDocText('');
    setArticleSearchQuery('');

    const docUrl = activeSpreadsheetArticle?.documentUrl || activeSpreadsheetArticle?.spreadsheetUrl || activeSpreadsheetArticle?.morfologiUrl;
    if (docUrl && typeof docUrl === 'string' && docUrl.trim()) {
      setLoadingDocText(true);
      extractTextFromDocUrl(docUrl.trim(), activeSpreadsheetArticle?.content)
        .then(extractedText => {
          if (extractedText && extractedText.trim()) {
            setFetchedDocText(extractedText.trim());
          } else {
            setFetchedDocText(activeSpreadsheetArticle?.content || '');
          }
        })
        .catch(err => {
          console.error('Error parsing doc text in modal:', err);
          setFetchedDocText(activeSpreadsheetArticle?.content || '');
        })
        .finally(() => setLoadingDocText(false));
    } else {
      setFetchedDocText(activeSpreadsheetArticle?.content || '');
    }
  }, [activeSpreadsheetArticle]);

  // Combined full article text (prioritizing fetched doc text from uploaded Word file/link)
  const fullArticleContent = React.useMemo(() => {
    if (fetchedDocText && fetchedDocText.trim()) {
      return fetchedDocText;
    }
    return activeSpreadsheetArticle?.content || '';
  }, [fetchedDocText, activeSpreadsheetArticle]);

  // Handle initial highlight query from KWIC click
  React.useEffect(() => {
    if (initialHighlightQuery && initialHighlightQuery.trim()) {
      setArticleSearchQuery(initialHighlightQuery.trim());
      setArticleViewMode('reader');
      setSpreadsheetTab('google-sheet');
    }
  }, [initialHighlightQuery, setSpreadsheetTab]);

  // Smooth scroll to highlighted KWIC target element when available
  React.useEffect(() => {
    if (spreadsheetTab === 'google-sheet' && articleSearchQuery) {
      const timer = setTimeout(() => {
        const el = document.getElementById('highlighted-kwic-target');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [spreadsheetTab, articleSearchQuery, fullArticleContent, articleViewMode]);

  // Helper to find word column in sheet data (automatically skipping any Number / "No" column)
  const findWordColumnIndex = React.useCallback((data: string[][]): number => {
    if (!data || data.length === 0) return 0;
    const headers = data[0];
    if (headers && headers.length > 0) {
      const keywords = ['kata', 'lafadz', 'lafaz', 'word', 'الكلمة', 'اللفظ', 'term', 'lafadh'];
      for (let i = 0; i < headers.length; i++) {
        const h = (headers[i] || '').toLowerCase();
        if (keywords.some(kw => h.includes(kw))) {
          return i;
        }
      }
    }
    
    // Check first data row (usually row index 1)
    if (data.length > 1) {
      const firstRow = data[1];
      if (firstRow && firstRow.length > 1) {
        const col0 = (firstRow[0] || '').trim();
        // If column 0 is a number, the actual word is most likely in column 1
        if (/^\d+$/.test(col0) || col0 === '') {
          return 1;
        }
      }
    }
    return 0;
  }, []);

  // Extract word column from spreadsheet 2D array
  const getWordsFromSheet = React.useCallback((sheetData: string[][]): string[] => {
    if (!sheetData || sheetData.length <= 1) return [];
    const colIdx = findWordColumnIndex(sheetData);
    const words: string[] = [];
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row && row[colIdx]) {
        const word = row[colIdx].trim();
        if (word && word !== '-' && word !== 'undefined' && word !== 'null') {
          words.push(word);
        }
      }
    }
    return words;
  }, [findWordColumnIndex]);

  // Computes word frequencies from a list of custom words (with stopword support and Arabic normalization)
  const computeFrequencyFromWords = React.useCallback((
    words: string[],
    options: { ignoreHarakat?: boolean; removeStopwords?: boolean; searchFilter?: string } = {}
  ) => {
    const ignoreHarakat = options.ignoreHarakat !== false;
    const removeStopwords = options.removeStopwords === true;
    const searchFilter = options.searchFilter || '';

    const frequencyMap: Record<string, number> = {};
    let totalTokensCount = 0;

    words.forEach(tok => {
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

    // Apply search filter
    if (searchFilter.trim()) {
      const filterNorm = normalizeArabic(searchFilter.trim()).toLowerCase();
      items = items.filter(item => {
        const itemNorm = normalizeArabic(item.word).toLowerCase();
        return itemNorm.includes(filterNorm);
      });
    }

    return items;
  }, []);

  // Handle resetting page when search query changes
  React.useEffect(() => {
    setSpreadsheetPage(1);
  }, [searchWordSpreadsheet, modalFreqLevel]);

  const modalFreqArticles = React.useMemo(() => {
    if (!activeSpreadsheetArticle) return [];
    
    if (modalFreqLevel === 'general') {
      return [activeSpreadsheetArticle];
    }
    if (modalFreqLevel === 'morfologi' && !activeSpreadsheetArticle.morfologiUrl) return [];
    if (modalFreqLevel === 'sintaksis' && !activeSpreadsheetArticle.sintaksisUrl) return [];
    if (modalFreqLevel === 'semantik' && !activeSpreadsheetArticle.semantikUrl) return [];
    
    return [activeSpreadsheetArticle];
  }, [activeSpreadsheetArticle, modalFreqLevel]);

  // Word stats computation helper for selected article
  const localFreqList = React.useMemo(() => {
    if (modalFreqLevel === 'general') {
      const allWords: string[] = [];
      
      // 1. Include full text from Word document or content field
      if (fullArticleContent && fullArticleContent.trim()) {
        const wordsFromDoc = tokenizeArabic(fullArticleContent);
        allWords.push(...wordsFromDoc);
      }

      // 2. Also check if there's cached spreadsheet data
      modalFreqArticles.forEach(doc => {
        const sheetKeys = [
          `${doc.id}-google-sheet`,
          `${doc.id}-spreadsheet`,
          `${doc.id}-general`
        ];
        let sheetData: string[][] | undefined;
        for (const k of sheetKeys) {
          if (corpusSheetsCache[k] && corpusSheetsCache[k].length > 1) {
            sheetData = corpusSheetsCache[k];
            break;
          }
        }

        if (sheetData) {
          const words = getWordsFromSheet(sheetData);
          allWords.push(...words);
        }
      });

      if (allWords.length > 0) {
        const list = computeFrequencyFromWords(allWords, { ignoreHarakat: true, removeStopwords: false });
        return list.map(item => ({
          word: item.word,
          count: item.count,
          percentage: item.percentage.toFixed(2)
        }));
      }

      return [];
    }

    const allWords: string[] = [];
    modalFreqArticles.forEach(doc => {
      const cacheKey = `${doc.id}-${modalFreqLevel}`;
      const sheetData = corpusSheetsCache[cacheKey];
      if (sheetData && sheetData.length > 1) {
        const words = getWordsFromSheet(sheetData);
        allWords.push(...words);
      }
    });

    const list = computeFrequencyFromWords(allWords, {
      ignoreHarakat: true,
      removeStopwords: false
    });

    return list.map(item => ({
      word: item.word,
      count: item.count,
      percentage: item.percentage.toFixed(2)
    }));
  }, [modalFreqArticles, modalFreqLevel, corpusSheetsCache, getWordsFromSheet, computeFrequencyFromWords, fullArticleContent]);

  const filteredLocalFreqList = React.useMemo(() => {
    if (!searchWordSpreadsheet.trim()) return localFreqList;
    const query = searchWordSpreadsheet.toLowerCase().trim();
    return localFreqList.filter(item => 
      item.word.toLowerCase().includes(query)
    );
  }, [localFreqList, searchWordSpreadsheet]);

  const itemsPerPage = 8;
  const totalSpreadsheetPages = Math.ceil(filteredLocalFreqList.length / itemsPerPage);
  const paginatedSpreadsheetList = React.useMemo(() => {
    const startIndex = (spreadsheetPage - 1) * itemsPerPage;
    return filteredLocalFreqList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLocalFreqList, spreadsheetPage]);

  // Highlighting helper for reading article text with KWIC scroll anchor
  const renderHighlightedArticleText = (text: string, q: string) => {
    if (!q || !q.trim()) return text;
    try {
      const escapedQuery = q.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = text.split(regex);
      let matchCount = 0;
      return (
        <>
          {parts.map((part, i) => {
            if (regex.test(part)) {
              matchCount++;
              return (
                <mark
                  key={i}
                  id={matchCount === 1 ? "highlighted-kwic-target" : undefined}
                  className="bg-amber-300 text-amber-950 font-bold px-2 py-0.5 rounded border border-amber-400 shadow-3xs transition-all animate-pulse"
                >
                  {part}
                </mark>
              );
            }
            return part;
          })}
        </>
      );
    } catch (e) {
      return text;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-5 transition-all animate-fade-in" 
      id="modal-spreadsheet"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setActiveSpreadsheetArticle(null);
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-6xl xl:max-w-7xl w-full h-[92vh] max-h-[96vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 ring-1 ring-black/5 animate-slide-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100/80 text-[#056a3e] rounded-xl flex items-center justify-center shrink-0 shadow-3xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Pembaca & Analisis Dokumen
              </h3>
              <p className="text-[11px] text-slate-500">
                Pangkalan Naskah Korpus Bahasa Arab & Frekuensi Kata
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Link Berita Asli Button */}
            {activeSpreadsheetArticle.sourceUrl ? (
              <a
                href={activeSpreadsheetArticle.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
                title="Buka Link Berita Utama / Sumber Media Asli"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Link Berita Asli</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            ) : hasWriteAccess ? (
              <button
                onClick={() => {
                  const url = prompt("Masukkan Tautan Link Berita Asli (Sumber Media):", activeSpreadsheetArticle.sourceUrl || "");
                  if (url !== null) {
                    const updated = { ...activeSpreadsheetArticle, sourceUrl: url.trim() };
                    onUpdateArticle(updated);
                    setActiveSpreadsheetArticle(updated);
                  }
                }}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Tambah Link Berita Asli"
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>+ Link Berita Asli</span>
              </button>
            ) : null}

            {/* Link Dokumen Word / Google Docs Button */}
            {(activeSpreadsheetArticle.spreadsheetUrl || activeSpreadsheetArticle.documentUrl) && (
              <a
                href={activeSpreadsheetArticle.documentUrl || activeSpreadsheetArticle.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
                title="Buka Tautan Berkas Word / Google Docs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Link Dokumen Word</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            )}

            <button
              onClick={() => setActiveSpreadsheetArticle(null)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer ml-1 shadow-3xs"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSpreadsheetTab('analisis')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                spreadsheetTab === 'analisis'
                  ? 'bg-[#056a3e] text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#056a3e] border border-slate-200 hover:border-emerald-200'
              }`}
            >
              Frekuensi Kata
            </button>
            <button
              onClick={() => setSpreadsheetTab('morfologi')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                spreadsheetTab === 'morfologi'
                  ? 'bg-[#056a3e] text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#056a3e] border border-slate-200 hover:border-emerald-200'
              }`}
            >
              Morfologi
            </button>
            <button
              onClick={() => setSpreadsheetTab('sintaksis')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                spreadsheetTab === 'sintaksis'
                  ? 'bg-[#056a3e] text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#056a3e] border border-slate-200 hover:border-emerald-200'
              }`}
            >
              Sintaksis
            </button>
            <button
              onClick={() => setSpreadsheetTab('semantik')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                spreadsheetTab === 'semantik'
                  ? 'bg-[#056a3e] text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#056a3e] border border-slate-200 hover:border-emerald-200'
              }`}
            >
              Semantik
            </button>
            <button
              onClick={() => setSpreadsheetTab('google-sheet')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                spreadsheetTab === 'google-sheet'
                  ? 'bg-[#056a3e] text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#056a3e] border border-slate-200 hover:border-emerald-200'
              }`}
            >
              Artikel Dokumen
            </button>
          </div>
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
          
          {/* Tab 1: Analisis Frekuensi Kata */}
          {spreadsheetTab === 'analisis' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-end">
                {/* Internal modal filters */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      dir="ltr"
                      value={searchWordSpreadsheet}
                      onChange={(e) => setSearchWordSpreadsheet(e.target.value)}
                      placeholder="Cari kata Arab..."
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs outline-none text-slate-800 font-medium font-sans"
                    />
                  </div>
                  <select
                    value={modalFreqLevel}
                    onChange={(e) => setModalFreqLevel(e.target.value as any)}
                    className="pl-3 pr-10 py-2 bg-white border border-slate-200 focus:border-[#056a3e] rounded-xl text-xs outline-none text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="general">Teks Mentah Word Dokumen</option>
                    <option value="morfologi">Morfologi (Sharaf)</option>
                    <option value="sintaksis">Sintaksis (Nahu)</option>
                    <option value="semantik">Semantik (Makna)</option>
                  </select>
                </div>
              </div>

              {/* Synchronization Feedback Message */}
              {localFreqList.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {modalFreqLevel === 'general' ? (
                    <span>Sumber Data: Frekuensi kata dihitung secara otomatis langsung dari teks naskah Word yang diunggah ({tokenizeArabic(fullArticleContent).length} kata terdeteksi).</span>
                  ) : (
                    <span>Sinkron: Frekuensi kata selaras dengan data {modalFreqLevel === 'morfologi' ? 'Morfologi' : modalFreqLevel === 'sintaksis' ? 'Sintaksis' : 'Semantik'}.</span>
                  )}
                </div>
              )}

              {loadingDocText && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Sedang mengekstrak dan membaca teks lengkap dari dokumen Word...</span>
                </div>
              )}

              {localFreqList.length > 0 ? (
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-3xs bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 text-center w-16">No</th>
                        <th className="py-3 px-6 text-right font-sans">Kosakata (Bahasa Arab)</th>
                        <th className="py-3 px-6 text-center">Jumlah Frekuensi</th>
                        <th className="py-3 px-6 text-center">Persentase Kemunculan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSpreadsheetList.map((item, idx) => {
                        const globalIdx = (spreadsheetPage - 1) * itemsPerPage + idx + 1;
                        return (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-center text-xs font-mono font-bold text-slate-400">{globalIdx}</td>
                            <td dir="rtl" className="py-3 px-6 text-right font-sans text-base font-bold text-[#056a3e] tracking-wide">{item.word}</td>
                            <td className="py-3 px-6 text-center text-xs font-bold text-slate-700">{item.count} kali</td>
                            <td className="py-3 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-[#056a3e] h-full rounded-full" 
                                    style={{ width: `${Math.min(parseFloat(item.percentage) * 10, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-500">{item.percentage}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination for word counts */}
                  {totalSpreadsheetPages > 1 && (
                    <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">
                        Menampilkan <strong className="text-slate-800">{(spreadsheetPage - 1) * itemsPerPage + 1}</strong> hingga <strong className="text-slate-800">{Math.min(spreadsheetPage * itemsPerPage, filteredLocalFreqList.length)}</strong> dari <strong className="text-slate-800">{filteredLocalFreqList.length}</strong> kosakata
                      </span>
                      <div className="flex gap-1">
                        <button
                          disabled={spreadsheetPage === 1}
                          onClick={() => setSpreadsheetPage(p => Math.max(1, p - 1))}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          disabled={spreadsheetPage === totalSpreadsheetPages}
                          onClick={() => setSpreadsheetPage(p => Math.min(totalSpreadsheetPages, p + 1))}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-14 px-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/90 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 shadow-3xs">
                    <FileX className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <p className="text-sm font-semibold text-slate-700">
                      {modalFreqLevel === 'general'
                        ? (!fullArticleContent || !fullArticleContent.trim()
                            ? 'Belum Ada Naskah Dokumen Word'
                            : 'Hasil Kosong')
                        : 'Spreadsheet Belum Terhubung'}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {modalFreqLevel === 'general' 
                        ? (!fullArticleContent || !fullArticleContent.trim()
                            ? 'Belum ada naskah atau isi dokumen Word yang diunggah. Teks artikel diperlukan untuk menghitung dan menampilkan statistik frekuensi kata.'
                            : 'Kosakata tidak ditemukan dalam naskah dokumen ini.')
                        : `Tidak ada data frekuensi kata karena tautan spreadsheet ${modalFreqLevel === 'morfologi' ? 'Morfologi' : modalFreqLevel === 'sintaksis' ? 'Sintaksis' : 'Semantik'} belum dihubungkan pada dokumen ini.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Morfologi */}
          {spreadsheetTab === 'morfologi' && (
            <SpreadsheetEmbed
              title="Analisis Morfologi (Sharaf)"
              description="Analisis Morfologi berfokus pada struktur pembentukan kata bahasa Arab (Tasrif, Wazan, Fi’il, Isim, Harf, prefiks, infiks, sufiks, serta identifikasi akar kata/Mujarrad-Mazid)."
              fieldKey="morfologiUrl"
              activeSpreadsheetArticle={activeSpreadsheetArticle}
              onUpdateArticle={onUpdateArticle}
              setActiveSpreadsheetArticle={setActiveSpreadsheetArticle}
              hasWriteAccess={hasWriteAccess}
              spreadsheetTab={spreadsheetTab}
            />
          )}

          {/* Tab 3: Sintaksis */}
          {spreadsheetTab === 'sintaksis' && (
            <SpreadsheetEmbed
              title="Analisis Sintaksis (Nahu / I'rab)"
              description="Analisis Sintaksis berfokus pada struktur kalimat, jabatan kata (Fa’il, Ma’ful bih, Mudhaf ilaih, Mubtada’, Khabar), penentuan I’rab (Rafa', Nasab, Jar, Jazm), serta hubungan sintaktis antar frasa."
              fieldKey="sintaksisUrl"
              activeSpreadsheetArticle={activeSpreadsheetArticle}
              onUpdateArticle={onUpdateArticle}
              setActiveSpreadsheetArticle={setActiveSpreadsheetArticle}
              hasWriteAccess={hasWriteAccess}
              spreadsheetTab={spreadsheetTab}
            />
          )}

          {/* Tab 4: Semantik */}
          {spreadsheetTab === 'semantik' && (
            <SpreadsheetEmbed
              title="Analisis Semantik (Makna)"
              description="Analisis Semantik berfokus pada pemetaan makna kata, hubungan sinonim (Taraduf), antonim (Tadhad), medan makna (semantic field), polisemi, metafora (Majaz), serta analisis kolokasi berbasis makna dalam konteks kalimat."
              fieldKey="semantikUrl"
              activeSpreadsheetArticle={activeSpreadsheetArticle}
              onUpdateArticle={onUpdateArticle}
              setActiveSpreadsheetArticle={setActiveSpreadsheetArticle}
              hasWriteAccess={hasWriteAccess}
              spreadsheetTab={spreadsheetTab}
            />
          )}

          {/* Tab 5: Artikel Dokumen (Full Teks Word Viewer) */}
          {spreadsheetTab === 'google-sheet' && (
            <div className="space-y-4 animate-fade-in">
              {/* Toggle Mode: Reader Teks Word vs Iframe Embed */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-3xs">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-[#056a3e] rounded-xl">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Naskah Dokumen Word</h4>
                    <p className="text-[11px] text-slate-500">Tampilan lengkap teks naskah untuk kemudahan membaca dan analisis.</p>
                  </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setArticleViewMode('reader')}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      articleViewMode === 'reader'
                        ? 'bg-white text-[#056a3e] shadow-3xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Teks Pembaca</span>
                  </button>
                  <button
                    onClick={() => setArticleViewMode('embed')}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      articleViewMode === 'embed'
                        ? 'bg-white text-[#056a3e] shadow-3xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Dokumen Original</span>
                  </button>
                </div>
              </div>

              {articleViewMode === 'reader' ? (
                <div className="space-y-4">
                  {/* Article Stats & Search Toolbar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-[#056a3e] rounded-lg text-xs font-bold border border-emerald-100">
                        {tokenizeArabic(fullArticleContent).length} Kata Total
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200">
                        {fullArticleContent.length} Karakter
                      </span>
                      {activeSpreadsheetArticle.category && (
                        <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-semibold border border-teal-100">
                          Genre: {activeSpreadsheetArticle.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={articleSearchQuery}
                          onChange={(e) => setArticleSearchQuery(e.target.value)}
                          placeholder="Cari kata dalam teks..."
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e]"
                        />
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(fullArticleContent);
                          setCopiedText(true);
                          setTimeout(() => setCopiedText(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText ? 'Tersalin' : 'Salin Teks'}</span>
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([fullArticleContent], { type: 'text/plain;charset=utf-8' });
                          const element = document.createElement('a');
                          element.href = URL.createObjectURL(blob);
                          element.download = `${activeSpreadsheetArticle.title.replace(/\s+/g, '_')}_WordText.txt`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                        className="px-3 py-1.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh TXT</span>
                      </button>
                    </div>
                  </div>

                  {/* KWIC Highlight Information Banner */}
                  {articleSearchQuery && articleSearchQuery.trim() && (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 shadow-3xs animate-fade-in">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-200/80 text-amber-950 rounded-lg font-bold border border-amber-300 shrink-0">
                          Penanda Kata (KWIC)
                        </span>
                        <span>
                          Menandai kata <strong className="font-bold underline text-amber-950">{articleSearchQuery}</strong> dalam teks naskah untuk melihat konteks kalimat sebelum dan sesudahnya.
                        </span>
                      </div>
                      <button
                        onClick={() => setArticleSearchQuery('')}
                        className="px-2.5 py-1 bg-amber-200/60 hover:bg-amber-300 text-amber-950 rounded-lg font-bold text-[11px] transition-colors cursor-pointer shrink-0 ml-auto"
                      >
                        Hapus Penandaan
                      </button>
                    </div>
                  )}

                  {/* Large Clear Article Reader Container */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
                    {/* Title & Metadata Header inside the reader box */}
                    <div className="text-center border-b border-slate-100 pb-6 space-y-2">
                      <h2 
                        dir="rtl" 
                        className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-snug tracking-wide text-center"
                        style={{ fontFamily: "'Traditional Arabic', 'Amiri', 'Traditional Naskh', serif" }}
                      >
                        {activeSpreadsheetArticle.title}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                        <span>Penulis: <strong className="text-slate-700">{activeSpreadsheetArticle.author}</strong></span>
                        <span>•</span>
                        <span>Bahasa: <strong className="text-slate-700">Arab - Indonesia</strong></span>
                        {activeSpreadsheetArticle.category && (
                          <>
                            <span>•</span>
                            <span>Genre: <strong className="text-slate-700">{activeSpreadsheetArticle.category}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {loadingDocText ? (
                      <div className="py-20 flex flex-col items-center justify-center space-y-3">
                        <span className="w-8 h-8 border-3 border-[#056a3e] border-t-transparent rounded-full animate-spin"></span>
                        <p className="text-xs font-semibold text-slate-600">Membaca dan mengekstrak teks Word dari tautan dokumen...</p>
                      </div>
                    ) : fullArticleContent && fullArticleContent.trim() ? (
                      <div className="bg-slate-50/40 p-6 sm:p-8 rounded-2xl border border-slate-100">
                        <div 
                          dir="rtl" 
                          className="text-lg sm:text-xl md:text-2xl text-slate-800 leading-relaxed sm:leading-[2.2] tracking-wide text-justify whitespace-pre-wrap select-text selection:bg-emerald-100 selection:text-emerald-950"
                          style={{ fontFamily: "'Traditional Arabic', 'Amiri', 'Traditional Naskh', serif" }}
                        >
                          {renderHighlightedArticleText(fullArticleContent, articleSearchQuery)}
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <div className="space-y-1 max-w-md mx-auto">
                          <p className="text-xs font-bold text-slate-700">Teks Naskah Word Tidak Ditemukan</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Pastikan Anda telah memasukkan tautan Word / Google Docs atau mengunggah file naskah dokumen pada artikel ini.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <SpreadsheetEmbed
                  title="Artikel Dokumen"
                  description="Naskah atau data artikel utama yang memuat teks naskah dan data pangkalan analisis dari dokumen ini."
                  fieldKey="spreadsheetUrl"
                  activeSpreadsheetArticle={activeSpreadsheetArticle}
                  onUpdateArticle={onUpdateArticle}
                  setActiveSpreadsheetArticle={setActiveSpreadsheetArticle}
                  hasWriteAccess={hasWriteAccess}
                  spreadsheetTab={spreadsheetTab}
                  defaultViewMode="iframe"
                />
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <span className="text-[11px] text-slate-400 font-medium">ArabNet Corpus Analytics • Pangkalan Naskah & Teks Berita</span>
          <div className="flex gap-2 flex-wrap items-center">
            {activeSpreadsheetArticle.sourceUrl && (
              <a
                href={activeSpreadsheetArticle.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-3xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Buka Link Berita Asli</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            )}
            {(activeSpreadsheetArticle.spreadsheetUrl || activeSpreadsheetArticle.documentUrl) && (
              <a
                href={activeSpreadsheetArticle.documentUrl || activeSpreadsheetArticle.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-3xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka Dokumen Word</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            )}
            <button
              onClick={() => setActiveSpreadsheetArticle(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

