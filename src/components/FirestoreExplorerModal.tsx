import React, { useState } from 'react';
import { 
  Database, 
  X, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Folder, 
  FileText, 
  Plus, 
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  Table,
  Link as LinkIcon,
  Download
} from 'lucide-react';
import { Article, CorpusUser, Genre } from '../types';
import { GalleryItem, saveCorpusDocToFirestore, saveArticleToFirestore, saveGenreToFirestore, saveUserToFirestore, saveGalleryToFirestore } from '../services/firebase';

interface FirestoreExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  corpusDocs: Article[];
  galleryItems: GalleryItem[];
  genres: Genre[];
  users: CorpusUser[];
  onSeed: () => Promise<{ count: number; error?: string }>;
}

export default function FirestoreExplorerModal({
  isOpen,
  onClose,
  articles,
  corpusDocs,
  galleryItems,
  genres,
  users,
  onSeed
}: FirestoreExplorerModalProps) {
  const [activeCollection, setActiveCollection] = useState<'corpus_docs' | 'articles' | 'gallery' | 'genres' | 'users'>('corpus_docs');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Manual Add Document state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addContent, setAddContent] = useState('');
  const [addAuthor, setAddAuthor] = useState('');
  const [addCategory, setAddCategory] = useState('');
  const [addSpreadsheetUrl, setAddSpreadsheetUrl] = useState('');
  const [addMorfologiUrl, setAddMorfologiUrl] = useState('');
  const [addSintaksisUrl, setAddSintaksisUrl] = useState('');
  const [addSemantikUrl, setAddSemantikUrl] = useState('');
  const [addDocumentUrl, setAddDocumentUrl] = useState('');
  const [addIsSubmitting, setAddIsSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);

  // Spreadsheet Link Importer State
  const [importSpreadsheetUrl, setImportSpreadsheetUrl] = useState('');
  const [importIsLoading, setImportIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const collections = [
    { id: 'corpus_docs', name: 'corpus_docs', label: 'Dokumen Korpus', count: corpusDocs.length, icon: FileText, desc: 'Teks arab & corpus analisis' },
    { id: 'articles', name: 'articles', label: 'Artikel Berita', count: articles.length, icon: Layers, desc: 'Kabar kampus & rilis publikasi' },
    { id: 'gallery', name: 'gallery', label: 'Galeri', count: galleryItems.length, icon: Folder, desc: 'Gambar & seni kaligrafi' },
    { id: 'genres', name: 'genres', label: 'Genre Korpus', count: genres.length, icon: Sparkles, desc: 'Kategori linguistik' },
    { id: 'users', name: 'users', label: 'Pengguna', count: users.length, icon: ShieldCheck, desc: 'Role admin, peneliti & peserta' }
  ] as const;

  const handleSyncClick = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await onSeed();
      if (res.error) {
        setSyncResult({ success: false, message: res.error });
      } else {
        setSyncResult({
          success: true,
          message: `Berhasil membuat & menyinkronkan ${res.count} data dokumen ke 5 koleksi Firestore!`
        });
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err?.message || 'Gagal menyinkronkan data.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim()) {
      setAddMessage('Judul dokumen wajib diisi.');
      return;
    }

    setAddIsSubmitting(true);
    setAddMessage(null);

    try {
      const docId = `manual_${Date.now()}`;
      const contentText = addContent.trim() || addTitle.trim();
      
      if (activeCollection === 'corpus_docs') {
        const newDoc: Article = {
          id: docId,
          title: addTitle.trim(),
          content: contentText,
          author: addAuthor.trim() || 'Admin Firestore',
          category: addCategory.trim() || 'Umum',
          date: new Date().toISOString().split('T')[0],
          wordCount: contentText.split(/\s+/).filter(Boolean).length,
          summary: contentText.slice(0, 100) + '...',
          spreadsheetUrl: addSpreadsheetUrl.trim(),
          morfologiUrl: addMorfologiUrl.trim(),
          sintaksisUrl: addSintaksisUrl.trim(),
          semantikUrl: addSemantikUrl.trim(),
          documentUrl: addDocumentUrl.trim()
        };
        await saveCorpusDocToFirestore(newDoc);
      } else if (activeCollection === 'articles') {
        const newArt: Article = {
          id: docId,
          title: addTitle.trim(),
          content: contentText,
          author: addAuthor.trim() || 'Redaksi',
          category: addCategory.trim() || 'Berita Utama',
          date: new Date().toISOString().split('T')[0],
          wordCount: contentText.split(/\s+/).filter(Boolean).length,
          summary: contentText.slice(0, 100) + '...',
          spreadsheetUrl: addSpreadsheetUrl.trim(),
          morfologiUrl: addMorfologiUrl.trim(),
          sintaksisUrl: addSintaksisUrl.trim(),
          semantikUrl: addSemantikUrl.trim(),
          documentUrl: addDocumentUrl.trim()
        };
        await saveArticleToFirestore(newArt);
      } else if (activeCollection === 'genres') {
        const id = addTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        await saveGenreToFirestore({ id, name: addTitle.trim() });
      } else if (activeCollection === 'users') {
        const email = addTitle.trim();
        await saveUserToFirestore({
          id: email,
          name: addAuthor.trim() || 'Pengguna Baru',
          email,
          role: (addCategory as any) || 'Peserta',
          joinedDate: new Date().toISOString().split('T')[0]
        });
      } else if (activeCollection === 'gallery') {
        await saveGalleryToFirestore({
          id: Date.now(),
          title: addTitle.trim(),
          desc: contentText,
          image: ''
        });
      }

      setAddMessage('Dokumen & link spreadsheet berhasil disimpan secara langsung ke Firestore!');
      setAddTitle('');
      setAddContent('');
      setAddAuthor('');
      setAddCategory('');
      setAddSpreadsheetUrl('');
      setAddMorfologiUrl('');
      setAddSintaksisUrl('');
      setAddSemantikUrl('');
      setAddDocumentUrl('');
      setShowAddForm(false);
    } catch (err: any) {
      setAddMessage(`Gagal menyimpan: ${err.message || 'Error'}`);
    } finally {
      setAddIsSubmitting(false);
    }
  };

  // Helper to import rows from a Google Spreadsheet URL
  const handleImportFromSpreadsheetUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = importSpreadsheetUrl.trim();
    if (!rawUrl) {
      setImportStatus({ success: false, message: 'Masukkan tautan Google Spreadsheet terlebih dahulu.' });
      return;
    }

    setImportIsLoading(true);
    setImportStatus(null);

    try {
      // Extract sheet ID and gid
      const match = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('URL Google Spreadsheet tidak valid. Contoh format: https://docs.google.com/spreadsheets/d/.../edit');
      }
      const sheetId = match[1];
      const gidMatch = rawUrl.match(/[?&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';

      const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      let csvText = '';
      try {
        const response = await fetch(csvExportUrl);
        if (response.ok) {
          csvText = await response.text();
        }
      } catch (fErr) {
        console.warn('Direct fetch CSV failed, falling back to creating document entry with spreadsheet link:', fErr);
      }

      if (csvText && csvText.trim()) {
        // Parse simple CSV rows
        const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const rowStr = lines[i];
          const columns = rowStr.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (columns.length > 0 && columns[0]) {
            const title = columns[0] || `Dokumen Spreadsheet ${i}`;
            const author = columns[1] || 'Impor Spreadsheet';
            const category = columns[2] || 'Koran / Berita';
            const content = columns[3] || title;

            const newDoc: Article = {
              id: `sheet_imp_${Date.now()}_${i}`,
              title,
              author,
              category,
              date: new Date().toISOString().split('T')[0],
              wordCount: content.split(/\s+/).filter(Boolean).length,
              content,
              summary: content.slice(0, 100) + '...',
              spreadsheetUrl: rawUrl
            };
            await saveCorpusDocToFirestore(newDoc);
            importedCount++;
          }
        }

        if (importedCount > 0) {
          setImportStatus({
            success: true,
            message: `Berhasil mengimpor ${importedCount} baris data dokumen dari Google Spreadsheet langsung ke Firestore!`
          });
          setImportSpreadsheetUrl('');
          return;
        }
      }

      // If CSV could not be parsed or spreadsheet has default structure, save 1 corpus document entry pointing to this spreadsheet URL
      const singleDoc: Article = {
        id: `sheet_${Date.now()}`,
        title: `Pangkalan Data Spreadsheet ${new Date().toLocaleDateString('id-ID')}`,
        author: 'Administrator Korpus',
        category: 'Analisis Spreadsheet',
        date: new Date().toISOString().split('T')[0],
        wordCount: 100,
        content: `Tautan Pangkalan Data Google Spreadsheet Corpus: ${rawUrl}`,
        summary: `Tautan pangkalan data Google Spreadsheet terdaftar secara resmi di Firestore.`,
        spreadsheetUrl: rawUrl
      };
      await saveCorpusDocToFirestore(singleDoc);

      setImportStatus({
        success: true,
        message: 'Tautan Google Spreadsheet berhasil terdaftar & tersimpan di pangkalan data Firestore!'
      });
      setImportSpreadsheetUrl('');
    } catch (err: any) {
      setImportStatus({ success: false, message: err?.message || 'Gagal memproses link Google Spreadsheet.' });
    } finally {
      setImportIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/20 border border-teal-500/30 rounded-2xl text-teal-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Koleksi Data Firebase Firestore</h3>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                  Online Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Project ID: <code className="text-teal-300 font-mono">natural-pointer-l3bk6</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          
          {/* Explanation Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mengapa Koleksi Belum Terlihat di Firebase Console?</span>
            </div>
            <p className="leading-relaxed opacity-90">
              Di <b>Firebase Console → Firestore Database</b>, nama koleksi (seperti <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">corpus_docs</code>, <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">articles</code>, dll) <b>HANYA AKAN MUNCUL</b> setelah ada minimal 1 dokumen yang berhasil dikirim/ditulis ke database tersebut.
            </p>
            <p className="leading-relaxed opacity-90">
              Klik tombol di bawah ini untuk mengirim seluruh data ke Firestore project Anda sehingga koleksinya langsung terbuat di Firebase Console!
            </p>
          </div>

          {/* Direct Sync / Seed Button */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-bold text-slate-900 text-sm block">1-Click Auto Seed / Inisialisasi Koleksi</span>
              <span className="text-xs text-slate-500 block">
                Kirim data bawaan dokumen, artikel, galeri, genre, dan pengguna langsung ke Firebase.
              </span>
            </div>
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-6 py-3 bg-[#056a3e] hover:bg-[#045431] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengirim Data ke Firestore...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Push Semua Data ke Firestore</span>
                </>
              )}
            </button>
          </div>

          {/* Sync Result Feedback */}
          {syncResult && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-fade-in ${
              syncResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm">
                <p className="font-bold">{syncResult.success ? 'Berhasil Diinjeksi!' : 'Gagal'}</p>
                <p className="mt-0.5">{syncResult.message}</p>
                {syncResult.success && (
                  <p className="mt-2 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 p-2 rounded-xl">
                    🎉 Silakan buka tab <b>Firebase Console → Firestore Database → Data</b>. Koleksi <code>corpus_docs</code>, <code>articles</code>, <code>gallery</code>, <code>genres</code>, dan <code>users</code> sekarang sudah aktif dan dapat dilihat secara langsung!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Collection Selector Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Pilih Koleksi Firestore untuk Dilihat / Ditambah
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-teal-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'Tutup Form' : 'Tambah Dokumen Manual'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {collections.map((col) => {
                const Icon = col.icon;
                const isSelected = activeCollection === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => {
                      setActiveCollection(col.id as any);
                      setShowAddForm(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {col.count}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold block truncate">{col.name}</span>
                      <span className={`text-[10px] block truncate ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        {col.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Manual Add */}
          {showAddForm && (
            <form onSubmit={handleManualAddDoc} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tambah Dokumen Baru ke Koleksi <code className="text-teal-700">{activeCollection}</code>
                </h4>
              </div>

              {addMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium ${addMessage.includes('berhasil') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {addMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    {activeCollection === 'users' ? 'Email Pengguna' : activeCollection === 'genres' ? 'Nama Genre' : 'Judul Dokumen'}
                  </label>
                  <input
                    type="text"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder={activeCollection === 'users' ? 'contoh: nama@domain.com' : 'Masukkan judul/nama...'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    {activeCollection === 'users' ? 'Nama Lengkap' : activeCollection === 'genres' ? 'ID Genre (Opsional)' : 'Penulis / Sumber'}
                  </label>
                  <input
                    type="text"
                    value={addAuthor}
                    onChange={(e) => setAddAuthor(e.target.value)}
                    placeholder="Masukkan penulis atau nama..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e]"
                  />
                </div>
              </div>

              {activeCollection !== 'genres' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    {activeCollection === 'users' ? 'Role (Peserta / Peneliti / Admin)' : 'Kategori / Genre'}
                  </label>
                  <input
                    type="text"
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    placeholder="Contoh: Agama, Sejarah, Berita Kampus, Peserta..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e]"
                  />
                </div>
              )}

              {activeCollection !== 'genres' && activeCollection !== 'users' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Isi Dokumen / Teks Bahasa Arab</label>
                    <textarea
                      rows={3}
                      value={addContent}
                      onChange={(e) => setAddContent(e.target.value)}
                      placeholder="Tulis atau tempelkan teks Arab di sini..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] dir-rtl font-arabic-amiri"
                    />
                  </div>

                  {/* Spreadsheet & PDF Links */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Table className="w-4 h-4 text-emerald-700" />
                      <span>Link Google Spreadsheet & Dokumen (Disimpan ke Firestore)</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Tautan Spreadsheet Data (Google Sheets / Excel Web URL)</label>
                      <input
                        type="url"
                        value={addSpreadsheetUrl}
                        onChange={(e) => setAddSpreadsheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-600 font-mono text-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Morfologi Sheet URL</label>
                        <input
                          type="url"
                          value={addMorfologiUrl}
                          onChange={(e) => setAddMorfologiUrl(e.target.value)}
                          placeholder="Spreadsheet Morfologi..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-emerald-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Sintaksis Sheet URL</label>
                        <input
                          type="url"
                          value={addSintaksisUrl}
                          onChange={(e) => setAddSintaksisUrl(e.target.value)}
                          placeholder="Spreadsheet Sintaksis..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-emerald-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Semantik Sheet URL</label>
                        <input
                          type="url"
                          value={addSemantikUrl}
                          onChange={(e) => setAddSemantikUrl(e.target.value)}
                          placeholder="Spreadsheet Semantik..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-emerald-600 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Tautan Dokument PDF (Google Drive / Eksternal URL)</label>
                      <input
                        type="url"
                        value={addDocumentUrl}
                        onChange={(e) => setAddDocumentUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-600 font-mono text-slate-700"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addIsSubmitting}
                  className="px-5 py-2 bg-[#056a3e] hover:bg-[#045431] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {addIsSubmitting ? 'Menyimpan...' : 'Simpan Langsung ke Firestore'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Import from Spreadsheet URL Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-5 border border-emerald-800 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Impor Data / Tautan Google Spreadsheet ke Firestore</h4>
                <p className="text-xs text-emerald-200/80">
                  Tempelkan link Google Spreadsheet corpus Anda di bawah untuk mendaftarkan dan menyinkronkan data langsung ke database Firestore.
                </p>
              </div>
            </div>

            {importStatus && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                importStatus.success ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200' : 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
              }`}>
                {importStatus.message}
              </div>
            )}

            <form onSubmit={handleImportFromSpreadsheetUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={importSpreadsheetUrl}
                onChange={(e) => setImportSpreadsheetUrl(e.target.value)}
                placeholder="Tempel link Google Spreadsheet (Contoh: https://docs.google.com/spreadsheets/d/...)"
                className="flex-1 px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-400 font-mono"
                required
              />
              <button
                type="submit"
                disabled={importIsLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {importIsLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tarik Data Spreadsheet ke Firestore</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Collection Data Preview List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Daftar Dokumen di Koleksi</span>
                <code className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                  {activeCollection}
                </code>
              </div>
              <span className="text-xs text-slate-500">
                Showing top items from real-time state
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {activeCollection === 'corpus_docs' && corpusDocs.map((doc, idx) => (
                <div key={doc.id || idx} className="p-3 hover:bg-slate-50 text-xs flex items-center justify-between">
                  <div className="space-y-0.5 max-w-xl">
                    <div className="font-bold text-slate-900">{doc.title}</div>
                    <div className="text-slate-500 truncate font-arabic-amiri text-sm dir-rtl">{doc.content}</div>
                  </div>
                  <span className="text-[10px] font-mono bg-teal-50 text-teal-800 px-2 py-1 rounded-md shrink-0">
                    ID: {String(doc.id)}
                  </span>
                </div>
              ))}

              {activeCollection === 'articles' && articles.map((art, idx) => (
                <div key={art.id || idx} className="p-3 hover:bg-slate-50 text-xs flex items-center justify-between">
                  <div className="space-y-0.5 max-w-xl">
                    <div className="font-bold text-slate-900">{art.title}</div>
                    <div className="text-slate-500">{art.category} • {art.date}</div>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-800 px-2 py-1 rounded-md shrink-0">
                    ID: {String(art.id)}
                  </span>
                </div>
              ))}

              {activeCollection === 'gallery' && galleryItems.map((gal, idx) => (
                <div key={gal.id || idx} className="p-3 hover:bg-slate-50 text-xs flex items-center justify-between">
                  <div className="space-y-0.5 max-w-xl">
                    <div className="font-bold text-slate-900">{gal.title}</div>
                    <div className="text-slate-500 truncate">{gal.desc}</div>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-50 text-purple-800 px-2 py-1 rounded-md shrink-0">
                    ID: {String(gal.id)}
                  </span>
                </div>
              ))}

              {activeCollection === 'genres' && genres.map((gen, idx) => (
                <div key={gen.id || idx} className="p-3 hover:bg-slate-50 text-xs flex items-center justify-between">
                  <div className="font-bold text-slate-900">{gen.name}</div>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md shrink-0">
                    ID: {String(gen.id)}
                  </span>
                </div>
              ))}

              {activeCollection === 'users' && users.map((u, idx) => (
                <div key={u.id || idx} className="p-3 hover:bg-slate-50 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{u.name} ({u.role})</div>
                    <div className="text-slate-500">{u.email}</div>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-2 py-1 rounded-md shrink-0">
                    ID: {String(u.id)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Terhubung ke Cloud Firestore Server API</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
