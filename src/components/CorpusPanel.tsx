import React from 'react';
import { 
  FileText, 
  Search, 
  BarChart3, 
  Layers, 
  TrendingUp, 
  Plus
} from 'lucide-react';
import { Article, Genre } from '../types';

// Import newly refactored subcomponents
import DaftarDokumen from './corpus/DaftarDokumen';
import ConcordanceKwic from './corpus/ConcordanceKwic';
import FrekuensiKata from './corpus/FrekuensiKata';
import NgramAnalysis from './corpus/NgramAnalysis';
import CollocationRelational from './corpus/CollocationRelational';
import TambahDokumen from './corpus/TambahDokumen';
import SpreadsheetModal from './corpus/SpreadsheetModal';
import GenreManagerModal from './corpus/GenreManagerModal';

interface CorpusPanelProps {
  articles: Article[];
  corpusDocs: Article[];
  hasWriteAccess: boolean;
  isLoggedIn: boolean;
  userRole: 'Peneliti' | 'Peserta' | 'Admin';
  genres: Genre[];
  onAddGenre: (name: string) => Promise<void>;
  onDeleteGenre: (id: string) => Promise<void>;
  selectedArticleId: string | null;
  setSelectedArticleId: (val: string | null) => void;
  currentTab: string;
  setCurrentTab: (tab: 'beranda' | 'berita' | 'korpus' | 'galeri' | 'tentang' | 'login' | 'pengguna') => void;
  korpusSubTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah';
  setKorpusSubTab: (subTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah') => void;
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
  kwicResults: any[];
  clickedWord: any;
  setClickedWord: (val: any) => void;
  freqRemoveStopwords: boolean;
  setFreqRemoveStopwords: (val: boolean) => void;
  freqIgnoreHarakat: boolean;
  setFreqIgnoreHarakat: (val: boolean) => void;
  freqSearchFilter: string;
  setFreqSearchFilter: (val: string) => void;
  ngramN: number;
  setNgramN: (val: number) => void;
  ngramRemoveStopwords: boolean;
  setNgramRemoveStopwords: (val: boolean) => void;
  ngramList: any[];
  collocationQuery: string;
  setCollocationQuery: (val: string) => void;
  collocationWindowSize: number;
  setCollocationWindowSize: (val: number) => void;
  handleCollocationSearch: () => void;
  hasSearchedCollocation: boolean;
  collocationResults: any[];
  formError: string;
  formSuccess: boolean;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newAuthor: string;
  setNewAuthor: (val: string) => void;
  newCategory: string;
  setNewCategory: (val: string) => void;
  newDocumentUrl: string;
  setNewDocumentUrl: (val: string) => void;
  newSpreadsheetUrl: string;
  setNewSpreadsheetUrl: (val: string) => void;
  newSourceUrl?: string;
  setNewSourceUrl?: (val: string) => void;
  newMorfologiUrl: string;
  setNewMorfologiUrl: (val: string) => void;
  newSintaksisUrl: string;
  setNewSintaksisUrl: (val: string) => void;
  newSemantikUrl: string;
  setNewSemantikUrl: (val: string) => void;
  handleAddArticle: (e: React.FormEvent) => void;
  handleDeleteArticle: (id: string, e: React.MouseEvent) => void;
  onUpdateArticle: (art: Article) => void;

  // Optional and extra props passed from App.tsx that can be safely ignored or forwarded
  freqPage?: number;
  setFreqPage?: (val: number) => void;
  frequencyList?: any[];
  displayedFrequencyList?: any[];
  totalFreqPages?: number;
  setEditingArticle?: (val: Article | null) => void;
  newImage?: string;
  setNewImage?: (val: string) => void;
  newSummary?: string;
  setNewSummary?: (val: string) => void;
  newContent?: string;
  setNewContent?: (val: string) => void;
}

export default function CorpusPanel({
  articles = [],
  corpusDocs,
  hasWriteAccess,
  isLoggedIn,
  userRole,
  genres,
  onAddGenre,
  onDeleteGenre,
  setSelectedArticleId,
  setCurrentTab,
  korpusSubTab,
  setKorpusSubTab,
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
  freqRemoveStopwords,
  setFreqRemoveStopwords,
  freqIgnoreHarakat,
  setFreqIgnoreHarakat,
  freqSearchFilter,
  setFreqSearchFilter,
  ngramN,
  setNgramN,
  ngramRemoveStopwords,
  setNgramRemoveStopwords,
  ngramList,
  collocationQuery,
  setCollocationQuery,
  collocationWindowSize,
  setCollocationWindowSize,
  handleCollocationSearch,
  hasSearchedCollocation,
  collocationResults,
  formError,
  formSuccess,
  newTitle,
  setNewTitle,
  newAuthor,
  setNewAuthor,
  newCategory,
  setNewCategory,
  newDocumentUrl,
  setNewDocumentUrl,
  newSpreadsheetUrl,
  setNewSpreadsheetUrl,
  newSourceUrl = '',
  setNewSourceUrl = (() => {}),
  newMorfologiUrl,
  setNewMorfologiUrl,
  newSintaksisUrl,
  setNewSintaksisUrl,
  newSemantikUrl,
  setNewSemantikUrl,
  newContent,
  setNewContent,
  handleAddArticle,
  handleDeleteArticle,
  onUpdateArticle,
  setEditingArticle,
  setClickedWord
}: CorpusPanelProps) {

  // Corpus search and filter states
  const [corpusSearchQuery, setCorpusSearchQuery] = React.useState('');
  const [corpusGenreFilter, setCorpusGenreFilter] = React.useState('');

  const filteredArticles = React.useMemo(() => {
    return corpusDocs.filter((art) => {
      const matchesSearch = !corpusSearchQuery.trim() ||
        art.title.toLowerCase().includes(corpusSearchQuery.toLowerCase().trim()) ||
        art.author.toLowerCase().includes(corpusSearchQuery.toLowerCase().trim());
      
      const matchesGenre = !corpusGenreFilter || art.category === corpusGenreFilter;
      
      return matchesSearch && matchesGenre;
    });
  }, [corpusDocs, corpusSearchQuery, corpusGenreFilter]);

  const handleWordClickLocal = (rawWord: string) => {
    if (setClickedWord) {
      setClickedWord({
        word: rawWord,
        translation: '',
        pos: '',
        definition: ''
      });
    }
  };

  // Spreadsheet modal and dynamic tab state managers
  const [activeSpreadsheetArticle, setActiveSpreadsheetArticle] = React.useState<Article | null>(null);
  const [spreadsheetTab, setSpreadsheetTab] = React.useState<'analisis' | 'morfologi' | 'sintaksis' | 'semantik' | 'google-sheet'>('analisis');
  const [kwicHighlightQuery, setKwicHighlightQuery] = React.useState<string>('');

  const handleViewKwicDocument = (articleId: string, keyword: string) => {
    const doc = corpusDocs.find(d => d.id === articleId) || articles.find(a => a.id === articleId);
    if (doc) {
      setActiveSpreadsheetArticle(doc);
      setSpreadsheetTab('google-sheet');
      setKwicHighlightQuery(keyword);
    }
  };

  // Genre management form states
  const [showGenreManager, setShowGenreManager] = React.useState(false);
  const [newGenreName, setNewGenreName] = React.useState('');
  const [genreError, setGenreError] = React.useState('');

  // Selected document list for the frequency analysis tab
  const [selectedFreqDocIds, setSelectedFreqDocIds] = React.useState<string[]>([]);
  const hasInitializedFreqRef = React.useRef(false);

  // Selected document list for N-Gram analysis tab
  const [selectedNgramDocIds, setSelectedNgramDocIds] = React.useState<string[]>([]);
  const hasInitializedNgramRef = React.useRef(false);

  // Parse cache for Google spreadsheets data to avoid redundant network requests
  const [corpusSheetsCache, setCorpusSheetsCache] = React.useState<Record<string, string[][]>>({});

  // Auto initialize selected documents for word frequency and ngram tab on load
  React.useEffect(() => {
    if (corpusDocs.length > 0 && !hasInitializedFreqRef.current) {
      setSelectedFreqDocIds(corpusDocs.map(d => d.id));
      hasInitializedFreqRef.current = true;
    }
    if (corpusDocs.length > 0 && !hasInitializedNgramRef.current) {
      setSelectedNgramDocIds(corpusDocs.map(d => d.id));
      hasInitializedNgramRef.current = true;
    }
  }, [corpusDocs]);

  // Block non-admins from accessing upload tabs
  React.useEffect(() => {
    if (korpusSubTab === 'tambah' && !hasWriteAccess) {
      setKorpusSubTab('daftar');
    }
  }, [korpusSubTab, hasWriteAccess, setKorpusSubTab]);

  // Background fetch spreadsheet arrays for all corpus documents to load stats and KWIC mappings
  React.useEffect(() => {
    const docsToFetch = [...corpusDocs];
    const levels: ('morfologi' | 'sintaksis' | 'semantik')[] = ['morfologi', 'sintaksis', 'semantik'];

    docsToFetch.forEach(doc => {
      levels.forEach(level => {
        let currentUrl = '';
        if (level === 'morfologi') currentUrl = doc.morfologiUrl || '';
        else if (level === 'sintaksis') currentUrl = doc.sintaksisUrl || '';
        else if (level === 'semantik') currentUrl = doc.semantikUrl || '';

        if (!currentUrl) return;

        const match = currentUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match || !match[1]) return;
        const spreadsheetId = match[1];

        const cacheKey = `${doc.id}-${level}`;
        if (corpusSheetsCache[cacheKey]) return;

        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

        fetch(csvUrl)
          .then(res => {
            if (!res.ok) throw new Error('Network error');
            return res.text();
          })
          .then(text => {
            // Standard parseCSVHelper function
            const parseCSVLocal = (textStr: string): string[][] => {
              const lines: string[][] = [];
              let row: string[] = [];
              let inQuotes = false;
              let currentVal = '';
              
              for (let i = 0; i < textStr.length; i++) {
                const char = textStr[i];
                const nextChar = textStr[i + 1];
                
                if (char === '"') {
                  if (inQuotes && nextChar === '"') {
                    currentVal += '"';
                    i++; // skip next quote
                  } else {
                    inQuotes = !inQuotes;
                  }
                } else if (char === ',' && !inQuotes) {
                  row.push(currentVal.trim());
                  currentVal = '';
                } else if ((char === '\r' || char === '\n') && !inQuotes) {
                  if (char === '\r' && nextChar === '\n') {
                    i++; // skip \n
                  }
                  row.push(currentVal.trim());
                  lines.push(row);
                  row = [];
                  currentVal = '';
                } else {
                  currentVal += char;
                }
              }
              if (row.length > 0 || currentVal !== '') {
                row.push(currentVal.trim());
                lines.push(row);
              }
              return lines.filter(r => r.some(cell => cell.trim() !== ''));
            };

            const parsed = parseCSVLocal(text);
            setCorpusSheetsCache(prev => {
              if (prev[cacheKey]) return prev;
              return {
                ...prev,
                [cacheKey]: parsed
              };
            });
          })
          .catch(() => {
            // Silently swallow network warnings and fallback gracefully
          });
      });
    });
  }, [corpusDocs, corpusSheetsCache]);

