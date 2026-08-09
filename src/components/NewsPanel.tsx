import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowRight, 
  Pencil, 
  Search, 
  Clock,
  Share2,
  Bookmark,
  BookMarked,
  Newspaper,
  ChevronRight,
  ChevronLeft,
  User,
  Check,
  Flame,
  Tag,
  X,
  Megaphone,
  Radio,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Article, Genre } from '../types';
import GenreManagerModal from './corpus/GenreManagerModal';

interface NewsPanelProps {
  articles: Article[];
  hasWriteAccess: boolean;
  genres: Genre[];
  onAddGenre?: (name: string) => Promise<void>;
  onDeleteGenre?: (id: string) => Promise<void>;
  selectedArticleId: string | null;
  setSelectedArticleId: (val: string | null) => void;
  setCurrentTab: (tab: 'beranda' | 'berita' | 'korpus' | 'galeri' | 'tentang' | 'login' | 'pengguna') => void;
  setKorpusSubTab?: (subTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah') => void;
  showAddNews: boolean;
  setShowAddNews: (val: boolean) => void;
  formError: string;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newAuthor: string;
  setNewAuthor: (val: string) => void;
  newCategory: string;
  setNewCategory: (val: string) => void;
  newImage: string;
  setNewImage: (val: string) => void;
  newSummary: string;
  setNewSummary: (val: string) => void;
  newContent: string;
  setNewContent: (val: string) => void;
  handleAddArticle: (e: React.FormEvent) => void;
  deletingArticleId: string | null;
  setDeletingArticleId: (val: string | null) => void;
  confirmDeleteArticle: (id: string) => void;
  handleDeleteArticle: (id: string, e: React.MouseEvent) => void;
  setEditingArticle: (art: Article | null) => void;
}

export default function NewsPanel({
  articles,
  hasWriteAccess,
  genres,
  onAddGenre,
  onDeleteGenre,
  selectedArticleId,
  setSelectedArticleId,
  setCurrentTab,
  showAddNews,
  setShowAddNews,
  formError,
  newTitle,
  setNewTitle,
  newAuthor,
  setNewAuthor,
  newCategory,
  setNewCategory,
  newImage,
  setNewImage,
  newSummary,
  setNewSummary,
  newContent,
  setNewContent,
  handleAddArticle,
  deletingArticleId,
  setDeletingArticleId,
  confirmDeleteArticle,
  handleDeleteArticle,
  setEditingArticle
}: NewsPanelProps) {
  
  // Local states for filtering and portal UI
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  // Category manager state
  const [showGenreManager, setShowGenreManager] = useState(false);
  const [genreError, setGenreError] = useState('');
  const [newGenreName, setNewGenreName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran berkas gambar terlalu besar. Maksimal 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Category horizontal scroll ref
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const currentReadingArticle = articles.find(a => a.id === selectedArticleId);

  // Calculate estimated read time in minutes
  const getReadTime = (text: string) => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    return `${minutes} mnt baca`;
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered articles list
  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === 'Semua' || art.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Featured Headline Article (First matching or latest)
  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  // Secondary List Articles
  const remainingArticles = filteredArticles.length > 0 ? filteredArticles.slice(1) : [];

  // Popular news list (simulated top read articles)
  const popularArticles = articles.slice(0, 4);

  // Get category article count
  const getCategoryCount = (catName: string) => {
    if (catName === 'Semua') return articles.length;
    return articles.filter(a => a.category.toLowerCase() === catName.toLowerCase()).length;
  };

  // Only display categories that contain at least 1 article in public filter views
  const activeGenres = genres.filter(g => getCategoryCount(g.name) > 0);

  // Auto-reset category selection if the active category becomes empty
  React.useEffect(() => {
    if (selectedCategory !== 'Semua' && getCategoryCount(selectedCategory) === 0) {
      setSelectedCategory('Semua');
    }
  }, [articles, selectedCategory]);

  return (
    <div className="space-y-6 animate-fade-in" id="panel-berita">
      {selectedArticleId && currentReadingArticle ? (
        /* DETAILED ACTIVE READING VIEWER - STANDARD HIGH-ELEGANCE NEWS ARTICLE FORMAT */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm space-y-8" id="reading-pane">
          
          {/* Breadcrumbs & Navigation Action Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <button 
                onClick={() => {
                  setSelectedArticleId(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-[#056a3e] transition-colors cursor-pointer"
              >
                Beranda
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <button 
                onClick={() => {
                  setSelectedArticleId(null);
                  setSelectedCategory('Semua');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-[#056a3e] transition-colors cursor-pointer"
              >
                Portal Berita
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[#056a3e] font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/80">
                {currentReadingArticle.category}
              </span>
            </nav>

            <button
              onClick={() => {
                setSelectedArticleId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              <ArrowRight className="w-4 h-4 rotate-180 text-[#056a3e]" />
              <span>Kembali ke Daftar Berita</span>
            </button>
          </div>

          {/* Article Header (Symmetric News Headline Layout) */}
          <div className="space-y-5 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3.5 py-1 bg-[#056a3e] text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-2xs">
                {currentReadingArticle.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <Calendar className="w-3.5 h-3.5 text-[#056a3e]" />
                <span>{currentReadingArticle.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <Clock className="w-3.5 h-3.5 text-[#056a3e]" />
                <span>{getReadTime(currentReadingArticle.content)}</span>
              </div>
            </div>

            {/* Headline Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {currentReadingArticle.title}
            </h1>

            {/* Lead Summary Callout */}
            {currentReadingArticle.summary && (
              <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed border-l-4 border-[#056a3e] pl-4 py-2 bg-gradient-to-r from-emerald-50/60 to-transparent rounded-r-2xl">
                {currentReadingArticle.summary}
              </p>
            )}

            {/* Author & Symmetric Action Bar */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-b border-slate-100 py-3.5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#056a3e] to-teal-700 text-white font-bold text-sm flex items-center justify-center shadow-2xs border-2 border-white">
                  {currentReadingArticle.author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#056a3e]" />
                    <span>{currentReadingArticle.author}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Penulis / Redaksi ArabNet</span>
                </div>
              </div>

              {/* Share, Edit & Bookmark Actions */}
              <div className="flex items-center gap-2">
                {hasWriteAccess && (
                  <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2 mr-1">
                    <button
                      onClick={() => setEditingArticle(currentReadingArticle)}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-200/80 shadow-3xs"
                      title="Ubah Berita Ini"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-700" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteArticle(currentReadingArticle.id, e)}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-red-200/80 shadow-3xs"
                      title="Hapus Berita Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                  title="Bagikan Tautan Artikel"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{copiedLink ? 'Disalin!' : 'Bagikan'}</span>
                </button>
                <button
                  onClick={(e) => toggleBookmark(currentReadingArticle.id, e)}
                  className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-3xs ${
                    bookmarked[currentReadingArticle.id] 
                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Simpan Artikel"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 max-w-5xl mx-auto">
            
            {/* Article Body & Media Column */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Featured Photo Cover */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md aspect-[16/9] group">
                {currentReadingArticle.image ? (
                  <img
                    src={currentReadingArticle.image}
                    alt={currentReadingArticle.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 flex flex-col items-center justify-center text-white/80 p-6 text-center space-y-2">
                    <BookMarked className="w-12 h-12 text-emerald-400" />
                    <span className="text-[10px] font-mono tracking-widest uppercase">ArabNet Corpus - Publikasi Resmi</span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xs text-slate-300 text-xs px-4 py-2.5 border-t border-slate-800 flex items-center justify-between z-10 font-medium">
                  <span className="truncate pr-2">Sampul Utama: {currentReadingArticle.title}</span>
                  <span className="font-bold text-emerald-400 shrink-0">ArabNet Media</span>
                </div>
              </div>

              {/* Main Content Body Card */}
              <div 
                className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 md:p-10 shadow-3xs space-y-6 text-slate-800"
              >
                {currentReadingArticle.content
                  .split(/\n+/)
                  .map(p => p.trim())
                  .filter(Boolean)
                  .map((paragraph, pIdx) => (
                    <p 
                      key={pIdx} 
                      className={`leading-relaxed text-slate-800 text-left text-base md:text-[17px] font-normal tracking-normal ${
                        pIdx === 0 ? 'text-slate-900 font-medium text-lg leading-relaxed' : ''
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>

              {/* Tag Footer & Social Action Bar */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-[#056a3e]" />
                  <span className="text-xs text-slate-500 font-bold">Kata Kunci:</span>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-3xs">ArabNet</span>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-[#056a3e] rounded-xl text-xs font-semibold shadow-3xs">{currentReadingArticle.category}</span>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-3xs">Berita & Informasi</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedArticleId(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs flex items-center gap-2 self-stretch sm:self-auto justify-center"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Kembali ke Berita</span>
                </button>
              </div>
            </div>

            {/* Sidebar Inspector & Related Articles */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Related Articles Widget */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-4 sticky top-6">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                  <Newspaper className="w-4 h-4 text-[#056a3e]" />
                  <h4 className="text-sm font-bold text-slate-900">Berita Terkait Lainnya</h4>
                </div>

                <div className="space-y-3">
                  {articles.filter(a => a.id !== currentReadingArticle.id).slice(0, 5).map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => {
                        setSelectedArticleId(rel.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group flex gap-3 cursor-pointer p-2.5 rounded-xl bg-white hover:bg-emerald-50/50 transition-all border border-slate-200/70 hover:border-emerald-300 shadow-3xs"
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                        {rel.image ? (
                          <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">
                            ARABNET
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#056a3e] uppercase truncate">{rel.category}</span>
                        <h5 className="text-xs font-bold text-slate-800 group-hover:text-[#056a3e] line-clamp-2 transition-colors leading-snug">
                          {rel.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-medium">{rel.date}</span>
                      </div>
                    </div>
                  ))}
                  {articles.filter(a => a.id !== currentReadingArticle.id).length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                      Belum ada berita terkait lainnya.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* STANDARD NEWS PORTAL MAIN LAYOUT (TAMPILAN PORTAL BERITA PADA UMUMNYA) */
        <div className="space-y-8">
          
          {/* PORTAL HEADER & SEARCH BAR */}
          <div className="bg-gradient-to-r from-emerald-900 via-[#056a3e] to-teal-900 rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>Portal Berita & Kabar Korpus</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Kabar & Publikasi ArabNet Corpus
                </h2>
                <p className="text-xs text-emerald-100/90 leading-relaxed font-normal">
                  Sajian berita terbaru, riset linguistik, artikel ilmiah, dan kabar pembaruan sistem.
                </p>
              </div>

              {/* Action Buttons */}
              {hasWriteAccess && (
                <button
                  onClick={() => setShowAddNews(!showAddNews)}
                  className="px-4 py-2.5 bg-white text-[#056a3e] hover:bg-emerald-50 rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all shrink-0 active:scale-98 self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddNews ? 'Batal Tambah Berita' : 'Tulis Berita Baru'}</span>
                </button>
              )}
            </div>

            {/* Live Search Input inside Portal Header */}
            <div className="relative z-10 mt-5 pt-4 border-t border-white/15">
              <div className="relative w-full flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berita berdasarkan judul, penulis, atau kata kunci..."
                    className="w-full px-4 py-2 bg-white text-slate-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-300 shadow-inner font-medium placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 bg-slate-100 p-1 rounded-full transition-colors"
                      title="Reset Pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {}}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cari</span>
                </button>
              </div>
            </div>
          </div>

          {/* CATEGORY FILTER TABS (HORIZONTAL SLIDE MENU) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-2xs relative">
            <div className="flex items-center gap-2">
              {/* Slide Left Button */}
              <button
                onClick={() => scrollCategories('left')}
                className="p-2 bg-slate-100 hover:bg-[#056a3e] hover:text-white text-slate-600 rounded-xl transition-all cursor-pointer shrink-0 shadow-3xs"
                title="Geser Kategori ke Kiri"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Horizontal Scroll Track */}
              <div 
                ref={categoryScrollRef}
                className="flex items-center gap-2 overflow-x-auto scroll-smooth scrollbar-none py-1 px-0.5 flex-1"
              >
                <button
                  onClick={() => setSelectedCategory('Semua')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === 'Semua'
                      ? 'bg-[#056a3e] text-white shadow-xs scale-102'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>Semua</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'Semua' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {getCategoryCount('Semua')}
                  </span>
                </button>

                {activeGenres.map((g) => {
                  const count = getCategoryCount(g.name);
                  const isSelected = selectedCategory.toLowerCase() === g.name.toLowerCase();
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedCategory(g.name)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#056a3e] text-white shadow-xs scale-102'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      <span>{g.name}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Slide Right Button */}
              <button
                onClick={() => scrollCategories('right')}
                className="p-2 bg-slate-100 hover:bg-[#056a3e] hover:text-white text-slate-600 rounded-xl transition-all cursor-pointer shrink-0 shadow-3xs"
                title="Geser Kategori ke Kanan"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Admin Manage Categories Button */}
              {hasWriteAccess && onAddGenre && onDeleteGenre && (
                <button
                  onClick={() => setShowGenreManager(true)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#056a3e] rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border border-emerald-200 flex items-center gap-1.5 shadow-3xs ml-1"
                  title="Kelola Kategori Berita"
                >
                  <Tag className="w-3.5 h-3.5 text-[#056a3e]" />
                  <span className="hidden sm:inline">Kelola Kategori</span>
                </button>
              )}
            </div>
          </div>

          {/* ADMIN ADD NEWS FORM MODAL / PANEL */}
          {hasWriteAccess && showAddNews && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm animate-fade-in border-l-4 border-l-[#056a3e]">
              <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-[#056a3e] flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Formulir Tulis & Publikasikan Berita Baru</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Tulis artikel atau kabar berita terbaru untuk ditampilkan di portal publik ArabNet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddNews(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  Tutup
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddArticle} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Judul Berita Utama *</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Contoh: Peluncuran Fitur Analisis Linguistik ArabNet 2026"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Penulis Berita *</label>
                    <input
                      type="text"
                      required
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="Contoh: Dr. Ahmad Hasyim"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Kategori Berita *</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                    >
                      {genres.map((g) => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rich Image Upload Component with PC 16:9 and HP 4:3 Aspect Ratio Preview */}
                <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-[#056a3e]" />
                        <span>Unggah Foto Sampul Berita</span>
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Pilih berkas dari perangkat (komputer/HP), atau tempelkan URL gambar eksternal.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-[#056a3e] bg-emerald-100/70 px-2.5 py-1 rounded-md font-bold self-start sm:self-auto">
                      Rasio: PC 16:9 | HP 4:3
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 items-center">
                    <div className="md:col-span-7 space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="flex-1 px-4 py-2.5 bg-white border border-slate-300 hover:border-[#056a3e] rounded-xl text-xs font-bold text-slate-700 hover:text-[#056a3e] cursor-pointer transition-all flex items-center justify-center gap-2 shadow-3xs group">
                          <Upload className="w-4 h-4 text-[#056a3e] group-hover:scale-110 transition-transform" />
                          <span>Pilih Berkas Gambar dari Perangkat</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <div className="h-px bg-slate-200 flex-1" />
                        <span>Atau Tempel Tautan URL Gambar</span>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>

                      <input
                        type="url"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        placeholder="Contoh: https://images.unsplash.com/photo-..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                      />

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-semibold text-slate-400">Contoh Sampul:</span>
                        {[
                          { label: 'Kaligrafi Naskh', url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1000&q=80' },
                          { label: 'Kubah Masjid', url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1000&q=80' },
                          { label: 'Naskah Kuno', url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1000&q=80' }
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setNewImage(preset.url)}
                            className="text-[10px] bg-slate-200/70 hover:bg-[#056a3e] hover:text-white px-2 py-0.5 rounded-md transition-colors cursor-pointer text-slate-700 font-medium"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-5">
                      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-3xs flex items-center justify-center text-center group">
                        {newImage ? (
                          <>
                            <img
                              src={newImage}
                              alt="Pratinjau Sampul"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setNewImage('')}
                              className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                              title="Hapus Sampul"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="p-4 text-slate-400 flex flex-col items-center justify-center space-y-1">
                            <BookMarked className="w-8 h-8 text-emerald-500/60" />
                            <span className="text-[11px] font-bold text-slate-300">Pratinjau Foto Sampul</span>
                            <span className="text-[9px] text-slate-500">Pratinjau 16:9 (PC) & 4:3 (HP)</span>
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-2 px-2 py-0.5 bg-slate-950/70 text-emerald-400 text-[9px] font-mono rounded">
                          {newImage ? 'Pratinjau Sampul' : 'Belum Ada Gambar'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Ringkasan Berita (Opsional)</label>
                  <input
                    type="text"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Opsional: Tulis ringkasan jika diperlukan..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Isi Lengkap Berita *</label>
                  <textarea
                    required
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Tulis narasi berita lengkap di sini..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNews(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publikasikan Berita</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* HEADLINE HERO ARTICLE (BERITA UTAMA) */}
          {featuredArticle && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#056a3e] uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Berita Utama (Headline)</span>
              </div>

              <div 
                onClick={() => {
                  setSelectedArticleId(featuredArticle.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white border border-slate-200 hover:border-[#056a3e]/40 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer group grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Hero Image Section */}
                <div className="lg:col-span-7 relative aspect-[4/3] md:aspect-[16/9] bg-slate-900 overflow-hidden">
                  {featuredArticle.image ? (
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-slate-950 flex flex-col items-center justify-center text-white/60 p-6">
                      <BookMarked className="w-16 h-16 text-emerald-400 mb-2" />
                      <span className="text-xs font-mono">ArabNet Headline</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent lg:hidden"></div>
                  <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-[#056a3e] text-white rounded-xl text-xs font-bold shadow-md z-10">
                    {featuredArticle.category}
                  </span>

                  {/* Admin Edit & Delete Overlay for Headline Article */}
                  {hasWriteAccess && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs p-1 rounded-xl shadow-md">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingArticle(featuredArticle);
                        }}
                        className="p-1.5 text-slate-200 hover:text-white hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
                        title="Ubah Berita Utama"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteArticle(featuredArticle.id, e)}
                        className="p-1.5 text-slate-200 hover:text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Berita Utama"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {deletingArticleId === featuredArticle.id && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-white text-center space-y-3 animate-fade-in">
                      <Trash2 className="w-8 h-8 text-red-400" />
                      <p className="text-xs font-bold">Hapus Berita Utama Ini?</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteArticle(featuredArticle.id);
                          }}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingArticleId(null);
                          }}
                          className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hero Content Section */}
                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{featuredArticle.date}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{getReadTime(featuredArticle.content)}</span>
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-[#056a3e] transition-colors leading-snug">
                      {featuredArticle.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {featuredArticle.summary && featuredArticle.summary.trim()
                        ? featuredArticle.summary.trim()
                        : featuredArticle.content.replace(/\s+/g, ' ').trim()}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#056a3e] text-white text-[11px] font-bold flex items-center justify-center">
                        {featuredArticle.author.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{featuredArticle.author}</span>
                    </div>

                    <span className="text-xs font-bold text-[#056a3e] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MAIN NEWS STREAM & SIDEBAR GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT STREAM: MORE NEWS CARDS */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-[#056a3e]" />
                  <span>Daftar Artikel & Berita Terbaru</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  Menampilkan {remainingArticles.length + (featuredArticle ? 1 : 0)} Berita
                </span>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <Search className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">Tidak Ada Berita Ditemukan</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Coba ubah kata kunci pencarian atau pilih kategori berita lain.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {remainingArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        setSelectedArticleId(art.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white border border-slate-200/80 hover:border-[#056a3e]/40 rounded-2xl overflow-hidden shadow-3xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group relative"
                    >
                      {/* Delete Overlay */}
                      {deletingArticleId === art.id && (
                        <div 
                          className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-8 h-8 text-rose-500 mb-2 animate-bounce" />
                          <h4 className="text-xs font-bold text-white mb-1">Hapus Berita Ini?</h4>
                          <div className="flex items-center gap-2 w-full mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteArticle(art.id);
                              }}
                              className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingArticleId(null);
                              }}
                              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        {/* Article Image Thumbnail */}
                        <div className="relative aspect-[4/3] md:aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                          {art.image ? (
                            <img
                              src={art.image}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-teal-900 to-emerald-950 flex flex-col items-center justify-center text-white/50">
                              <BookMarked className="w-8 h-8 text-emerald-400 mb-1" />
                              <span className="text-[10px] font-mono uppercase">ArabNet News</span>
                            </div>
                          )}
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#056a3e] text-white rounded-lg text-[10px] font-bold shadow-xs z-10">
                            {art.category}
                          </span>
                        </div>

                        {/* Body Details */}
                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{art.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{getReadTime(art.content)}</span>
                            </div>
                          </div>

                          <h4 className="text-base font-bold text-slate-900 group-hover:text-[#056a3e] transition-colors line-clamp-2 leading-snug">
                            {art.title}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {art.summary && art.summary.trim()
                              ? art.summary.trim()
                              : art.content.replace(/\s+/g, ' ').trim()}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[130px]">
                          Oleh: {art.author}
                        </span>

                        <div className="flex items-center gap-2">
                          {hasWriteAccess && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingArticle(art);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Ubah Berita"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteArticle(art.id, e)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Hapus Berita"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <span className="text-xs font-bold text-[#056a3e] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>Baca Selengkapnya</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: PORTAL POPULAR & QUICK STATS */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* TERPOPULER / TRENDING WIDGET */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-3xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h4 className="text-sm font-bold text-slate-900">Berita Terpopuler</h4>
                </div>

                <div className="space-y-3">
                  {popularArticles.map((pop, idx) => (
                    <div
                      key={pop.id}
                      onClick={() => {
                        setSelectedArticleId(pop.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100"
                    >
                      <span className="text-xl font-black text-slate-300 group-hover:text-[#056a3e] w-6 shrink-0 transition-colors">
                        #{idx + 1}
                      </span>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#056a3e] uppercase">{pop.category}</span>
                        <h5 className="text-xs font-bold text-slate-800 group-hover:text-[#056a3e] line-clamp-2 leading-snug transition-colors">
                          {pop.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-medium block">{pop.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KATEGORI KORPUS WIDGET */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-3xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#056a3e]" />
                    <h4 className="text-sm font-bold text-slate-900">Kategori Berita</h4>
                  </div>
                  {hasWriteAccess && onAddGenre && onDeleteGenre && (
                    <button
                      onClick={() => setShowGenreManager(true)}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-[#056a3e] rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Kelola Kategori Berita"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Kelola</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {activeGenres.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setSelectedCategory(g.name)}
                      className="flex items-center justify-between p-2.5 bg-white hover:bg-emerald-50/60 border border-slate-200/70 rounded-xl cursor-pointer text-xs transition-all group"
                    >
                      <span className="font-semibold text-slate-700 group-hover:text-[#056a3e]">{g.name}</span>
                      <span className="px-2 py-0.5 bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-[#056a3e] rounded-full text-[10px] font-bold">
                        {getCategoryCount(g.name)} artikel
                      </span>
                    </div>
                  ))}
                  {activeGenres.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                      Belum ada kategori dengan artikel.
                    </div>
                  )}
                </div>
              </div>

              {/* INFO ARABNET NEWS PORTAL BANNER */}
              <div className="bg-gradient-to-br from-[#056a3e] to-teal-900 rounded-3xl p-5 text-white shadow-3xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  <Megaphone className="w-4 h-4" />
                  <span>Portal Informasi & Acara</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-100/90 font-normal">
                  Dapatkan kabar terbaru mengenai seminar, lokakarya, tutorial penggunaan sistem, serta pengumuman penting seputar ArabNet.
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-200 border-t border-white/10 font-medium">
                  <span>Redaksi Berita ArabNet</span>
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Genre & Category Management Modal for Admins */}
      {hasWriteAccess && onAddGenre && onDeleteGenre && (
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
      )}
    </div>
  );
}
