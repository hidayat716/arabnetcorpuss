import React, { useState } from 'react';
import { 
  User, 
  CheckCircle2, 
  LogOut, 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Send, 
  UserPlus, 
  ArrowLeft,
  BookOpen,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { CustomBookLogo } from './CustomBookLogo';
import { EMAILJS_DEFAULT_CONFIG } from '../lib/emailjs';

interface LoginPanelProps {
  isLoggedIn: boolean;
  userName: string;
  userRole: 'Peneliti' | 'Peserta' | 'Admin';
  userEmail: string;
  loginError: string;
  setLoginError: (err: string) => void;
  emailInput: string;
  setEmailInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  loginRole: 'peserta' | 'admin';
  setLoginRole: (role: 'peserta' | 'admin') => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  handleLoginSubmit: (e: React.FormEvent) => void;
  handleLogout: () => void;
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  registerName: string;
  setRegisterName: (val: string) => void;
  registerEmail: string;
  setRegisterEmail: (val: string) => void;
  registerPassword: string;
  setRegisterPassword: (val: string) => void;
  registerConfirmPassword: string;
  setRegisterConfirmPassword: (val: string) => void;
  registerError: string;
  setRegisterError: (err: string) => void;
  registrationSuccess: boolean;
  setRegistrationSuccess: (val: boolean) => void;
  registeredEmail: string;
  handleRegisterSubmit: (e: React.FormEvent) => void;
  handleSimulatedConfirmation: () => void;
  setCurrentTab: (tab: 'beranda' | 'berita' | 'korpus' | 'galeri' | 'tentang' | 'login' | 'pengguna') => void;
  setKorpusSubTab: (subTab: 'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah') => void;
  
  // OTP & EmailJS support
  generatedOtp: string;
  handleVerifyOtp: (otp: string) => Promise<void>;
  isSendingEmail: boolean;
  resendOtp: () => Promise<void>;
}

export default function LoginPanel({
  isLoggedIn,
  userName,
  userRole,
  userEmail,
  loginError,
  setLoginError,
  emailInput,
  setEmailInput,
  passwordInput,
  setPasswordInput,
  loginRole,
  setLoginRole,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  handleLoginSubmit,
  handleLogout,
  isRegistering,
  setIsRegistering,
  registerName,
  setRegisterName,
  registerEmail,
  setRegisterEmail,
  registerPassword,
  setRegisterPassword,
  registerConfirmPassword,
  setRegisterConfirmPassword,
  registerError,
  setRegisterError,
  registrationSuccess,
  setRegistrationSuccess,
  registeredEmail,
  handleRegisterSubmit,
  handleSimulatedConfirmation,
  setCurrentTab,
  setKorpusSubTab,
  
  // OTP & EmailJS support
  generatedOtp,
  handleVerifyOtp,
  isSendingEmail,
  resendOtp
}: LoginPanelProps) {
  // OTP & EmailJS local states
  const [otpInput, setOtpInput] = useState('');
  const [localOtpError, setLocalOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showEmailJsSettings, setShowEmailJsSettings] = useState(false);
  
  const [localServiceId, setLocalServiceId] = useState(() => localStorage.getItem('emailjs_service_id') || EMAILJS_DEFAULT_CONFIG.SERVICE_ID);
  const [localTemplateId, setLocalTemplateId] = useState(() => localStorage.getItem('emailjs_template_id') || EMAILJS_DEFAULT_CONFIG.TEMPLATE_ID);
  const [localPublicKey, setLocalPublicKey] = useState(() => localStorage.getItem('emailjs_public_key') || EMAILJS_DEFAULT_CONFIG.PUBLIC_KEY);

  const handleSaveEmailJsSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('emailjs_service_id', localServiceId);
    localStorage.setItem('emailjs_template_id', localTemplateId);
    localStorage.setItem('emailjs_public_key', localPublicKey);
    alert('Konfigurasi EmailJS berhasil disimpan! Silakan klik "Kirim Ulang Kode OTP" di atas untuk mengirim ulang.');
  };

  const handleVerifyClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim().length !== 6) {
      setLocalOtpError('Kode OTP harus terdiri dari 6 digit angka.');
      return;
    }
    setLocalOtpError('');
    setIsVerifying(true);
    try {
      await handleVerifyOtp(otpInput.trim());
    } catch (err: any) {
      setLocalOtpError(err.message || 'Gagal memverifikasi OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendClick = async () => {
    setLocalOtpError('');
    try {
      await resendOtp();
      alert('Kode OTP baru telah berhasil dikirim!');
    } catch (err: any) {
      setLocalOtpError(err.message || 'Gagal mengirim ulang OTP.');
    }
  };

  return (
    <div className="w-full flex-grow flex justify-center items-center py-6 px-4 animate-fade-in my-auto" id="panel-login">
      <div className="w-full max-w-md mx-auto my-auto">
        {isLoggedIn ? (
          /* User Dashboard (Logged In) */
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center space-y-6">
            
            <div className="relative w-24 h-24 bg-[#ebf5f0] text-[#056a3e] border-2 border-[#056a3e]/20 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <User className="w-12 h-12" />
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#056a3e] text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-xs">
                ✓
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">{userName}</h2>
              <span className="text-xs font-semibold text-[#056a3e] bg-[#ebf5f0] px-3.5 py-1.5 rounded-full mt-2.5 inline-block border border-[#056a3e]/10">
                {userRole === 'Peneliti' ? 'Peneliti Utama Korpus' : userRole === 'Admin' ? 'Admin Akademik' : 'Peserta Civitas'}
              </span>
              <p className="text-xs text-slate-400 mt-2">{userEmail}</p>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Otoritas Anda</h3>
              
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#056a3e] shrink-0" />
                  <span>Hak penuh menambah dokumen Arab ke korpus</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#056a3e] shrink-0" />
                  <span>Hak penuh menghapus dokumen korpus bermasalah</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#056a3e] shrink-0" />
                  <span>Analisis tak terbatas di KWIC, Collocations & N-Gram</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => { setCurrentTab('korpus'); setKorpusSubTab('tambah'); }}
                className="flex-1 py-3 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Mulai Mengunggah
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-3 bg-white hover:bg-slate-50 text-red-600 border border-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        ) : isRegistering ? (
          /* Registration Flow */
          registrationSuccess ? (
            /* OTP Verification Screen with EmailJS Configuration */
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-[#ebf5f0] flex items-center justify-center shadow-xs text-[#056a3e] animate-bounce">
                  <Send className="w-10 h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-[24px] font-extrabold text-[#056a3e] tracking-tight leading-tight">Verifikasi OTP Peserta</h2>
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Konfirmasi Pendaftaran</p>
              </div>

              <div className="p-6 bg-[#f8faf9] rounded-2xl border border-slate-100 space-y-3 text-left">
                <p className="text-sm text-slate-600 leading-relaxed text-center">
                  Kami telah mengirimkan kode OTP konfirmasi pendaftaran peserta baru ke alamat email Anda:
                </p>
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ebf5f0] text-[#056a3e] font-bold text-sm rounded-xl border border-[#056a3e]/10 break-all select-all">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>{registeredEmail}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed text-center">
                  Silakan periksa kotak masuk atau folder spam email Anda untuk menemukan 6 digit kode OTP.
                </p>
              </div>

              {localOtpError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-semibold flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{localOtpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyClick} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-800 block text-center">
                    Masukkan 6 Digit Kode OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtpInput(val);
                    }}
                    placeholder="000000"
                    className="w-full text-center px-4 py-3.5 text-2xl font-black tracking-[0.5em] pl-[0.5em] border border-slate-200 bg-[#f8faf9] rounded-2xl focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/20 outline-none text-slate-800 transition-all placeholder:text-slate-300 placeholder:tracking-normal placeholder:pl-0 font-mono"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResendClick}
                    disabled={isSendingEmail}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                    <span>Kirim Ulang OTP</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex-1 py-3 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Verifikasi & Masuk</span>
                  </button>
                </div>
              </form>

              {/* Developer Sandbox Mode Badge / Helper */}
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-left space-y-1">
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                  💡 Sandbox Mode
                </span>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Kode OTP saat ini adalah <strong className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded font-mono text-sm">{generatedOtp}</strong>
                </p>
                <p className="text-[10px] text-amber-600 leading-normal">
                  Gunakan kode di atas jika Anda belum menyambungkan EmailJS, atau hubungkan akun EmailJS Anda di bawah untuk mengirim OTP asli ke email Anda.
                </p>
              </div>

              {/* EmailJS Settings Toggle & Form */}
              <div className="border-t border-slate-100 pt-4 text-left">
                <button
                  type="button"
                  onClick={() => setShowEmailJsSettings(!showEmailJsSettings)}
                  className="flex items-center justify-between w-full text-slate-500 hover:text-slate-800 text-xs font-bold py-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-[#056a3e]" />
                    <span>⚙️ Konfigurasi EmailJS {showEmailJsSettings ? '▲' : '▼'}</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {localServiceId ? 'Tersambung' : 'Belum Set'}
                  </span>
                </button>

                {showEmailJsSettings && (
                  <form onSubmit={handleSaveEmailJsSettings} className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 animate-fade-in text-left">
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Buat akun di <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-[#056a3e] underline font-bold">EmailJS.com</a> (gratis 200 email/bulan) dan isi detail berikut untuk mengaktifkan pengiriman email konfirmasi sungguhan:
                    </p>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">EmailJS Service ID</label>
                      <input
                        type="text"
                        value={localServiceId}
                        onChange={(e) => setLocalServiceId(e.target.value)}
                        placeholder="e.g. service_xxxxxxx"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-[#056a3e]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">EmailJS Template ID</label>
                      <input
                        type="text"
                        value={localTemplateId}
                        onChange={(e) => setLocalTemplateId(e.target.value)}
                        placeholder="e.g. template_xxxxxxx"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-[#056a3e]"
                        required
                      />
                      <p className="text-[9px] text-slate-400">
                        *Template email harus memiliki variabel <code className="font-mono bg-slate-100 px-1 rounded font-bold">{"{{to_name}}"}</code>, <code className="font-mono bg-slate-100 px-1 rounded font-bold">{"{{to_email}}"}</code>, dan <code className="font-mono bg-slate-100 px-1 rounded font-bold">{"{{otp_code}}"}</code>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">EmailJS Public Key (User ID)</label>
                      <input
                        type="text"
                        value={localPublicKey}
                        onChange={(e) => setLocalPublicKey(e.target.value)}
                        placeholder="e.g. user_xxxxxxxxxxxxxx atau Public Key"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-[#056a3e]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold shadow-sm transition-all text-center cursor-pointer"
                    >
                      Simpan Konfigurasi
                    </button>
                  </form>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setRegistrationSuccess(false);
                  }}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Masuk</span>
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form for Peserta */
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-[#056a3e] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(5,106,62,0.15)] relative transition-all hover:scale-105 duration-300">
                  <UserPlus className="w-10 h-10" />
                </div>
              </div>

              <div className="text-center space-y-1.5">
                <h2 className="text-[28px] font-black tracking-tight leading-none text-slate-900">
                  Daftar <span className="text-[#056a3e]">Peserta</span>
                </h2>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">ArabNet Corpus Digital</p>
              </div>

              {registerError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-800 block">
                    Nama Lengkap
                  </label>
                  <div className="flex items-center border border-slate-200 bg-[#f8faf9] rounded-2xl focus-within:border-[#056a3e] focus-within:ring-1 focus-within:ring-[#056a3e]/20 overflow-hidden transition-all">
                    <div className="pl-4 text-[#056a3e] shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full px-3 py-3.5 bg-transparent border-none text-sm outline-none text-slate-800 placeholder-slate-400 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-800 block">
                    Alamat Email
                  </label>
                  <div className="flex items-center border border-slate-200 bg-[#f8faf9] rounded-2xl focus-within:border-[#056a3e] focus-within:ring-1 focus-within:ring-[#056a3e]/20 overflow-hidden transition-all">
                    <div className="pl-4 text-[#056a3e] shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-3 py-3.5 bg-transparent border-none text-sm outline-none text-slate-800 placeholder-slate-400 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-800 block">
                    Kata Sandi
                  </label>
                  <div className="flex items-center border border-slate-200 bg-[#f8faf9] rounded-2xl focus-within:border-[#056a3e] focus-within:ring-1 focus-within:ring-[#056a3e]/20 overflow-hidden transition-all">
                    <div className="pl-4 text-[#056a3e] shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Buat kata sandi baru"
                      className="flex-1 px-3 py-3.5 bg-transparent border-none text-sm outline-none text-slate-800 placeholder-slate-400 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-800 block">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="flex items-center border border-slate-200 bg-[#f8faf9] rounded-2xl focus-within:border-[#056a3e] focus-within:ring-1 focus-within:ring-[#056a3e]/20 overflow-hidden transition-all">
                    <div className="pl-4 text-[#056a3e] shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi Anda"
                      className="flex-1 px-3 py-3.5 bg-transparent border-none text-sm outline-none text-slate-800 placeholder-slate-400 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Send className="w-5 h-5" />
                    <span>Daftar & Kirim Konfirmasi</span>
                  </button>
                </div>

              </form>

              {/* Back to Login Footer Link */}
              <div className="text-center text-sm text-slate-400 font-semibold">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  className="text-[#056a3e] font-bold hover:underline bg-transparent border-none cursor-pointer"
                  onClick={() => {
                    setIsRegistering(false);
                    setRegisterError('');
                  }}
                >
                  Masuk di sini
                </button>
              </div>

            </div>
          )
        ) : (
          /* Login Form */
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(5,106,62,0.04)] space-y-7">
            
            {/* Circular Logo Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#056a3e] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(5,106,62,0.15)] transition-all hover:scale-105 duration-300">
                <CustomBookLogo className="w-10 h-10" />
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="text-center space-y-1.5">
              <h2 className="text-[30px] font-black tracking-tight leading-none text-slate-900">
                ArabNet <span className="text-[#056a3e]">Corpus</span>
              </h2>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Sistem Korpus Digital</p>
            </div>

            {/* Role Selector Tabs (Elegant & Compact) */}
            <div className="flex p-1 bg-[#ebf5f0] rounded-[16px] border border-[#e2f0e9]/80 shadow-3xs">
              <button
                type="button"
                onClick={() => setLoginRole('peserta')}
                className={`flex-1 py-2.5 px-4 rounded-[12px] text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-95 ${
                  loginRole === 'peserta'
                    ? 'bg-[#056a3e] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
                }`}
              >
                <GraduationCap className="w-4.5 h-4.5 shrink-0" />
                <span>Peserta</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('admin')}
                className={`flex-1 py-2.5 px-4 rounded-[12px] text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-95 ${
                  loginRole === 'admin'
                    ? 'bg-[#056a3e] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#056a3e] hover:bg-white/40'
                }`}
              >
                <User className="w-4.5 h-4.5 shrink-0" />
                <span>Admin</span>
              </button>
            </div>

            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              
              {/* Username/Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800 block">
                  Email
                </label>
                <div className="flex items-center border border-slate-200 bg-[#f8faf9] rounded-2xl focus-within:border-[#056a3e] focus-within:ring-1 focus-within:ring-[#056a3e]/20 overflow-hidden transition-all">
                  <div className="pl-4 text-[#056a3e] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Masukkan alamat email"
                    className="w-full px-3 py-4 bg-transparent border-none text-sm outline-none text-slate-800 placeholder-slate-400 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800 block">
                  Kata Sandi
                </label>
                <div className="flex items-center border border-slate-200 bg-[#f8faf9] rounded-2xl focus-within:border-[#056a3e] focus-within:ring-1 focus-within:ring-[#056a3e]/20 overflow-hidden transition-all">
                  <div className="pl-4 text-[#056a3e] shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="flex-1 px-3 py-4 bg-transparent border-none text-sm outline-none text-slate-800 placeholder-slate-400 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-full border-l border-slate-200 px-4 py-4 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#056a3e] focus:ring-[#056a3e]/30 cursor-pointer"
                  />
                  <span>Ingat saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Fitur pengaturan ulang kata sandi dapat diakses dengan menghubungi Administrator Akademik.')}
                  className="text-slate-400 font-semibold hover:text-[#056a3e] transition-colors cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full py-4 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <LogIn className="w-5 h-5" />
                <span>Masuk</span>
              </button>

            </form>

            {/* Register Footer Link */}
            <div className="text-center text-sm text-slate-400 font-semibold">
              Belum punya akun?{' '}
              <button
                type="button"
                className="text-[#056a3e] font-bold hover:underline bg-transparent border-none cursor-pointer"
                onClick={() => {
                  setIsRegistering(true);
                  setRegisterError('');
                  setRegistrationSuccess(false);
                }}
              >
                Daftar di sini
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