  return (
    <div className="space-y-6 animate-fade-in" id="panel-korpus">
      
      {/* CORPUS METHOD NAVIGATION SUB-TAB BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'daftar', label: 'Daftar Dokumen', icon: FileText },
          { id: 'pencarian', label: 'Concordance (KWIC)', icon: Search },
          { id: 'frekuensi', label: 'Frekuensi Kata', icon: BarChart3 },
          { id: 'ngram', label: 'Analisis N-Gram', icon: Layers },
          { id: 'kolokasi', label: 'Kolokasi Relasional', icon: TrendingUp },
          ...(hasWriteAccess ? [{ id: 'tambah', label: 'Tambah Dokumen', icon: Plus }] : []),
        ].map((sub) => (
          <button
            key={sub.id}
            id={`subnav-${sub.id}`}
            onClick={() => setKorpusSubTab(sub.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              korpusSubTab === sub.id
                ? 'bg-[#056a3e] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <sub.icon className="w-3.5 h-3.5" />
            <span>{sub.label}</span>
          </button>
        ))}
      </div>

      {/* RENDER THE ACTIVE SUB-PANEL */}
      {korpusSubTab === 'daftar' && (
        <DaftarDokumen
          filteredArticles={filteredArticles}
          corpusDocs={corpusDocs}
          corpusSearchQuery={corpusSearchQuery}
          setCorpusSearchQuery={setCorpusSearchQuery}
          corpusGenreFilter={corpusGenreFilter}
          setCorpusGenreFilter={setCorpusGenreFilter}
          genres={genres}
          selectedFreqDocIds={selectedFreqDocIds}
          setSelectedFreqDocIds={setSelectedFreqDocIds}
          selectedNgramDocIds={selectedNgramDocIds}
          setSelectedNgramDocIds={setSelectedNgramDocIds}
          setKorpusSubTab={setKorpusSubTab}
          hasWriteAccess={hasWriteAccess}
          onUpdateArticle={onUpdateArticle}
          setActiveSpreadsheetArticle={setActiveSpreadsheetArticle}
          setSpreadsheetTab={setSpreadsheetTab}
          setEditingArticle={setEditingArticle || (() => {})}
          handleDeleteArticle={handleDeleteArticle}
        />
      )}

      {korpusSubTab === 'pencarian' && (
        <ConcordanceKwic
          kwicQuery={kwicQuery}
          setKwicQuery={setKwicQuery}
          kwicWindowSize={kwicWindowSize}
          setKwicWindowSize={setKwicWindowSize}
          kwicIgnoreHarakat={kwicIgnoreHarakat}
          setKwicIgnoreHarakat={setKwicIgnoreHarakat}
          kwicExact={kwicExact}
          setKwicExact={setKwicExact}
          handleKwicSearch={handleKwicSearch}
          hasSearchedKwic={hasSearchedKwic}
          kwicResults={kwicResults}
          setSelectedArticleId={setSelectedArticleId}
          handleWordClick={handleWordClickLocal}
          setCurrentTab={setCurrentTab}
          onViewDocument={handleViewKwicDocument}
        />
      )}

      {korpusSubTab === 'frekuensi' && (
        <FrekuensiKata
          corpusDocs={corpusDocs}
          corpusSheetsCache={corpusSheetsCache}
          selectedFreqDocIds={selectedFreqDocIds}
          setSelectedFreqDocIds={setSelectedFreqDocIds}
          freqRemoveStopwords={freqRemoveStopwords}
          setFreqRemoveStopwords={setFreqRemoveStopwords}
          freqIgnoreHarakat={freqIgnoreHarakat}
          setFreqIgnoreHarakat={setFreqIgnoreHarakat}
          freqSearchFilter={freqSearchFilter}
          setFreqSearchFilter={setFreqSearchFilter}
          setKwicQuery={setKwicQuery}
          setKwicExact={setKwicExact}
          handleKwicSearch={handleKwicSearch}
          setKorpusSubTab={setKorpusSubTab}
        />
      )}

      {korpusSubTab === 'ngram' && (
        <NgramAnalysis
          corpusDocs={corpusDocs}
          articles={articles}
          ngramN={ngramN}
          setNgramN={setNgramN}
          ngramRemoveStopwords={ngramRemoveStopwords}
          setNgramRemoveStopwords={setNgramRemoveStopwords}
          selectedNgramDocIds={selectedNgramDocIds}
          setSelectedNgramDocIds={setSelectedNgramDocIds}
          ngramList={ngramList}
          setKwicQuery={setKwicQuery}
          setKwicExact={setKwicExact}
          handleKwicSearch={handleKwicSearch}
          setKorpusSubTab={setKorpusSubTab}
          onViewDocument={handleViewKwicDocument}
        />
      )}

      {korpusSubTab === 'kolokasi' && (
        <CollocationRelational
          collocationQuery={collocationQuery}
          setCollocationQuery={setCollocationQuery}
          collocationWindowSize={collocationWindowSize}
          setCollocationWindowSize={setCollocationWindowSize}
          handleCollocationSearch={handleCollocationSearch}
          hasSearchedCollocation={hasSearchedCollocation}
          collocationResults={collocationResults}
          setKwicQuery={setKwicQuery}
          setKwicExact={setKwicExact}
          handleKwicSearch={handleKwicSearch}
          setKorpusSubTab={setKorpusSubTab}
        />
      )}

      {korpusSubTab === 'tambah' && (
        <TambahDokumen
          hasWriteAccess={hasWriteAccess}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          setCurrentTab={setCurrentTab}
          formError={formError}
          formSuccess={formSuccess}
          newDocumentUrl={newDocumentUrl}
          setNewDocumentUrl={setNewDocumentUrl}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newAuthor={newAuthor}
          setNewAuthor={setNewAuthor}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          genres={genres}
          setShowGenreManager={setShowGenreManager}
          newSpreadsheetUrl={newSpreadsheetUrl}
          setNewSpreadsheetUrl={setNewSpreadsheetUrl}
          newSourceUrl={newSourceUrl}
          setNewSourceUrl={setNewSourceUrl}
          newMorfologiUrl={newMorfologiUrl}
          setNewMorfologiUrl={setNewMorfologiUrl}
          newSintaksisUrl={newSintaksisUrl}
          setNewSintaksisUrl={setNewSintaksisUrl}
          newSemantikUrl={newSemantikUrl}
          setNewSemantikUrl={setNewSemantikUrl}
          newContent={newContent}
          setNewContent={setNewContent}
          handleAddArticle={handleAddArticle}
        />
      )}

      {/* SPREADSHEET & ANALYTICS MODAL SYSTEM */}
      {activeSpreadsheetArticle && (
        <SpreadsheetModal
          activeSpreadsheetArticle={activeSpreadsheetArticle}
          setActiveSpreadsheetArticle={setActiveSpreadsheetArticle}
          spreadsheetTab={spreadsheetTab}
          setSpreadsheetTab={setSpreadsheetTab}
          hasWriteAccess={hasWriteAccess}
          onUpdateArticle={onUpdateArticle}
          corpusSheetsCache={corpusSheetsCache}
          corpusDocs={corpusDocs}
          articles={articles}
          initialHighlightQuery={kwicHighlightQuery}
        />
      )}

      {/* KELOLA GENRE MODAL SYSTEM */}
      <GenreManagerModal
        showGenreManager={showGenreManager}
        setShowGenreManager={setShowGenreManager}
        genreError={genreError}
        setGenreError={setGenreError}
        newGenreName={newGenreName}
        setNewGenreName={setNewGenreName}
        genres={genres}
        onAddGenre={onAddGenre}
        onDeleteGenre={onDeleteGenre}
      />

    </div>
  );
}
