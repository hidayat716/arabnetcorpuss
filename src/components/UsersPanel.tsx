import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Award, 
  GraduationCap, 
  Search, 
  Info, 
  Clock, 
  Pencil, 
  Trash2,
  Database,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { CorpusUser } from '../types';

interface UsersPanelProps {
  isLoggedIn: boolean;
  userRole: 'Peneliti' | 'Peserta' | 'Admin';
  userEmail: string;
  users: CorpusUser[];
  userSearchQuery: string;
  setUserSearchQuery: (val: string) => void;
  userRoleFilter: 'All' | 'Peneliti' | 'Admin' | 'Peserta';
  setUserRoleFilter: (val: 'All' | 'Peneliti' | 'Admin' | 'Peserta') => void;
  setShowAddUserModal: (val: boolean) => void;
  setEditingUser: (val: CorpusUser | null) => void;
  handleDeleteUser: (id: string) => void;
  onSeedFirestore?: () => Promise<{ count: number; error?: string }>;
  onOpenFirestoreExplorer?: () => void;
}

export default function UsersPanel({
  isLoggedIn,
  userRole,
  userEmail,
  users,
  userSearchQuery,
  setUserSearchQuery,
  userRoleFilter,
  setUserRoleFilter,
  setShowAddUserModal,
  setEditingUser,
  handleDeleteUser,
  onSeedFirestore,
  onOpenFirestoreExplorer
}: UsersPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSyncClick = async () => {
    if (!onSeedFirestore) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await onSeedFirestore();
      if (res.error) {
        setSyncStatus({ type: 'error', message: res.error });
      } else {
        setSyncStatus({ 
          type: 'success', 
          message: `Berhasil membuat & mengirim ${res.count} data dokumen (Artikel, Korpus, Galeri, Genre & Pengguna) secara langsung ke Firebase Firestore!` 
        });
      }
    } catch (err: any) {
      setSyncStatus({ type: 'error', message: err?.message || 'Gagal sinkronisasi data ke Firestore.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="panel-pengguna">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ebf5f0] border border-[#056a3e]/10 rounded-full text-[#056a3e] text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Sistem Database Pengguna</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Database Administrator & Peserta</h2>
          <p className="text-sm text-slate-500">
            Daftar seluruh pengguna sistem, hak akses peneliti, admin, dan verifikasi peserta digital.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {onSeedFirestore && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
              title="Kirim dan buat koleksi data ke Firebase Firestore sekarang"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span>{isSyncing ? 'Mengirim ke Firestore...' : 'Kirim Data Bawaan ke Firestore'}</span>
            </button>
          )}

          {(userRole === 'Peneliti' || userRole === 'Admin') && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-5 py-3 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengguna Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Feedback Banner */}
      {syncStatus && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-fade-in ${
          syncStatus.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {syncStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm font-medium">
            <p className="font-bold">{syncStatus.type === 'success' ? 'Firestore Berhasil Diisi!' : 'Gagal Menyimpan'}</p>
            <p className="mt-0.5 opacity-90">{syncStatus.message}</p>
            {syncStatus.type === 'success' && (
              <p className="mt-1.5 text-[11px] text-emerald-700">
                💡 Buka <b>Firebase Console → Firestore Database → Data</b> untuk melihat koleksi <code>articles</code>, <code>corpus_docs</code>, <code>gallery</code>, <code>genres</code>, dan <code>users</code> secara langsung.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Total Pengguna</span>
            <span className="text-xl font-bold text-slate-900 block">{users.length}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-[#056a3e]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Peneliti & Admin</span>
            <span className="text-xl font-bold text-slate-900 block">
              {users.filter(u => u.role === 'Peneliti' || u.role === 'Admin').length}
            </span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Peserta</span>
            <span className="text-xl font-bold text-slate-900 block">
              {users.filter(u => u.role === 'Peserta').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau email..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-bold mr-1.5">Kategori:</span>
          {(['All', 'Peneliti', 'Admin', 'Peserta'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setUserRoleFilter(role)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userRoleFilter === role
                  ? 'bg-[#056a3e] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
            >
              {role === 'All' ? 'Semua' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Read-Only Notice for Visitors */}
      {!(userRole === 'Peneliti' || userRole === 'Admin') && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium flex items-start gap-2.5 shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Mode Peninjau Terbatas</span>
            Anda sedang meninjau pangkalan data pengguna ArabNet Corpus. Penambahan, pengeditan, atau penghapusan status admin dan peserta hanya diizinkan untuk akun Administrator atau Peneliti Utama.
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users
          .filter(u => {
            const matchSearch =
              u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
              u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
            const matchRole = userRoleFilter === 'All' || u.role === userRoleFilter;
            return matchSearch && matchRole;
          })
          .map((u) => {
            const isCurrentUser = isLoggedIn && userEmail.toLowerCase() === u.email.toLowerCase();
            return (
              <div 
                key={u.id} 
                className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                  isCurrentUser ? 'border-[#056a3e] ring-1 ring-[#056a3e]/20' : 'border-slate-100'
                }`}
              >
                {/* Decorative role strip */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  u.role === 'Peneliti' ? 'bg-emerald-600' : u.role === 'Admin' ? 'bg-teal-600' : 'bg-indigo-500'
                }`} />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Role Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'Peneliti' 
                        ? 'text-[#056a3e] bg-[#ebf5f0]' 
                        : u.role === 'Admin' 
                        ? 'text-teal-800 bg-teal-50' 
                        : 'text-indigo-800 bg-indigo-50'
                    }`}>
                      {u.role}
                    </span>

                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Grup: {u.joinedDate}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">Anda</span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium break-all mt-1">{u.email}</p>
                    
                    {/* Password display block */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100/60 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 font-sans font-bold">Sandi:</span>
                      <span className="bg-slate-50 px-2 py-1 rounded text-[#056a3e] font-extrabold select-all">{u.password || 'sandi-korpus'}</span>
                    </div>
                  </div>
                </div>

                {/* Control buttons for Peneliti/Admin */}
                {(userRole === 'Peneliti' || userRole === 'Admin') && (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Edit Pengguna"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Ubah</span>
                    </button>
                    
                    {/* Protect current logged in user from deletion */}
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {users.filter(u => {
          const matchSearch =
            u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
          const matchRole = userRoleFilter === 'All' || u.role === userRoleFilter;
          return matchSearch && matchRole;
        }).length === 0 && (
          <div className="col-span-full bg-slate-100/50 rounded-2xl py-12 text-center border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
