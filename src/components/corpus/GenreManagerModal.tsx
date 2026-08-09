import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Genre } from '../../types';

interface GenreManagerModalProps {
  showGenreManager: boolean;
  setShowGenreManager: (show: boolean) => void;
  genreError: string;
  setGenreError: (err: string) => void;
  newGenreName: string;
  setNewGenreName: (val: string) => void;
  genres: Genre[];
  onAddGenre: (name: string) => Promise<void>;
  onDeleteGenre: (id: string) => Promise<void>;
}

export default function GenreManagerModal({
  showGenreManager,
  setShowGenreManager,
  genreError,
  setGenreError,
  newGenreName,
  setNewGenreName,
  genres,
  onAddGenre,
  onDeleteGenre
}: GenreManagerModalProps) {
  const [deletingGenreId, setDeletingGenreId] = React.useState<string | null>(null);

  if (!showGenreManager) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100 space-y-6 animate-slide-up">
        <button
          onClick={() => {
            setShowGenreManager(false);
            setGenreError('');
            setNewGenreName('');
          }}
          className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-bold text-slate-900">Kelola Genre & Kategori</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tambah atau hapus genre penelitian dalam pangkalan data ArabNet Corpus.
          </p>
        </div>

        {genreError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
            {genreError}
          </div>
        )}

        {/* Add genre form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setGenreError('');
            const cleanName = newGenreName.trim();
            if (!cleanName) return;
            try {
              await onAddGenre(cleanName);
              setNewGenreName('');
            } catch (err: any) {
              setGenreError(err.message || 'Gagal menambahkan genre.');
            }
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nama Genre Baru</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGenreName}
                onChange={(e) => setNewGenreName(e.target.value)}
                placeholder="Contoh: Sejarah, Ekonomi"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-sm outline-none font-medium bg-white text-slate-900"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-xs transition-all cursor-pointer"
              >
                Tambah
              </button>
            </div>
          </div>
        </form>

        {/* List of existing genres */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Genre Aktif</h4>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {genres.map((g) => (
              <div key={g.id} className="p-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">{g.name}</span>
                {deletingGenreId === g.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-red-600">Hapus?</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await onDeleteGenre(g.id);
                          setDeletingGenreId(null);
                        } catch (err: any) {
                          setGenreError(err.message || 'Gagal menghapus genre.');
                        }
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer"
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingGenreId(null)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-bold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingGenreId(g.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Genre"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {genres.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs italic">
                Belum ada genre yang terdaftar.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              setShowGenreManager(false);
              setGenreError('');
              setNewGenreName('');
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
