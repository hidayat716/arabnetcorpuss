import React, { useState, useEffect } from 'react';
import { Eye, Target, Users, Plus, Edit2, Trash2, Upload, Image, X, Check, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { TeamMember } from '../types';
import { 
  getTeamMembersFromFirestore, 
  saveTeamMemberToFirestore, 
  deleteTeamMemberFromFirestore, 
  subscribeTeamMembersFromFirestore 
} from '../services/firebase';

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team_1',
    name: 'Ahmad Hizkil, S.S., M.Hum.',
    role: 'Ketua Peneliti',
    photoUrl: '',
    bio: 'Dosen & Peneliti Bahasa Arab'
  },
  {
    id: 'team_2',
    name: 'Ahmad Sirojul Hakiki, S.S., M.Pd.',
    role: 'Anggota Peneliti',
    photoUrl: '',
    bio: 'Dosen & Peneliti Linguistik Korpus'
  },
  {
    id: 'team_3',
    name: 'Zamroni, M.Pd.',
    role: 'Anggota Peneliti',
    photoUrl: '',
    bio: 'Peneliti Pendidikan Bahasa Arab'
  }
];

interface AboutPanelProps {
  isLoggedIn?: boolean;
  userRole?: string;
}

export default function AboutPanel({ isLoggedIn = false, userRole = '' }: AboutPanelProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    role: string;
    photoUrl: string;
    bio: string;
  }>({
    name: '',
    role: '',
    photoUrl: '',
    bio: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setIsAdmin(isLoggedIn && (userRole === 'Admin' || userRole === 'Peneliti'));
  }, [isLoggedIn, userRole]);

  // Load team members from Firestore with real-time sync
  useEffect(() => {
    const unsubscribe = subscribeTeamMembersFromFirestore((data) => {
      if (data && data.length > 0) {
        setTeamMembers(data);
      } else {
        setTeamMembers(DEFAULT_TEAM_MEMBERS);
      }
      setIsLoading(false);
    }, DEFAULT_TEAM_MEMBERS);

    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      role: 'Anggota Peneliti',
      photoUrl: '',
      bio: ''
    });
    setStatusMessage(null);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      role: member.role,
      photoUrl: member.photoUrl || '',
      bio: member.bio || ''
    });
    setStatusMessage(null);
    setShowFormModal(true);
  };

  // Handle local image file upload & convert to Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'Ukuran foto maksimal 3 MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
          setStatusMessage({ type: 'success', text: 'Foto berhasil diunggah! Klik Simpan untuk memperbarui.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) {
      setStatusMessage({ type: 'error', text: 'Nama lengkap dan jabatan wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const memberId = editingId || `team_${Date.now()}`;
    const newMember: TeamMember = {
      id: memberId,
      name: formData.name.trim(),
      role: formData.role.trim(),
      photoUrl: formData.photoUrl.trim(),
      bio: formData.bio.trim()
    };

    try {
      await saveTeamMemberToFirestore(newMember);
      setStatusMessage({ type: 'success', text: 'Data anggota tim pengembang berhasil disimpan ke Firestore!' });
      setTimeout(() => {
        setShowFormModal(false);
        setIsSubmitting(false);
      }, 700);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal menyimpan: ${err.message || 'Error server'}` });
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus "${name}" dari tim pengembang?`)) {
      try {
        await deleteTeamMemberFromFirestore(id);
        setTeamMembers(prev => prev.filter(m => m.id !== id));
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message || 'Error'}`);
      }
    }
  };

  // Helper function to get initials for fallback avatar
  const getInitials = (name: string) => {
    const words = name.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 animate-fade-in" id="panel-tentang">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* About Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-3xs space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Tentang ArabNet Corpus</h2>
            <div className="h-1 w-16 bg-[#056a3e] rounded-full mt-2"></div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed text-justify">
            ArabNet Corpus adalah platform korpus digital bahasa Arab berbasis big data yang dikembangkan untuk mendukung kegiatan penelitian, pembelajaran, dan analisis linguistik bahasa Arab di era digital. Website ini menyediakan kumpulan data bahasa Arab yang terstruktur, modern, dan mudah diakses oleh mahasiswa, dosen, peneliti, maupun masyarakat umum.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed text-justify">
            ArabNet Corpus hadir sebagai sarana pengembangan literasi digital dan teknologi bahasa dengan mengintegrasikan ilmu linguistik Arab serta perkembangan teknologi informasi sehingga pengguna dapat melakukan pencarian, analisis, dan pemahaman bahasa Arab secara lebih efektif, cepat, dan akurat.
          </p>
        </div>

        {/* Vision & Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visi */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-3xs space-y-3">
            <div className="w-10 h-10 bg-teal-50 text-[#056a3e] rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-950">Visi</h3>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              Menjadi platform korpus digital bahasa Arab berbasis big data yang inovatif, terpercaya, dan mudah diakses sebagai sarana penguatan analisis linguistik, penelitian kebahasaan, pembelajaran bahasa Arab, serta pengembangan literasi digital melalui pemanfaatan teknologi informasi modern.
            </p>
          </div>

          {/* Misi */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-3xs space-y-3">
            <div className="w-10 h-10 bg-teal-50 text-[#056a3e] rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-950">Misi</h3>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              Mengembangkan korpus digital bahasa Arab yang akurat, terstruktur, dan mudah diakses untuk mendukung penelitian linguistik, pembelajaran bahasa Arab, serta analisis kebahasaan berbasis teknologi digital. Selain itu, platform ini bertujuan meningkatkan literasi digital dalam bidang bahasa Arab.
            </p>
          </div>
        </div>

        {/* Tim Pengembang Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-[#056a3e]">
              <Users className="w-5 h-5" />
              <h3 className="text-lg font-bold">Tim Pengembang</h3>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-[#056a3e] hover:bg-[#045230] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Anggota Tim</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div 
                key={member.id} 
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-3xs flex flex-col items-center text-center space-y-4 relative group transition-all hover:shadow-md"
              >
                {/* Admin Quick Action Buttons */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="p-1.5 text-slate-600 hover:text-[#056a3e] hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                      title="Ubah Data / Foto Anggota"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Hapus Anggota Tim"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Member Avatar / Foto */}
                <div className="relative">
                  {member.photoUrl ? (
                    <img 
                      src={member.photoUrl} 
                      alt={member.name} 
                      className="w-24 h-24 rounded-full object-cover border-2 border-emerald-600/30 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#056a3e] to-teal-700 flex items-center justify-center text-white text-xl font-bold shadow-xs select-none border-2 border-emerald-600/30">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Member Details */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#056a3e] tracking-tight">{member.name}</h4>
                  <p className="text-xs text-slate-600 font-semibold">{member.role}</p>
                  {member.bio && (
                    <p className="text-[11px] text-slate-400 font-medium pt-1 line-clamp-2">{member.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ADMIN EDIT / ADD TEAM MEMBER MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5 my-8">
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-[#056a3e] rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Ubah Data Anggota Tim' : 'Tambah Anggota Tim Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Isi profil dan unggah foto anggota tim pengembang.
                </p>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Preview & Upload Section */}
              <div className="flex flex-col items-center justify-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="relative">
                  {formData.photoUrl ? (
                    <img 
                      src={formData.photoUrl} 
                      alt="Preview Foto" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#056a3e] shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-200 flex flex-col items-center justify-center text-slate-400 font-bold border-2 border-dashed border-slate-300">
                      <Image className="w-8 h-8 mb-1" />
                      <span className="text-[10px]">Belum Ada Foto</span>
                    </div>
                  )}
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                      className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 cursor-pointer"
                      title="Hapus Foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="w-full space-y-2 text-center">
                  <label className="block text-xs font-bold text-slate-700">Foto Anggota Tim</label>
                  
                  {/* File Upload Button */}
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-400 cursor-pointer shadow-3xs transition-all w-full">
                    <Upload className="w-4 h-4 text-[#056a3e]" />
                    <span>Unggah Foto dari Perangkat (HP / Laptop)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>

                  <div className="text-[11px] text-slate-400 font-medium">atau tempel link URL foto di bawah:</div>

                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                    placeholder="https://domain.com/foto.jpg"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-mono text-slate-700"
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Ahmad Hizkil, S.S., M.Hum."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                  required
                />
              </div>

              {/* Jabatan / Peran */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jabatan / Peran dalam Tim <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Contoh: Ketua Peneliti / Developer / Linguis"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                  required
                />
              </div>

              {/* Bio / Ringkasan Deskripsi */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bio Singkat / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Keterangan singkat keahlian atau peran..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#056a3e] hover:bg-[#045230] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Anggota Tim</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

