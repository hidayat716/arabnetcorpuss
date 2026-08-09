import React from 'react';
import { BarChart3, Filter, HelpCircle, ChevronDown, ChevronUp, Search, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Article } from '../../types';
import { generateFrequencyList, normalizeArabic, ARABIC_STOPWORDS, tokenizeArabic } from '../../data/initialData';
import { getFallbackSpreadsheetData } from './SpreadsheetEmbed';

interface FrekuensiKataProps {
  corpusDocs: Article[];
  corpusSheetsCache: Record<string, string[][]>;
  selectedFreqDocIds: string[];
  setSelectedFreqDocIds: React.Dispatch<React.SetStateAction<string[]>> | ((val: string[]) => void);
  freqRemoveStopwords: boolean;
  setFreqRemoveStopwords: (val: boolean) => void;
  freqIgnoreHarakat: boolean;
  setFreqIgnoreHarakat: (val: boolean) => void;
  freqSearchFilter: string;
  setFreqSearchFilter: (val: string) => void;
  setKwicQuery: (val: string) => void;
  setKwicExact: (val: boolean) => void;
  handleKwicSearch: () => void;
  setKorpusSubTab: (subTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah') => void;
}

export default function FrekuensiKata({
  corpusDocs,
  corpusSheetsCache,
  selectedFreqDocIds,
  setSelectedFreqDocIds,
  freqRemoveStopwords,
  setFreqRemoveStopwords,
  freqIgnoreHarakat,
  setFreqIgnoreHarakat,
  freqSearchFilter,
  setFreqSearchFilter,
  setKwicQuery,
  setKwicExact,
  handleKwicSearch,
  setKorpusSubTab
}: FrekuensiKataProps) {
  // Main Frequency Tab Alignment States
  const [selectedFreqLevel, setSelectedFreqLevel] = React.useState<'general' | 'morfologi' | 'sintaksis' | 'semantik'>('general');
  const [localFreqPage, setLocalFreqPage] = React.useState(1);
  const [isDocListExpanded, setIsDocListExpanded] = React.useState(true);
  const [docSearchQuery, setDocSearchQuery] = React.useState('');

  const docListRef = React.useRef<HTMLDivElement>(null);

  const scrollDocListLeft = () => {
    if (docListRef.current) {
      docListRef.current.scrollBy({ left: -180, behavior: 'smooth' });
    }
  };

  const scrollDocListRight = () => {
    if (docListRef.current) {
      docListRef.current.scrollBy({ left: 180, behavior: 'smooth' });
    }
  };

  const scrollDocListUp = () => {
    if (docListRef.current) {
      docListRef.current.scrollBy({ top: -100, behavior: 'smooth' });
    }
  };

  const scrollDocListDown = () => {
    if (docListRef.current) {
      docListRef.current.scrollBy({ top: 100, behavior: 'smooth' });
    }
  };

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

  // Reset page when filter/level changes
  React.useEffect(() => {
    setLocalFreqPage(1);
  }, [selectedFreqDocIds, selectedFreqLevel]);

  const activeFreqArticles = React.useMemo(() => {
    const selectedDocs = corpusDocs.filter(doc => selectedFreqDocIds.includes(doc.id));
    if (selectedFreqLevel === 'general') {
      return selectedDocs.filter(doc => !!doc.spreadsheetUrl || (!!doc.content && !!doc.content.trim()));
    } else if (selectedFreqLevel === 'morfologi') {
      return selectedDocs.filter(doc => !!doc.morfologiUrl);
    } else if (selectedFreqLevel === 'sintaksis') {
      return selectedDocs.filter(doc => !!doc.sintaksisUrl);
    } else if (selectedFreqLevel === 'semantik') {
      return selectedDocs.filter(doc => !!doc.semantikUrl);
    }
    return selectedDocs;
  }, [corpusDocs, selectedFreqDocIds, selectedFreqLevel]);

  const mainFrequencyList = React.useMemo(() => {
    if (selectedFreqLevel === 'general') {
      const allWords: string[] = [];
      activeFreqArticles.forEach(doc => {
        // Fetch from spreadsheet cache if available, or fall back to document content text
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
        } else if (doc.content && doc.content.trim()) {
          const words = tokenizeArabic(doc.content);
          allWords.push(...words);
        }
      });

      if (allWords.length > 0) {
        return computeFrequencyFromWords(allWords, {
          ignoreHarakat: freqIgnoreHarakat,
          removeStopwords: freqRemoveStopwords,
          searchFilter: freqSearchFilter
        });
      }

      return [];
    }

    const allWords: string[] = [];
    activeFreqArticles.forEach(doc => {
      const cacheKey = `${doc.id}-${selectedFreqLevel}`;
      const sheetData = corpusSheetsCache[cacheKey];
      if (sheetData && sheetData.length > 1) {
        const words = getWordsFromSheet(sheetData);
        allWords.push(...words);
      }
    });

    return computeFrequencyFromWords(allWords, {
      ignoreHarakat: freqIgnoreHarakat,
      removeStopwords: freqRemoveStopwords,
      searchFilter: freqSearchFilter
    });
  }, [activeFreqArticles, selectedFreqLevel, corpusSheetsCache, freqIgnoreHarakat, freqRemoveStopwords, freqSearchFilter, getWordsFromSheet, computeFrequencyFromWords]);

