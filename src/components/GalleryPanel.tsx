import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, X, Upload, Image as ImageIcon, Pencil } from 'lucide-react';
import { GalleryItem } from '../services/firebase';

interface GalleryPanelProps {
  hasWriteAccess: boolean;
  galleryItems: GalleryItem[];
  showAddGallery: boolean;
  setShowAddGallery: (val: boolean) => void;
  galleryError: string;
  setGalleryError: (val: string) => void;
  newGalleryTitle: string;
  setNewGalleryTitle: (val: string) => void;
  newGalleryImage: string;
  setNewGalleryImage: (val: string) => void;
  newGalleryDesc: string;
  setNewGalleryDesc: (val: string) => void;
  handleAddGalleryItem: (e: React.FormEvent) => void;
  deletingGalleryId: number | null;
  setDeletingGalleryId: (val: number | null) => void;
  confirmDeleteGalleryItem: (id: number) => void;
  handleDeleteGalleryItem: (id: number, e: React.MouseEvent) => void;
  activeGalleryItem: number | null;
  setActiveGalleryItem: (val: number | null) => void;
  onUpdateGalleryItem?: (item: GalleryItem) => void;
}

export default function GalleryPanel({
  hasWriteAccess,
  galleryItems,
  showAddGallery,
  setShowAddGallery,
  galleryError,
  setGalleryError,
  newGalleryTitle,
  setNewGalleryTitle,
  newGalleryImage,
  setNewGalleryImage,
  newGalleryDesc,
  setNewGalleryDesc,
  handleAddGalleryItem,
  deletingGalleryId,
  setDeletingGalleryId,
  confirmDeleteGalleryItem,
  handleDeleteGalleryItem,
  activeGalleryItem,
  setActiveGalleryItem,
  onUpdateGalleryItem
}: GalleryPanelProps) {

  // State for Editing Gallery Item
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [editError, setEditError] = useState('');

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingGalleryItem) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran berkas gambar terlalu besar. Maksimal 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingGalleryItem({
          ...editingGalleryItem,
          image: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem) return;
    if (!editingGalleryItem.title.trim() || !editingGalleryItem.desc.trim() || !editingGalleryItem.image.trim()) {
      setEditError('Semua kolom bertanda bintang wajib diisi.');
      return;
    }

    if (onUpdateGalleryItem) {
      onUpdateGalleryItem(editingGalleryItem);
    }
    setEditingGalleryItem(null);
    setEditError('');
  };

  // Keyboard navigation for Lightbox
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran berkas gambar terlalu besar. Maksimal 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewGalleryImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (activeGalleryItem === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveGalleryItem(
          activeGalleryItem > 0 ? activeGalleryItem - 1 : galleryItems.length - 1
        );
      } else if (e.key === 'ArrowRight') {
        setActiveGalleryItem(
          activeGalleryItem < galleryItems.length - 1 ? activeGalleryItem + 1 : 0
        );
      } else if (e.key === 'Escape') {
        setActiveGalleryItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGalleryItem, galleryItems.length, setActiveGalleryItem]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeGalleryItem !== null && galleryItems.length > 0) {
      setActiveGalleryItem(
        activeGalleryItem > 0 ? activeGalleryItem - 1 : galleryItems.length - 1
      );
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeGalleryItem !== null && galleryItems.length > 0) {
      setActiveGalleryItem(
        activeGalleryItem < galleryItems.length - 1 ? activeGalleryItem + 1 : 0
      );
    }
  };
  return (
    <div className="space-y-8 animate-fade-in" id="panel-galeri">
      
      {/* Header / Add Button Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-4 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Galeri Riset & Media</h3>
          <p className="text-xs text-slate-500 mt-1">Eksplorasi grafis, visualisasi statistik, dan karya seni kaligrafi korpus.</p>
        </div>
        {hasWriteAccess && (
          <button
            onClick={() => {
              setGalleryError('');
              setShowAddGallery(!showAddGallery);
            }}
            className="px-4 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
          >
            {showAddGallery ? (
              <>Batal Tambah Gambar</>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Tambah Gambar Baru</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Admin Add Image Form (Only shown when showAddGallery is true) */}
      {hasWriteAccess && showAddGallery && (
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-2xs animate-fade-in mb-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h4 className="text-lg font-bold text-[#056a3e] flex items-center gap-1.5">
              <Plus className="w-5 h-5" />
              <span>Tambah Gambar Baru ke Galeri</span>
            </h4>
            <p className="text-xs text-slate-500 mt-1">Isi formulir di bawah ini untuk mengunggah karya seni kaligrafi atau bagan ke galeri publik.</p>
          </div>
          
          {galleryError && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
              {galleryError}
            </div>
          )}
          
          <form onSubmit={handleAddGalleryItem} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Judul Gambar / Karya *</label>
                <input
                  type="text"
                  required
                  value={newGalleryTitle}
                  onChange={(e) => setNewGalleryTitle(e.target.value)}
                  placeholder="Contoh: Mushaf Kuno Abad Pertengahan"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/15 transition-all text-slate-800 font-medium"
                />
              </div>
              
              {/* Rich Image Upload Component with PC 16:9 and HP 4:3 Aspect Ratio Preview */}
              <div className="space-y-2 md:col-span-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#056a3e]" />
                      <span>Unggah Gambar / Karya Galeri *</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Pilih berkas dari perangkat (komputer/HP), atau tempelkan URL gambar.
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
                      required={!newGalleryImage}
                      value={newGalleryImage}
                      onChange={(e) => setNewGalleryImage(e.target.value)}
                      placeholder="Contoh: https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium text-slate-800"
                    />

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-semibold text-slate-400">Contoh Karya:</span>
                      {[
                        { label: 'Kaligrafi Diwani', url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1000&q=80' },
                        { label: 'Bagan Bahasa', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1000&q=80' },
                        { label: 'Manusakrip Arab', url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1000&q=80' }
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setNewGalleryImage(preset.url)}
                          className="text-[10px] bg-slate-200/70 hover:bg-[#056a3e] hover:text-white px-2 py-0.5 rounded-md transition-colors cursor-pointer text-slate-700 font-medium"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-3xs flex items-center justify-center text-center group">
                      {newGalleryImage ? (
                        <>
                          <img
                            src={newGalleryImage}
                            alt="Pratinjau Galeri"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setNewGalleryImage('')}
                            className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                            title="Hapus Gambar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="p-4 text-slate-400 flex flex-col items-center justify-center space-y-1">
                          <ImageIcon className="w-8 h-8 text-emerald-500/60" />
                          <span className="text-[11px] font-bold text-slate-300">Pratinjau Gambar Galeri</span>
                          <span className="text-[9px] text-slate-500">Tampilan PC 16:9 & HP 4:3</span>
                        </div>
                      )}
                      <span className="absolute bottom-1.5 left-2 px-2 py-0.5 bg-slate-950/70 text-emerald-400 text-[9px] font-mono rounded">
                        {newGalleryImage ? 'Gambar Terpilih' : 'Belum Ada Gambar'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Keterangan / Deskripsi Gambar *</label>
                <textarea
                  required
                  rows={3}
                  value={newGalleryDesc}
                  onChange={(e) => setNewGalleryDesc(e.target.value)}
                  placeholder="Tulis penjelasan singkat mengenai gambar yang diunggah..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/15 transition-all text-slate-800 font-medium"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddGallery(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Gambar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item, index) => (
          <div 
            key={item.id}
            onClick={() => setActiveGalleryItem(index)}
            className="relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col h-full"
          >
            {/* Absolute confirmation overlay for deleting gallery item */}
            {deletingGalleryId === item.id && (
              <div 
                className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-10 h-10 text-red-500 mb-3 animate-bounce" />
                <h4 className="text-sm font-bold text-white mb-1">Hapus Gambar ini?</h4>
                <p className="text-[11px] text-slate-400 mb-4 max-w-xs leading-relaxed">Gambar ini akan dihapus secara permanen dari galeri riset.</p>
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteGalleryItem(item.id);
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingGalleryId(null);
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
            
            {/* Responsive Aspect Ratio 4:3 on mobile, 16:9 on PC */}
            <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-gradient-to-tr from-[#056a3e] to-slate-900 flex flex-col items-center justify-center p-4 select-none">
              <div className="absolute inset-0 bg-grid-white/[0.04] bg-[size:14px_14px]"></div>
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="object-cover w-full h-full absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="text-white/50 text-center space-y-1.5 z-10 transition-transform duration-300 group-hover:scale-105">
                  <div className="text-2xl font-sans font-black tracking-widest text-[#056a3e] bg-white/10 px-3 py-1 rounded-md backdrop-blur-xs uppercase">
                    Khat
                  </div>
                  <span className="text-[10px] font-mono tracking-wider uppercase block">ArabNet Gallery</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent"></div>
            </div>

            <div className="p-5 flex-grow flex flex-col justify-between">
              <div>
                {hasWriteAccess && (
                  <div className="flex justify-end items-center gap-1 mb-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditError('');
                        setEditingGalleryItem(item);
                      }}
                      className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-[11px] font-bold px-2 py-1"
                      title="Ubah Data Gambar Ini"
                    >
                      <Pencil className="w-3 h-3 text-amber-700" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteGalleryItem(item.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Hapus Gambar dari Galeri"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <h3 className="text-base font-bold text-slate-950 mt-2.5 group-hover:text-[#056a3e] transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Full-Screen Lightbox Modal with generous screen margins and slide navigation */}
      {activeGalleryItem !== null && galleryItems[activeGalleryItem] && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto p-4 sm:p-6 md:p-10 flex items-start sm:items-center justify-center animate-fade-in"
          onClick={() => setActiveGalleryItem(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl relative flex flex-col my-auto border border-slate-200/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar Controls */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <span className="pointer-events-auto px-3 py-1.5 bg-slate-900/80 text-slate-100 rounded-full text-xs font-mono font-medium tracking-wider backdrop-blur-md border border-white/10 shadow-md">
                Gambar {activeGalleryItem + 1} dari {galleryItems.length}
              </span>

              <button 
                onClick={() => setActiveGalleryItem(null)}
                className="pointer-events-auto w-10 h-10 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer border border-white/10 hover:scale-105 active:scale-95"
                title="Tutup Preview (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Canvas & Image Container */}
            <div className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-slate-950 flex items-center justify-center overflow-hidden group select-none shrink-0">
              {/* Left Slide Arrow */}
              {galleryItems.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-slate-900/80 hover:bg-[#056a3e] text-white rounded-full flex items-center justify-center border border-white/20 transition-all shadow-lg cursor-pointer hover:scale-110 active:scale-95"
                  title="Gambar Sebelumnya (Panah Kiri)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Right Slide Arrow */}
              {galleryItems.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-slate-900/80 hover:bg-[#056a3e] text-white rounded-full flex items-center justify-center border border-white/20 transition-all shadow-lg cursor-pointer hover:scale-110 active:scale-95"
                  title="Gambar Selanjutnya (Panah Kanan)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {galleryItems[activeGalleryItem].image ? (
                <img 
                  src={galleryItems[activeGalleryItem].image} 
                  alt={galleryItems[activeGalleryItem].title}
                  className="w-full h-full object-contain bg-slate-950"
                />
              ) : (
                <div className="text-white/60 space-y-3 z-10 p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-black tracking-widest text-[#056a3e] bg-white/15 px-6 py-2.5 rounded-lg backdrop-blur-xs uppercase inline-block">
                    Khat & Media
                  </div>
                  <span className="text-xs font-mono tracking-wider uppercase block text-emerald-400">ArabNet Corpus Research</span>
                </div>
              )}
            </div>

            {/* Details & Captions */}
            <div className="p-6 md:p-8 bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-950">
                  {galleryItems[activeGalleryItem].title}
                </h3>

                <p className="text-xs md:text-sm text-slate-600 leading-relaxed mt-2">
                  {galleryItems[activeGalleryItem].desc}
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                {hasWriteAccess ? (
                  <button
                    onClick={() => {
                      const itemToEdit = galleryItems[activeGalleryItem];
                      setActiveGalleryItem(null);
                      setEditError('');
                      setEditingGalleryItem(itemToEdit);
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-200"
                    title="Ubah Gambar Ini"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-700" />
                    <span>Ubah Gambar (Edit)</span>
                  </button>
                ) : <div />}
                <button 
                  onClick={() => setActiveGalleryItem(null)}
                  className="text-[#056a3e] hover:text-[#044d2d] font-bold cursor-pointer hover:underline"
                >
                  Tutup Tampilan
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Gallery Item Modal */}
      {hasWriteAccess && editingGalleryItem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex items-center justify-center animate-fade-in"
          onClick={() => setEditingGalleryItem(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative border border-slate-200/80 my-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-[#056a3e]">
                <Pencil className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900">Ubah Data Gambar Galeri</h3>
              </div>
              <button
                onClick={() => setEditingGalleryItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Judul Gambar / Karya *</label>
                <input
                  type="text"
                  required
                  value={editingGalleryItem.title}
                  onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, title: e.target.value })}
                  placeholder="Contoh: Mushaf Kuno Abad Pertengahan"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/15 font-medium text-slate-800"
                />
              </div>

              {/* Image Upload / URL Field & Preview */}
              <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#056a3e]" />
                      <span>Unggah / Ubah Berkas Gambar *</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Pilih berkas baru dari perangkat (PC/HP), atau ganti tautan URL gambar.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#056a3e] bg-emerald-100/70 px-2.5 py-1 rounded-md font-bold self-start sm:self-auto">
                    Rasio: PC 16:9 | HP 4:3
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 items-center">
                  <div className="md:col-span-7 space-y-3">
                    <label className="flex px-4 py-2.5 bg-white border border-slate-300 hover:border-[#056a3e] rounded-xl text-xs font-bold text-slate-700 hover:text-[#056a3e] cursor-pointer transition-all items-center justify-center gap-2 shadow-3xs group">
                      <Upload className="w-4 h-4 text-[#056a3e] group-hover:scale-110 transition-transform" />
                      <span>Pilih Berkas Dari Perangkat</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span>Atau Tempel Tautan URL Gambar</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <input
                      type="url"
                      required={!editingGalleryItem.image}
                      value={editingGalleryItem.image}
                      onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, image: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-5">
                    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-3xs flex items-center justify-center text-center">
                      {editingGalleryItem.image ? (
                        <>
                          <img
                            src={editingGalleryItem.image}
                            alt="Pratinjau Edit"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingGalleryItem({ ...editingGalleryItem, image: '' })}
                            className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                            title="Hapus Gambar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="p-4 text-slate-400 flex flex-col items-center justify-center space-y-1">
                          <ImageIcon className="w-8 h-8 text-emerald-500/60" />
                          <span className="text-[11px] font-bold text-slate-300">Belum Ada Gambar</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Keterangan / Deskripsi Gambar *</label>
                <textarea
                  required
                  rows={3}
                  value={editingGalleryItem.desc}
                  onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, desc: e.target.value })}
                  placeholder="Penjelasan mengenai gambar..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/15 font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGalleryItem(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
