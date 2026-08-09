import React, { useState } from 'react';
import { Lock, Plus, CheckCircle2, Upload, FileText, Image as ImageIcon, X, Link2, FileSpreadsheet, BookMarked, AlignLeft, Sparkles, FolderPlus } from 'lucide-react';
import mammoth from 'mammoth';
import { Genre } from '../../types';

interface TambahDokumenProps {
  hasWriteAccess: boolean;
  isLoggedIn: boolean;
  userRole: 'Peneliti' | 'Peserta' | 'Admin';
  setCurrentTab: (tab: 'beranda' | 'berita' | 'korpus' | 'galeri' | 'tentang' | 'login' | 'pengguna') => void;
  formError: string;
  formSuccess: boolean;
  newDocumentUrl: string;
  setNewDocumentUrl: (val: string) => void;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newAuthor: string;
  setNewAuthor: (val: string) => void;
  newCategory: string;
  setNewCategory: (val: string) => void;
  genres: Genre[];
  setShowGenreManager: (show: boolean) => void;
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
  newContent?: string;
  setNewContent?: (val: string) => void;
  handleAddArticle: (e: React.FormEvent) => void;
}

export default function TambahDokumen({
  hasWriteAccess,
  isLoggedIn,
  userRole,
  setCurrentTab,
  formError,
  formSuccess,
  newDocumentUrl,
  setNewDocumentUrl,
  newTitle,
  setNewTitle,
  newAuthor,
  setNewAuthor,
  newCategory,
  setNewCategory,
  genres,
  setShowGenreManager,
  newSpreadsheetUrl,
  setNewSpreadsheetUrl,
  newSourceUrl = '',
  setNewSourceUrl,
  newMorfologiUrl,
  setNewMorfologiUrl,
  newSintaksisUrl,
  setNewSintaksisUrl,
  newSemantikUrl,
  setNewSemantikUrl,
  newContent = '',
  setNewContent,
  handleAddArticle
}: TambahDokumenProps) {
  const [localFileName, setLocalFileName] = useState<string>('');
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);

  const handleDocumentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("Ukuran berkas terlalu besar. Maksimal 20MB.");
        return;
      }
      setLocalFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDocumentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Extract raw text for corpus analytics automatically
      if (file.name.toLowerCase().endsWith('.docx')) {
        try {
          setIsExtractingText(true);
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (result.value && result.value.trim() && setNewContent) {
            setNewContent(result.value.trim());
          }
        } catch (err) {
          console.warn("Docx extraction warning:", err);
        } finally {
          setIsExtractingText(false);
        }
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.type.startsWith('text/')) {
        const textReader = new FileReader();
        textReader.onload = (evt) => {
          const text = (evt.target?.result as string) || '';
          if (text.trim() && setNewContent) {
            setNewContent(text.trim());
          }
        };
        textReader.readAsText(file, 'UTF-8');
      } else if (file.name.toLowerCase().endsWith('.doc')) {
        const docReader = new FileReader();
        docReader.onload = (evt) => {
          const result = evt.target?.result;
          if (result instanceof ArrayBuffer) {
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const text = decoder.decode(result);
            const cleaned = text
              .replace(/<[^>]+>/g, ' ')
              .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s.,!?-]/g, ' ')
              .replace(/\s+/g, ' ');
            if (cleaned.trim() && setNewContent) {
              setNewContent(cleaned.trim());
            }
          }
        };
        docReader.readAsArrayBuffer(file);
      }
    }
  };

  return (
    <div className="space-y-5 animate-fade-in" id="subpanel-tambah">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs">
        {!hasWriteAccess ? (
          <div className="text-center py-12 flex flex-col items-center justify-center max-w-lg mx-auto space-y-3">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-3xs">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Akses Terbatas: Mode Baca-Saja</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isLoggedIn && userRole === 'Peserta'
                ? 'Anda masuk sebagai Peserta. Sesuai hak akses, Peserta hanya dapat mengeksplorasi data tanpa mengubah atau menambah dokumen.'
                : 'Anda masuk sebagai Tamu. Silakan masuk menggunakan akun Admin untuk menambah dokumen korpus baru.'}
            </p>
            <button
              onClick={() => setCurrentTab('login')}
              className="px-4 py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer transition-all"
            >
              {isLoggedIn ? 'Ganti Akun (Login Admin)' : 'Masuk sebagai Admin'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Form Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-50 text-[#056a3e] rounded-xl border border-emerald-100 shadow-3xs">
                  <FolderPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Tambah Dokumen Korpus Baru
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Isi data dokumen korpus di bawah ini. Sistem akan langsung memperbarui analitika korpus.
                  </p>
                </div>
              </div>
              
              <span className="px-3 py-1 bg-emerald-50 text-[#056a3e] border border-emerald-200/80 rounded-xl text-xs font-bold self-start sm:self-auto shrink-0 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mode Admin</span>
              </span>
            </div>

            {/* Error & Success Messages */}
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium flex items-center gap-2">
                <X className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dokumen korpus berhasil disimpan dan ditambahkan!</span>
              </div>
            )}

            <form onSubmit={handleAddArticle} className="space-y-5">
              
              {/* SECTION 1: DOKUMEN & BERKAS UTAMA */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#056a3e]" />
                    <span>1. Berkas Utama Dokumen / PDF <span className="text-red-500">*</span></span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">PDF, Word (.docx), atau Gambar</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8 space-y-2.5">
                    
                    {/* File Upload Button */}
                    <label className="w-full px-3.5 py-2.5 bg-white border border-slate-300 hover:border-[#056a3e] rounded-xl text-xs font-bold text-slate-700 hover:text-[#056a3e] cursor-pointer transition-all flex items-center justify-center gap-2 shadow-3xs group">
                      <Upload className="w-4 h-4 text-[#056a3e] group-hover:scale-110 transition-transform" />
                      <span>Pilih Berkas dari Komputer / HP</span>
                      <input
                        type="file"
                        accept="application/pdf,image/*,.doc,.docx"
                        onChange={handleDocumentFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span>Atau Tempel Tautan URL / Google Drive</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    {/* URL Input & Extract Button */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required={!newDocumentUrl}
                        value={newDocumentUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewDocumentUrl(val);
                          setLocalFileName('');
                        }}
                        placeholder="Contoh: https://docs.google.com/document/d/..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/20"
                      />
                      {newDocumentUrl && (newDocumentUrl.includes('document') || newDocumentUrl.includes('drive') || newDocumentUrl.startsWith('http')) && setNewContent && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setIsExtractingText(true);
                              const res = await fetch('/api/parse-doc-text', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ url: newDocumentUrl })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.text && data.text.trim()) {
                                  setNewContent(data.text.trim());
                                  alert('Teks berhasil diekstrak dari tautan dokumen!');
                                }
                              }
                            } catch (e) {
                              console.warn('Failed to parse doc text:', e);
                            } finally {
                              setIsExtractingText(false);
                            }
                          }}
                          className="shrink-0 px-3 py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Ekstrak teks bahasa Arab dari tautan dokumen"
                        >
                          Ekstrak Teks
                        </button>
                      )}
                    </div>

                  </div>

                  {/* File Status Box */}
                  <div className="md:col-span-4">
                    <div className="p-3 bg-slate-900 text-white rounded-xl text-center flex flex-col items-center justify-center min-h-[90px] border border-slate-800">
                      {newDocumentUrl ? (
                        newDocumentUrl.startsWith('data:image') ? (
                          <div className="relative w-full h-16 rounded overflow-hidden">
                            <img src={newDocumentUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => { setNewDocumentUrl(''); setLocalFileName(''); }}
                              className="absolute top-1 right-1 p-0.5 bg-slate-900/80 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <FileText className="w-6 h-6 text-emerald-400 mx-auto animate-pulse" />
                            <span className="text-xs font-bold text-white block truncate max-w-[150px]">
                              {localFileName || 'Dokumen Terhubung'}
                            </span>
                            <button
                              type="button"
                              onClick={() => { setNewDocumentUrl(''); setLocalFileName(''); }}
                              className="text-[10px] text-red-400 hover:underline font-semibold"
                            >
                              Hapus Berkas
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="text-slate-400 space-y-1">
                          <FileText className="w-6 h-6 text-slate-600 mx-auto" />
                          <span className="text-xs font-medium block">Belum ada berkas</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: INFORMASI UTAMA DOKUMEN */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <BookMarked className="w-4 h-4 text-[#056a3e]" />
                  <span>2. Informasi Informasi Dokumen Korpus</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Judul Dokumen */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Judul Dokumen <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Contoh: An-Nahwu al-Wadhih"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/20"
                    />
                  </div>

                  {/* Penulis / Peneliti */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Penulis / Peneliti <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="Contoh: Ali al-Jarim"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/20"
                    />
                  </div>

                  {/* Genre / Kategori */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Genre / Kategori <span className="text-red-500">*</span>
                      </label>
                      {hasWriteAccess && (
                        <button
                          type="button"
                          onClick={() => setShowGenreManager(true)}
                          className="text-[11px] text-[#056a3e] hover:underline font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Genre</span>
                        </button>
                      )}
                    </div>
                    <select
                      required
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#056a3e] cursor-pointer"
                    >
                      <option value="">-- Pilih Genre --</option>
                      {genres.map((g) => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* SECTION 3: TAUTAN NASKAH & WEB */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Link2 className="w-4 h-4 text-[#056a3e]" />
                  <span>3. Tautan Naskah Word & Sumber Berita (Opsional)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Tautan Berkas Word (.docx / Google Docs)
                    </label>
                    <input
                      type="url"
                      value={newSpreadsheetUrl}
                      onChange={(e) => setNewSpreadsheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Tautan Sumber Berita Asli (URL Web)
                    </label>
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl && setNewSourceUrl(e.target.value)}
                      placeholder="https://www.aljazeera.net/..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: SPREADSHEET ANALISIS LINGUISTIK */}
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#056a3e] flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>4. Tautan Spreadsheet Analisis Linguistik (Opsional)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Spreadsheet Morfologi</label>
                    <input
                      type="url"
                      value={newMorfologiUrl}
                      onChange={(e) => setNewMorfologiUrl(e.target.value)}
                      placeholder="URL Morfologi..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Spreadsheet Sintaksis</label>
                    <input
                      type="url"
                      value={newSintaksisUrl}
                      onChange={(e) => setNewSintaksisUrl(e.target.value)}
                      placeholder="URL Sintaksis..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Spreadsheet Semantik</label>
                    <input
                      type="url"
                      value={newSemantikUrl}
                      onChange={(e) => setNewSemantikUrl(e.target.value)}
                      placeholder="URL Semantik..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: TEKS NASKAH UNTUK ANALISIS */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlignLeft className="w-4 h-4 text-[#056a3e]" />
                    <span>5. Teks Naskah Dokumen (Untuk Indeksasi Analitika Korpus)</span>
                  </h4>
                  {isExtractingText && (
                    <span className="text-[11px] font-bold text-[#056a3e] animate-pulse">
                      Mengekstrak Teks...
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent && setNewContent(e.target.value)}
                  placeholder="Tempelkan atau ketik isi teks bahasa Arab dokumen di sini untuk dihitung frekuensi kata, KWIC, dan N-Gram..."
                  dir="rtl"
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-sans leading-relaxed outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/20"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  Teks ini digunakan untuk memproses pencarian KWIC, frekuensi kata, dan analisis N-Gram.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl font-bold text-xs shadow-3xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Dokumen Ke Korpus</span>
                </button>
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