  const mainFreqPerPage = 8;
  const mainTotalFreqPages = Math.ceil(mainFrequencyList.length / mainFreqPerPage);
  const mainDisplayedFrequencyList = React.useMemo(() => {
    return mainFrequencyList.slice(
      (localFreqPage - 1) * mainFreqPerPage,
      localFreqPage * mainFreqPerPage
    );
  }, [mainFrequencyList, localFreqPage]);

  return (
    <div className="space-y-6" id="subpanel-frekuensi">
      
      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
        
        {/* Filter Configuration */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5 h-fit">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Penyelarasan & Statistik</h3>
          
          {/* Document Multi-Selector Checkboxes */}
          <div className="space-y-2 border border-slate-200/80 rounded-xl p-3 bg-slate-50/40">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <label className="text-xs font-bold text-slate-800 block">
                Pilih Dokumen ({selectedFreqDocIds.length}/{corpusDocs.length}):
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedFreqDocIds(corpusDocs.map(d => d.id))}
                  className="text-[10px] text-[#056a3e] hover:text-[#044d2d] font-bold hover:underline cursor-pointer"
                  title="Pilih Semua Dokumen"
                >
                  Semua
                </button>
                <span className="text-slate-300 text-[10px]">|</span>
                <button
                  onClick={() => setSelectedFreqDocIds([])}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                  title="Batalkan Semua Pilihan"
                >
                  Batal
                </button>
                <span className="text-slate-300 text-[10px]">|</span>
                <button
                  onClick={() => setIsDocListExpanded(!isDocListExpanded)}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-all cursor-pointer shadow-3xs"
                  title={isDocListExpanded ? "Sembunyikan Daftar Judul" : "Tampilkan Daftar Judul"}
                >
                  {isDocListExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 text-[#056a3e]" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 text-[#056a3e]" />
                      <span>Tampilkan</span>
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
                    {selectedFreqDocIds.length === 0 
                      ? 'Belum ada dokumen terpilih' 
                      : `${selectedFreqDocIds.length} dari ${corpusDocs.length} artikel terpilih`}
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
                {/* Search & Horizontal Rolling Controls */}
                <div className="flex items-center gap-2">
                  {corpusDocs.length > 1 && (
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        placeholder="Cari judul..."
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

                  {/* Directional Rolling & Scroll Buttons (Up, Down, Left, Right) */}
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
                    <span className="text-[10px] text-slate-300 font-bold">|</span>
                    <button
                      type="button"
                      onClick={scrollDocListLeft}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer transition-colors"
                      title="Geser ke Kiri"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-[#056a3e]" />
                    </button>
                    <button
                      type="button"
                      onClick={scrollDocListRight}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer transition-colors"
                      title="Geser ke Kanan"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#056a3e]" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Checklist Box (Supports vertical + horizontal scrolling / rolling bar) */}
                <div 
                  ref={docListRef}
                  className="max-h-52 overflow-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
                >
                  {corpusDocs
                    .filter(doc => !docSearchQuery.trim() || doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()))
                    .map((doc) => {
                      const isChecked = selectedFreqDocIds.includes(doc.id);

                      return (
                        <label 
                          key={doc.id} 
                          className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors cursor-pointer text-xs min-w-max ${
                            isChecked ? 'bg-emerald-50/60 shadow-3xs border border-emerald-100/80' : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedFreqDocIds(selectedFreqDocIds.filter(id => id !== doc.id));
                              } else {
                                setSelectedFreqDocIds([...selectedFreqDocIds, doc.id]);
                              }
                            }}
                            className="mt-0.5 rounded border-slate-300 text-[#056a3e] focus:ring-[#056a3e] h-3.5 w-3.5 cursor-pointer shrink-0"
                          />
                          <div className="whitespace-nowrap pr-2">
                            <span className={`font-semibold inline-block ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                              {doc.title}
                            </span>
                          </div>
                        </label>
                      );
                    })}

                  {corpusDocs.filter(doc => !docSearchQuery.trim() || doc.title.toLowerCase().includes(docSearchQuery.toLowerCase())).length === 0 && (
                    <div className="text-center py-3 text-[11px] text-slate-400 font-medium">
                      Tidak ada artikel yang cocok.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Analysis Level Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Tingkat Analisis & Spreadsheet:</label>
            <select
              value={selectedFreqLevel}
              onChange={(e) => setSelectedFreqLevel(e.target.value as any)}
              className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 rounded-xl text-xs outline-none text-slate-800 font-medium cursor-pointer"
            >
              <option value="general">Teks Mentah (Bawaan)</option>
              <option value="morfologi">Morfologi (Sharaf)</option>
              <option value="sintaksis">Sintaksis (Nahu / I'rab)</option>
              <option value="semantik">Semantik (Makna)</option>
            </select>
          </div>

          {/* Status and Synchronization message */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${mainFrequencyList.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></div>
              <span className="text-xs font-bold text-slate-700">Status Penyelarasan:</span>
            </div>
            {mainFrequencyList.length > 0 ? (
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {selectedFreqLevel === 'general' ? (
                  <>Tersambung dengan analisis teks otomatis ({activeFreqArticles.length} dokumen).</>
                ) : (
                  <>Sinkron dengan Google Sheets {selectedFreqLevel === 'morfologi' ? 'Morfologi' : selectedFreqLevel === 'sintaksis' ? 'Sintaksis' : 'Semantik'} ({activeFreqArticles.length} dokumen terhubung).</>
                )}
              </p>
            ) : (
              <p className="text-[10px] text-rose-500 font-semibold leading-relaxed">
                {selectedFreqDocIds.length === 0 ? (
                  <>Silakan pilih setidaknya satu dokumen di atas untuk melihat frekuensi.</>
                ) : (
                  <>Dokumen yang dipilih tidak memiliki tautan spreadsheet {selectedFreqLevel}. Analisis frekuensi dikosongkan.</>
                )}
              </p>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-slate-700 block">Hilangkan Kata Tugas</label>
                <span className="text-[10px] text-slate-400 block">Abaikan kata hubung, preposisi & partikel umum</span>
              </div>
              <input
                type="checkbox"
                checked={freqRemoveStopwords}
                onChange={(e) => setFreqRemoveStopwords(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-5 w-5 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-slate-700 block">Satukan Harakat</label>
                <span className="text-[10px] text-slate-400 block">Abaikan perbedaan tasykil untuk hasil rata</span>
              </div>
              <input
                type="checkbox"
                checked={freqIgnoreHarakat}
                onChange={(e) => setFreqIgnoreHarakat(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-5 w-5 cursor-pointer"
              />
            </div>

          </div>

          {/* Word Filter Input */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600 block">Cari Kata Suku:</label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                value={freqSearchFilter}
                onChange={(e) => setFreqSearchFilter(e.target.value)}
                placeholder="Ketik kata spesifik..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-left font-sans text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 bg-white text-slate-900"
              />
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl text-[10px] text-slate-500 leading-relaxed border border-slate-100">
            <strong>Informasi Linguistik:</strong> Penyelarasan dengan spreadsheet {selectedFreqLevel !== 'general' ? selectedFreqLevel : 'morfologi/sintaksis/semantik'} memastikan Anda hanya menganalisis kosakata yang telah divalidasi dalam lembar kerja kolaboratif.
          </div>
        </div>

        {/* Frequency Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800">
                Daftar Frekuensi Kata {selectedFreqLevel !== 'general' ? `(Selaras ${selectedFreqLevel === 'morfologi' ? 'Morfologi' : selectedFreqLevel === 'sintaksis' ? 'Sintaksis' : 'Semantik'})` : 'Otomatis'}
              </span>
              <span className="text-[10px] bg-teal-50 text-teal-800 px-2.5 py-1 rounded-md font-semibold">
                Total {mainFrequencyList.length} Entri Kata
              </span>
            </div>

            {mainDisplayedFrequencyList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/10">
                      <th className="py-3 px-6 text-center w-16">Peringkat</th>
                      <th className="py-3 px-6 text-left font-sans">Kata</th>
                      <th className="py-3 px-6 text-center">Frekuensi</th>
                      <th className="py-3 px-6 text-center">Persentase</th>
                      <th className="py-3 px-6 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainDisplayedFrequencyList.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-6 text-center">
                          <span className="text-xs font-bold text-slate-400">#{item.rank}</span>
                        </td>
                        <td dir="ltr" className="py-3.5 px-6 text-left font-sans font-bold text-slate-900 text-sm">
                          {item.word}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span className="text-xs font-bold text-slate-700">{item.count} kali</span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span className="text-xs text-slate-500 font-mono">{item.percentage.toFixed(3)}%</span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <button
                            onClick={() => {
                              setKwicQuery(item.word);
                              setKwicExact(true);
                              handleKwicSearch();
                              setKorpusSubTab('pencarian');
                            }}
                            className="text-[10px] text-teal-600 hover:text-teal-800 hover:underline font-bold cursor-pointer"
                          >
                            Cari Konteks
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <HelpCircle className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-slate-700 mb-1">Tidak Ada Data</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {selectedFreqLevel === 'general'
                    ? 'Tidak ada kata yang sesuai dengan filter pencarian Anda.'
                    : `Tidak ada data frekuensi kata yang selaras karena tidak ada dokumen atau spreadsheet ${selectedFreqLevel === 'morfologi' ? 'Morfologi' : selectedFreqLevel === 'sintaksis' ? 'Sintaksis' : 'Semantik'} yang terhubung.`}
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {mainTotalFreqPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
              <button
                disabled={localFreqPage === 1}
                onClick={() => setLocalFreqPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold disabled:opacity-50 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="text-slate-500">Halaman <strong>{localFreqPage}</strong> dari <strong>{mainTotalFreqPages}</strong></span>
              <button
                disabled={localFreqPage === mainTotalFreqPages}
                onClick={() => setLocalFreqPage(prev => Math.min(mainTotalFreqPages, prev + 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold disabled:opacity-50 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          )}

        </div>

      </div>

      {/* GRAPHIC OVERVIEW CARD (SVG Word Frequency Bar Chart) */}
      {mainFrequencyList.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fade-in">
          <h3 className="text-base font-bold text-slate-900 mb-4">Grafik Distribusi Frekuensi (Top 10 Kosakata Terbanyak)</h3>
          
          <div className="h-64 flex items-end justify-between gap-2 pt-6 px-4 border-b border-slate-200">
            {mainFrequencyList.slice(0, 10).map((item, index) => {
              const highestCount = mainFrequencyList[0].count;
              const colHeight = (item.count / highestCount) * 80; // scale max to 80%
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative">
                  {/* Floating Count Hover Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-10">
                    {item.count} kali
                  </div>

                  {/* Bar Graphic */}
                  <div 
                    className="w-full bg-teal-600/90 hover:bg-teal-600 rounded-t transition-all duration-700 ease-out shadow-xs"
                    style={{ height: `${colHeight}%` }}
                  ></div>

                  {/* Word label at bottom */}
                  <div className="mt-3 text-center w-full">
                    <span dir="ltr" className="block font-sans font-bold text-xs sm:text-sm text-slate-800 tracking-wide truncate max-w-xs">
                      {item.word}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">#{index + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
