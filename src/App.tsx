import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import {
  Globe,
  Award,
  LogIn,
  Database,
  ArrowRight,
  BookMarked,
  Layers,
  Sparkles,
  Users,
  Eye,
  Trash2,
  X,
  FileText,
  Clock,
  Pencil,
  Info,
  Menu,
  BookOpen,
  Loader2,
  Shield,
  Check,
  Upload,
  BarChart3,
  Newspaper,
  Link2,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article, ConcordanceResult, FrequencyItem, NgramItem, CollocationItem, CorpusUser, Genre } from './types';
import {
  getInitializedArticles,
  getInitializedCorpusDocs,
  computeCorpusStats,
  generateFrequencyList,
  generateNgramList,
  findConcordance,
  getCollocations,
  normalizeArabic
} from './data/initialData';
import { extractTextFromDocUrl } from './utils/docExtractor';
import {
  auth,
  getUserFromFirestore,
  getArticlesFromFirestore,
  saveArticleToFirestore,
  updateArticleInFirestore,
  deleteArticleFromFirestore,
  getCorpusDocsFromFirestore,
  saveCorpusDocToFirestore,
  updateCorpusDocInFirestore,
  deleteCorpusDocFromFirestore,
  getGalleryFromFirestore,
  saveGalleryToFirestore,
  deleteGalleryFromFirestore,
  GalleryItem,
  getUsersFromFirestore,
  saveUserToFirestore,
  updateUserInFirestore,
  deleteUserFromFirestore,
  getGenresFromFirestore,
  saveGenreToFirestore,
  deleteGenreFromFirestore,
  seedAllDataToFirestore,
  subscribeArticlesFromFirestore,
  subscribeCorpusDocsFromFirestore,
  subscribeGalleryFromFirestore,
  subscribeUsersFromFirestore,
  subscribeGenresFromFirestore
} from './services/firebase';

import HomePanel from './components/HomePanel';
import AboutPanel from './components/AboutPanel';
import LoginPanel from './components/LoginPanel';
import GalleryPanel from './components/GalleryPanel';
import UsersPanel from './components/UsersPanel';
import NewsPanel from './components/NewsPanel';
import CorpusPanel from './components/CorpusPanel';
import FirestoreExplorerModal from './components/FirestoreExplorerModal';
import { CustomBookLogo } from './components/CustomBookLogo';
import { sendOtpEmail } from './lib/emailjs';

export default function App() {
  // Navigation and Tab States
  const [currentTab, setCurrentTab] = useState<'beranda' | 'berita' | 'korpus' | 'galeri' | 'tentang' | 'login' | 'pengguna'>('beranda');
  const [korpusSubTab, setKorpusSubTab] = useState<'daftar' | 'pencarian' | 'frekuensi' | 'ngram' | 'kolokasi' | 'tambah'>('daftar');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data States (Synced with Firestore)
  const [articles, setArticles] = useState<Article[]>([]);
  const [corpusDocs, setCorpusDocs] = useState<Article[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [users, setUsers] = useState<CorpusUser[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | 'Peneliti' | 'Admin' | 'Peserta'>('All');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<CorpusUser | null>(null);
  const [newUserFormName, setNewUserFormName] = useState('');
  const [newUserFormEmail, setNewUserFormEmail] = useState('');
  const [newUserFormPassword, setNewUserFormPassword] = useState('');
  const [newUserFormRole, setNewUserFormRole] = useState<'Peneliti' | 'Admin' | 'Peserta'>('Peserta');
  const [newUserFormError, setNewUserFormError] = useState('');
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [gameDots, setGameDots] = useState('');

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setGameDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 350);
    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    if (!isDatabaseLoading) {
      setLoadingStep(3);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 2 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, [isDatabaseLoading]);
  const [showAddNews, setShowAddNews] = useState(false);
  const [showGalleryManager, setShowGalleryManager] = useState(false);

  // Genre Management handlers
  const handleAddGenre = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (genres.some(g => g.id === id || g.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('Genre ini sudah terdaftar.');
    }
    const newGenre: Genre = { id, name: cleanName };
    await saveGenreToFirestore(newGenre);
    setGenres(prev => [...prev, newGenre]);
  };

  const handleDeleteGenre = async (id: string) => {
    await deleteGenreFromFirestore(id);
    setGenres(prev => prev.filter(g => g.id !== id));
  };

  // Fetch all data from Firestore on mount
  useEffect(() => {
    async function loadDatabase() {
      setIsDatabaseLoading(true);
      try {
        const defaultArticles = getInitializedArticles();
        const defaultCorpusDocs = getInitializedCorpusDocs();
        const defaultGallery = [
          {
            id: 1,
            title: 'Khat Naskh Klasik',
            desc: "Gaya penulisan yang paling umum digunakan dalam mushaf Al-Qur'an karena keterbacaannya yang sangat tinggi. Karakter hurufnya bulat, jelas, dan memiliki struktur anatomi yang konsisten.",
            image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1000&q=80'
          },
          {
            id: 2,
            title: 'Khat Thuluth Megah',
            desc: 'Dikenal sebagai "rajanya kaligrafi", bergaya megah dan sering menghiasi dinding masjid serta kubah besar. Memiliki lekukan tajam, tebal-tipis yang dramatis, dan sangat kompleks.',
            image: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1000&q=80'
          },
          {
            id: 3,
            title: 'Manuskrip Kuno Kajian Linguistik',
            desc: 'Lembaran naskah kuno ber-tasykil yang menunjukkan ketelitian penyalinan karya ilmiah ulama tata bahasa Arab (Nahu-Saraf) di Baghdad abad pertengahan.',
            image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1000&q=80'
          },
          {
            id: 4,
            title: 'Visualisasi Word Cloud Korpus',
            desc: 'Peta visualisasi frekuensi kata otomatis di mana semakin besar ukuran tulisan Arab, semakin tinggi frekuensi pemunculan kata tersebut di seluruh korpus kita.',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80'
          },
          {
            id: 5,
            title: 'Khat Diwani yang Dinamis',
            desc: 'Gaya kaligrafi resmi yang diciptakan oleh Kekaisaran Ottoman, awalnya dipakai untuk dokumen diplomatik rahasia. Memiliki bentuk huruf melingkar rapat dan estetik.',
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80'
          },
          {
            id: 6,
            title: 'Linguistik Komparatif Semit',
            desc: 'Ilustrasi evolusi aksara Arab dari rumpun bahasa Semit purba (Nabatea dan Aramaik) hingga menjelma menjadi sistem ortografi terindah di dunia.',
            image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1000&q=80'
          }
        ];

        const defaultGenres: Genre[] = [
          { id: 'sejarah', name: 'Sejarah' },
          { id: 'ekonomi', name: 'Ekonomi' },
          { id: 'olahraga', name: 'Olahraga' },
          { id: 'agama', name: 'Agama' },
          { id: 'seni_budaya', name: 'Seni Budaya' },
          { id: 'pendidikan_kampus', name: 'Pendidikan Kampus' },
          { id: 'teknologi_riset', name: 'Teknologi & Riset' },
          { id: 'berita_kampus', name: 'Berita Kampus' },
          { id: 'fasilitas_kampus', name: 'Fasilitas Kampus' },
          { id: 'studi_keagamaan', name: 'Studi Keagamaan' },
          { id: 'linguistik_sastra', name: 'Linguistik & Sastra' },
          { id: 'linguistik_komputasi', name: 'Linguistik Komputasi' },
          { id: 'sastra_budaya', name: 'Sastra & Budaya' },
          { id: 'lain_lain', name: 'Lain-lain' }
        ];

        const defaultUsers: CorpusUser[] = [
          {
            id: 'peneliti@korpus.id',
            name: 'Dr. Ahmad Hasyim',
            email: 'peneliti@korpus.id',
            role: 'Peneliti',
            joinedDate: '2025-01-10',
            password: 'sandi-korpus'
          },
          {
            id: 'admin@korpus.id',
            name: 'Administrator Utama',
            email: 'admin@korpus.id',
            role: 'Admin',
            joinedDate: '2025-01-15',
            password: 'sandi-admin'
          },
          {
            id: 'budi@korpus.id',
            name: 'Budi Santoso',
            email: 'budi@korpus.id',
            role: 'Peserta',
            joinedDate: '2025-03-22',
            password: '123456'
          },
          {
            id: 'siti@korpus.id',
            name: 'Siti Aminah',
            email: 'siti@korpus.id',
            role: 'Peserta',
            joinedDate: '2025-04-05',
            password: '123456'
          },
          {
            id: 'ali@korpus.id',
            name: 'Muhammad Ali',
            email: 'ali@korpus.id',
            role: 'Peserta',
            joinedDate: '2025-05-18',
            password: '123456'
          }
        ];

        // 1. Subscribe to real-time changes from Firebase Firestore
        const unsubArticles = subscribeArticlesFromFirestore((items) => {
          setArticles(items);
          setIsDatabaseLoading(false);
        }, defaultArticles);

        const unsubCorpus = subscribeCorpusDocsFromFirestore((items) => {
          setCorpusDocs(items);
        }, defaultCorpusDocs);

        const unsubGallery = subscribeGalleryFromFirestore((items) => {
          setGalleryItems(items);
        }, defaultGallery);

        const unsubUsers = subscribeUsersFromFirestore((items) => {
          setUsers(items);
        }, defaultUsers);

        const unsubGenres = subscribeGenresFromFirestore((items) => {
          setGenres(items);
        }, defaultGenres);

        const subList = [unsubArticles, unsubCorpus, unsubGallery, unsubUsers, unsubGenres];

        // 2. Auto-seed initial defaults to Firestore in background if missing
        seedAllDataToFirestore(
          defaultArticles,
          defaultCorpusDocs,
          defaultGallery,
          defaultGenres,
          defaultUsers
        ).catch(e => console.warn('Auto seed background sync:', e));
        return subList;
      } catch (error) {
        console.error('Error loading Firestore data:', error);
        return [];
      } finally {
        setIsDatabaseLoading(false);
      }
    }

    let unsubs: Array<() => void> = [];
    loadDatabase().then(subList => {
      if (subList && subList.length > 0) unsubs = subList;
    });

    return () => {
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, []);

  // Monitor real Firebase Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase();
        try {
          const uProfile = await getUserFromFirestore(email);
          if (uProfile) {
            const finalRole = (email === 'kawarin393@gmail.com') ? 'Admin' : uProfile.role;
            setIsLoggedIn(true);
            setUserEmail(uProfile.email);
            setUserName(uProfile.name);
            setUserRole(finalRole);
            localStorage.setItem('arabic_corpus_logged_in', 'true');
            localStorage.setItem('arabic_corpus_user_role', finalRole);
            localStorage.setItem('arabic_corpus_user_name', uProfile.name);
            localStorage.setItem('arabic_corpus_user_email', uProfile.email);
            
            if (email === 'kawarin393@gmail.com' && uProfile.role !== 'Admin') {
              await updateUserInFirestore({ ...uProfile, role: 'Admin' });
            }
          } else {
            const roleName: 'Peneliti' | 'Peserta' | 'Admin' = (email.includes('admin') || email === 'kawarin393@gmail.com') ? 'Admin' : (email.includes('peneliti') ? 'Peneliti' : 'Peserta');
            const defaultName = firebaseUser.displayName || email.split('@')[0];
            const newUser: CorpusUser = {
              id: email,
              name: defaultName,
              email: email,
              role: roleName,
              joinedDate: new Date().toISOString().split('T')[0]
            };
            await saveUserToFirestore(newUser);
            setIsLoggedIn(true);
            setUserEmail(newUser.email);
            setUserName(newUser.name);
            setUserRole(newUser.role);
            localStorage.setItem('arabic_corpus_logged_in', 'true');
            localStorage.setItem('arabic_corpus_user_role', newUser.role);
            localStorage.setItem('arabic_corpus_user_name', newUser.name);
            localStorage.setItem('arabic_corpus_user_email', newUser.email);
            setUsers(prev => {
              if (!prev.some(u => u.id === newUser.id)) {
                return [newUser, ...prev];
              }
              return prev;
            });
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
        }
      } else {
        const wasLoggedIn = localStorage.getItem('arabic_corpus_logged_in') === 'true';
        if (wasLoggedIn) {
          setIsLoggedIn(false);
          localStorage.removeItem('arabic_corpus_logged_in');
          localStorage.removeItem('arabic_corpus_user_role');
          localStorage.removeItem('arabic_corpus_user_name');
          localStorage.removeItem('arabic_corpus_user_email');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Auth State (Mock Researcher Account)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('arabic_corpus_logged_in') === 'true';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('arabic_corpus_user_email') || 'peneliti@korpus.id';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('arabic_corpus_user_name') || 'Dr. Ahmad Hasyim';
  });
  const [userRole, setUserRole] = useState<'Peneliti' | 'Peserta' | 'Admin'>(() => {
    const email = localStorage.getItem('arabic_corpus_user_email') || '';
    if (email.toLowerCase() === 'kawarin393@gmail.com') return 'Admin';
    return (localStorage.getItem('arabic_corpus_user_role') as any) || 'Peneliti';
  });
  const [loginError, setLoginError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginRole, setLoginRole] = useState<'peserta' | 'admin'>('peserta');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Registration states
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Gallery Add Form states
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryDesc, setNewGalleryDesc] = useState('');
  const [newGalleryImage, setNewGalleryImage] = useState('');
  const [gallerySuccess, setGallerySuccess] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [showAddGallery, setShowAddGallery] = useState(false);

  // Editing state for news & corpus
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingCorpusDoc, setEditingCorpusDoc] = useState<Article | null>(null);

  // Deletion and Confirmation states (safely bypass browser confirm() sandbox blocks)
  const [deletingGalleryId, setDeletingGalleryId] = useState<number | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [deletingCorpusDocId, setDeletingCorpusDocId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showFirestoreExplorerModal, setShowFirestoreExplorerModal] = useState(false);
  const [isResettingCorpus, setIsResettingCorpus] = useState(false);

  // Computed permission helper
  const hasWriteAccess = isLoggedIn && (userRole === 'Admin' || userRole === 'Peneliti');

  const handleUpdateArticle = async (updatedArt: Article) => {
    try {
      const isCorpusDoc = corpusDocs.some(doc => doc.id === updatedArt.id);
      if (isCorpusDoc) {
        await updateCorpusDocInFirestore(updatedArt);
        setCorpusDocs(corpusDocs.map(doc => doc.id === updatedArt.id ? updatedArt : doc));
      } else {
        await updateArticleInFirestore(updatedArt);
        setArticles(articles.map(art => art.id === updatedArt.id ? updatedArt : art));
      }
    } catch (error) {
      console.error('Error updating article/corpus document:', error);
      alert('Gagal memperbarui dokumen di Firestore.');
    }
  };

  // Search KWIC (Keyword in Context) States
  const [kwicQuery, setKwicQuery] = useState('علم');
  const [kwicExact, setKwicExact] = useState(false);
  const [kwicIgnoreHarakat, setKwicIgnoreHarakat] = useState(true);
  const [kwicWindowSize, setKwicWindowSize] = useState(5);
  const [kwicResults, setKwicResults] = useState<ConcordanceResult[]>([]);
  const [hasSearchedKwic, setHasSearchedKwic] = useState(false);

  // Frequency Analysis States
  const [freqIgnoreHarakat, setFreqIgnoreHarakat] = useState(true);
  const [freqRemoveStopwords, setFreqRemoveStopwords] = useState(true);
  const [freqSearchFilter, setFreqSearchFilter] = useState('');
  const [freqPage, setFreqPage] = useState(1);
  const freqPerPage = 10;

  // Ngram States
  const [ngramN, setNgramN] = useState<2 | 3>(2);
  const [ngramRemoveStopwords, setNgramRemoveStopwords] = useState(true);

  // Collocation States
  const [collocationQuery, setCollocationQuery] = useState('الله');
  const [collocationIgnoreHarakat, setCollocationIgnoreHarakat] = useState(true);
  const [collocationWindowSize, setCollocationWindowSize] = useState(3);
  const [collocationResults, setCollocationResults] = useState<CollocationItem[]>([]);
  const [hasSearchedCollocation, setHasSearchedCollocation] = useState(false);

  // Read Article Modal/Drawer State
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [clickedWord, setClickedWord] = useState<{ word: string; cleanWord: string; freq: number; rank: number } | null>(null);

  // Add Article Form States (News & Corpus)
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('Lain-lain');
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newDocumentUrl, setNewDocumentUrl] = useState('');
  const [newSpreadsheetUrl, setNewSpreadsheetUrl] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newMorfologiUrl, setNewMorfologiUrl] = useState('');
  const [newSintaksisUrl, setNewSintaksisUrl] = useState('');
  const [newSemantikUrl, setNewSemantikUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Lightbox for Gallery
  const [activeGalleryItem, setActiveGalleryItem] = useState<number | null>(null);

  // Trigger initial KWIC search
  useEffect(() => {
    handleKwicSearch();
    handleCollocationSearch();
  }, [corpusDocs]);

  // Redirect non-admin users from the 'pengguna' (Database) tab
  useEffect(() => {
    if (currentTab === 'pengguna' && !(isLoggedIn && userRole === 'Admin')) {
      setCurrentTab('beranda');
    }
  }, [currentTab, isLoggedIn, userRole]);

  // Compute Corpus-wide stats dynamically
  const corpusStats = computeCorpusStats(corpusDocs);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setLoginError('Harap masukkan email.');
      return;
    }
    if (!passwordInput.trim()) {
      setLoginError('Harap masukkan kata sandi Anda.');
      return;
    }

    setLoginError('');
    setIsDatabaseLoading(true);

    try {
      const email = emailInput.trim().toLowerCase();
      const password = passwordInput.trim();

      if (auth) {
        let userCredential;
        let isFallbackAuth = false;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (signInErr: any) {
          if (signInErr.code === 'auth/operation-not-allowed' || signInErr.message?.includes('operation-not-allowed')) {
            console.warn("Email/Password Auth is disabled in Firebase Console. Falling back to secure Firestore-only authentication.");
            isFallbackAuth = true;
          } else if (
            (email === 'peneliti@korpus.id' && password === 'sandi-korpus') ||
            (email === 'admin@korpus.id' && password === 'sandi-admin')
          ) {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (signUpErr: any) {
              if (signUpErr.code === 'auth/operation-not-allowed' || signUpErr.message?.includes('operation-not-allowed')) {
                console.warn("Email/Password Auth is disabled in Firebase Console. Falling back to secure Firestore-only authentication.");
                isFallbackAuth = true;
              } else {
                throw signInErr;
              }
            }
          } else {
            throw signInErr;
          }
        }

        let loggedUser: CorpusUser;
        if (isFallbackAuth) {
          const uProfile = (await getUserFromFirestore(email)) || users.find(u => u.email.toLowerCase() === email);
          if (uProfile) {
            const expectedPassword = uProfile.password || (email === 'peneliti@korpus.id' ? 'sandi-korpus' : (email === 'admin@korpus.id' ? 'sandi-admin' : '123456'));
            if (password !== expectedPassword) {
              throw new Error('Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.');
            }
            loggedUser = {
              ...uProfile,
              role: email === 'kawarin393@gmail.com' ? 'Admin' : uProfile.role
            };
          } else {
            const isDefaultPeneliti = email === 'peneliti@korpus.id' && password === 'sandi-korpus';
            const isDefaultAdmin = (email === 'admin@korpus.id' && password === 'sandi-admin') || (email === 'kawarin393@gmail.com' && password === 'sandi-admin');
            
            if (!isDefaultPeneliti && !isDefaultAdmin) {
              throw new Error('Akun belum terdaftar atau kata sandi Anda salah. Silakan lakukan pendaftaran terlebih dahulu.');
            }

            const roleName = isDefaultPeneliti ? 'Peneliti' : 'Admin';
            const defaultName = email === 'kawarin393@gmail.com' ? 'Owner / Admin' : (isDefaultPeneliti ? 'Dr. Ahmad Hasyim' : 'Administrator Utama');

            loggedUser = {
              id: email,
              name: defaultName,
              email: email,
              role: roleName,
              joinedDate: new Date().toISOString().split('T')[0],
              password: password
            };
            await saveUserToFirestore(loggedUser);
          }
        } else {
          const uProfile = (await getUserFromFirestore(email)) || users.find(u => u.email.toLowerCase() === email);
          if (uProfile) {
            loggedUser = uProfile;
          } else {
            const isDefaultPeneliti = email === 'peneliti@korpus.id';
            const isDefaultAdmin = email === 'admin@korpus.id' || loginRole === 'admin';
            const roleName = isDefaultPeneliti ? 'Peneliti' : (isDefaultAdmin ? 'Admin' : 'Peserta');
            const defaultName = isDefaultPeneliti ? 'Dr. Ahmad Hasyim' : (isDefaultAdmin ? 'Administrator Utama' : 'Peserta Utama');

            loggedUser = {
              id: email,
              name: defaultName,
              email: email,
              role: roleName,
              joinedDate: new Date().toISOString().split('T')[0],
              password: password
            };
            await saveUserToFirestore(loggedUser);
          }
        }

        setIsLoggedIn(true);
        setUserRole(loggedUser.role);
        setUserName(loggedUser.name);
        setUserEmail(loggedUser.email);

        localStorage.setItem('arabic_corpus_logged_in', 'true');
        localStorage.setItem('arabic_corpus_user_role', loggedUser.role);
        localStorage.setItem('arabic_corpus_user_name', loggedUser.name);
        localStorage.setItem('arabic_corpus_user_email', loggedUser.email);

        setUsers(prev => {
          if (!prev.some(u => u.id === loggedUser.id)) {
            return [loggedUser, ...prev];
          }
          return prev;
        });

      } else {
        const uProfile = (await getUserFromFirestore(email)) || users.find(u => u.email.toLowerCase() === email);
        let loggedUser: CorpusUser;

        if (uProfile) {
          const expectedPassword = uProfile.password || (email === 'peneliti@korpus.id' ? 'sandi-korpus' : (email === 'admin@korpus.id' ? 'sandi-admin' : '123456'));
          if (password !== expectedPassword) {
            throw new Error('Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.');
          }
          loggedUser = uProfile;
        } else {
          if (email === 'peneliti@korpus.id' && password === 'sandi-korpus') {
            loggedUser = {
              id: 'peneliti@korpus.id',
              name: 'Dr. Ahmad Hasyim',
              email: 'peneliti@korpus.id',
              role: 'Peneliti',
              joinedDate: '2025-01-10',
              password: 'sandi-korpus'
            };
          } else if ((email === 'admin@korpus.id' && password === 'sandi-admin') || (email === 'kawarin393@gmail.com' && password === 'sandi-admin')) {
            loggedUser = {
              id: email,
              name: email === 'kawarin393@gmail.com' ? 'Owner / Admin' : 'Administrator Utama',
              email: email,
              role: 'Admin',
              joinedDate: '2025-01-15',
              password: 'sandi-admin'
            };
          } else {
            throw new Error('Akun belum terdaftar atau kata sandi Anda salah. Silakan lakukan pendaftaran terlebih dahulu.');
          }
          await saveUserToFirestore(loggedUser);
        }

        setIsLoggedIn(true);
        setUserRole(loggedUser.role);
        setUserName(loggedUser.name);
        setUserEmail(loggedUser.email);
        localStorage.setItem('arabic_corpus_logged_in', 'true');
        localStorage.setItem('arabic_corpus_user_role', loggedUser.role);
        localStorage.setItem('arabic_corpus_user_name', loggedUser.name);
        localStorage.setItem('arabic_corpus_user_email', loggedUser.email);

        setUsers(prev => {
          if (!prev.some(u => u.id === loggedUser.id)) {
            return [loggedUser, ...prev];
          }
          return prev;
        });
      }

      setLoginError('');
      setEmailInput('');
      setPasswordInput('');
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (error: any) {
      console.error('Firebase Login Error:', error);
      let errMsg = 'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errMsg = 'Kata sandi atau email yang Anda masukkan salah.';
      } else if (error.code === 'auth/user-not-found') {
        errMsg = 'Email belum terdaftar. Silakan lakukan pendaftaran terlebih dahulu.';
      } else if (error.code === 'auth/invalid-email') {
        errMsg = 'Format email tidak valid.';
      } else if (error.message) {
        errMsg = error.message;
      }
      setLoginError(errMsg);
    } finally {
      setIsDatabaseLoading(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Error signing out from Firebase Auth:', err);
      }
    }
    setIsLoggedIn(false);
    localStorage.removeItem('arabic_corpus_logged_in');
    localStorage.removeItem('arabic_corpus_user_role');
    localStorage.removeItem('arabic_corpus_user_name');
    localStorage.removeItem('arabic_corpus_user_email');
  };

  // Handle Register Submit - Generates and sends OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim()) {
      setRegisterError('Harap masukkan nama lengkap Anda.');
      return;
    }
    if (!registerEmail.trim()) {
      setRegisterError('Harap masukkan alamat email.');
      return;
    }
    if (!registerPassword.trim()) {
      setRegisterError('Harap masukkan kata sandi.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setRegisterError('');
    setIsDatabaseLoading(true);

    try {
      const email = registerEmail.trim().toLowerCase();
      const name = registerName.trim();

      // Generate a secure 6-digit random code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Attempt to send via EmailJS
      setIsSendingEmail(true);
      await sendOtpEmail({ email, name, otpCode: otp });
      setIsSendingEmail(false);

      setRegisteredEmail(email);
      setRegistrationSuccess(true);
    } catch (error: any) {
      console.error('Registration OTP Send Error:', error);
      setRegisterError('Gagal memproses pendaftaran. Silakan coba kembali.');
    } finally {
      setIsDatabaseLoading(false);
    }
  };

  // Resend OTP Code
  const resendOtp = async () => {
    if (!registerEmail.trim()) return;
    const email = registerEmail.trim().toLowerCase();
    const name = registerName.trim();

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);

    setIsSendingEmail(true);
    const result = await sendOtpEmail({ email, name, otpCode: newOtp });
    setIsSendingEmail(false);

    if (!result.success && result.error && result.error !== 'EmailJS belum dikonfigurasi.') {
      throw new Error(`EmailJS Error: ${result.error}`);
    }
  };

  // Verify OTP and create user account in Firebase & Firestore
  const handleVerifyOtp = async (inputOtp: string) => {
    if (inputOtp !== generatedOtp) {
      throw new Error('Kode OTP yang Anda masukkan salah atau tidak cocok.');
    }

    setIsDatabaseLoading(true);
    try {
      const email = registerEmail.trim().toLowerCase();
      const password = registerPassword.trim();
      const name = registerName.trim();

      if (auth) {
        // Create user in Firebase Authentication
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (regErr: any) {
          if (regErr.code === 'auth/operation-not-allowed' || regErr.message?.includes('operation-not-allowed')) {
            console.warn("Email/Password Auth is disabled in Firebase Console. Proceeding with Firestore registration.");
          } else if (regErr.code === 'auth/email-already-in-use') {
            console.log("User already exists in Auth. Linking Firestore profile.");
          } else {
            throw regErr;
          }
        }

        // Save user profile to Firestore
        const registeredUser: CorpusUser = {
          id: email,
          name: name,
          email: email,
          role: email === 'kawarin393@gmail.com' ? 'Admin' : 'Peserta',
          joinedDate: new Date().toISOString().split('T')[0],
          password: password
        };
        await saveUserToFirestore(registeredUser);

        setUsers(prev => {
          if (!prev.some(u => u.id === registeredUser.id)) {
            return [registeredUser, ...prev];
          }
          return prev;
        });

        // Automatically log in verified participant
        setIsLoggedIn(true);
        setUserRole('Peserta');
        setUserName(name);
        setUserEmail(email);

        localStorage.setItem('arabic_corpus_logged_in', 'true');
        localStorage.setItem('arabic_corpus_user_role', 'Peserta');
        localStorage.setItem('arabic_corpus_user_name', name);
        localStorage.setItem('arabic_corpus_user_email', email);
      } else {
        // Local mode fallback
        const registeredUser: CorpusUser = {
          id: email,
          name: name,
          email: email,
          role: 'Peserta',
          joinedDate: new Date().toISOString().split('T')[0],
          password: password
        };

        setIsLoggedIn(true);
        setUserRole('Peserta');
        setUserName(name);
        setUserEmail(email);

        localStorage.setItem('arabic_corpus_logged_in', 'true');
        localStorage.setItem('arabic_corpus_user_role', 'Peserta');
        localStorage.setItem('arabic_corpus_user_name', name);
        localStorage.setItem('arabic_corpus_user_email', email);
      }

      // Reset registration states on success
      setIsRegistering(false);
      setRegistrationSuccess(false);
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setRegisteredEmail('');
      setGeneratedOtp('');
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      let errMsg = 'Gagal melakukan verifikasi. Silakan coba kembali.';
      if (error.code === 'auth/email-already-in-use') {
        errMsg = 'Alamat email ini sudah terdaftar.';
      } else if (error.code === 'auth/weak-password') {
        errMsg = 'Kata sandi harus minimal 6 karakter.';
      } else if (error.message) {
        errMsg = error.message;
      }
      throw new Error(errMsg);
    } finally {
      setIsDatabaseLoading(false);
    }
  };

  // Simulated Email Link Confirmation (Keep legacy support if referenced elsewhere)
  const handleSimulatedConfirmation = () => {
    handleVerifyOtp(generatedOtp).catch(console.error);
  };

  // Perform KWIC Search across all Corpus Documents & Articles
  const handleKwicSearch = async () => {
    if (!kwicQuery.trim()) return;
    const allDocsMap = new Map<string, Article>();
    corpusDocs.forEach(d => allDocsMap.set(d.id, { ...d }));
    articles.forEach(a => allDocsMap.set(a.id, { ...a }));
    const allDocs = Array.from(allDocsMap.values());

    // Extract real Word / Document text for all documents that have documentUrl
    await Promise.all(allDocs.map(async (doc) => {
      const targetUrl = doc.documentUrl || doc.spreadsheetUrl || doc.morfologiUrl || '';
      if (targetUrl) {
        const extracted = await extractTextFromDocUrl(targetUrl, doc.content);
        if (extracted && extracted.trim()) {
          doc.content = extracted.trim();
        }
      }
    }));

    const results = findConcordance(allDocs, kwicQuery, {
      exactMatch: kwicExact,
      ignoreHarakat: kwicIgnoreHarakat,
      windowSize: kwicWindowSize
    });
    setKwicResults(results);
    setHasSearchedKwic(true);
  };

  // Perform Collocation Search
  const handleCollocationSearch = async () => {
    if (!collocationQuery.trim()) return;
    const allDocsMap = new Map<string, Article>();
    corpusDocs.forEach(d => allDocsMap.set(d.id, { ...d }));
    const allCorpusDocs = Array.from(allDocsMap.values());

    await Promise.all(allCorpusDocs.map(async (doc) => {
      const targetUrl = doc.documentUrl || doc.spreadsheetUrl || doc.morfologiUrl || '';
      if (targetUrl) {
        const extracted = await extractTextFromDocUrl(targetUrl, doc.content);
        if (extracted && extracted.trim()) {
          doc.content = extracted.trim();
        }
      }
    }));

    const results = getCollocations(allCorpusDocs, collocationQuery, {
      ignoreHarakat: collocationIgnoreHarakat,
      windowSize: collocationWindowSize
    });
    setCollocationResults(results);
    setHasSearchedCollocation(true);
  };

  // Delete article (Researcher Mode only)
  const handleDeleteArticle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasWriteAccess) return;
    setDeletingArticleId(id);
  };

  const confirmDeleteArticle = async (id: string) => {
    try {
      const isCorpusDoc = corpusDocs.some(doc => doc.id === id);
      if (isCorpusDoc) {
        await deleteCorpusDocFromFirestore(id);
        setCorpusDocs(corpusDocs.filter(doc => doc.id !== id));
      } else {
        await deleteArticleFromFirestore(id);
        setArticles(articles.filter(art => art.id !== id));
      }
      if (selectedArticleId === id) {
        setSelectedArticleId(null);
      }
      setDeletingArticleId(null);
    } catch (error) {
      console.error('Error deleting article/corpus document:', error);
      alert('Gagal menghapus dokumen dari Firestore.');
    }
  };

  // Reset Database to Defaults
  const confirmResetCorpus = async () => {
    try {
      setIsDatabaseLoading(true);
      // Delete all current articles
      for (const art of articles) {
        await deleteArticleFromFirestore(art.id);
      }
      // Delete all current corpusDocs
      for (const doc of corpusDocs) {
        await deleteCorpusDocFromFirestore(doc.id);
      }
      
      // Save the default articles
      const defaultArts = getInitializedArticles();
      for (const art of defaultArts) {
        await saveArticleToFirestore(art);
      }
      
      // Save the default corpus docs
      const defaultDocs = getInitializedCorpusDocs();
      for (const doc of defaultDocs) {
        await saveCorpusDocToFirestore(doc);
      }

      setArticles(defaultArts);
      setCorpusDocs(defaultDocs);
      setSelectedArticleId(null);
      setIsResettingCorpus(false);
    } catch (error) {
      console.error('Error resetting database:', error);
    } finally {
      setIsDatabaseLoading(false);
    }
  };

  // Delete gallery item
  const handleDeleteGalleryItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasWriteAccess) return;
    setDeletingGalleryId(id);
  };

  const confirmDeleteGalleryItem = async (id: number) => {
    try {
      await deleteGalleryFromFirestore(id);
      setGalleryItems(galleryItems.filter(item => item.id !== id));
      setDeletingGalleryId(null);
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      alert('Gagal menghapus gambar dari Firestore.');
    }
  };

  // Add gallery item
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasWriteAccess) return;
    if (!newGalleryTitle.trim() || !newGalleryDesc.trim() || !newGalleryImage.trim()) {
      setGalleryError('Semua kolom wajib diisi.');
      return;
    }

    const newItem = {
      id: Date.now(),
      title: newGalleryTitle.trim(),
      desc: newGalleryDesc.trim(),
      image: newGalleryImage.trim()
    };

    try {
      await saveGalleryToFirestore(newItem);
      setGalleryItems([newItem, ...galleryItems]);
      setNewGalleryTitle('');
      setNewGalleryDesc('');
      setNewGalleryImage('');
      setGalleryError('');
      setGallerySuccess(true);
      setShowAddGallery(false);
      setTimeout(() => setGallerySuccess(false), 4000);
    } catch (error) {
      console.error('Error adding gallery item:', error);
      setGalleryError('Gagal menyimpan gambar ke Firestore.');
    }
  };

  // Update gallery item
  const handleUpdateGalleryItem = async (updatedItem: GalleryItem) => {
    try {
      await saveGalleryToFirestore(updatedItem);
      setGalleryItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    } catch (error) {
      console.error('Error updating gallery item:', error);
      alert('Gagal memperbarui gambar di database.');
    }
  };

  // Edit article submission (News & Corpus completely separated)
  const handleEditArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasWriteAccess || !editingArticle) return;

    const isCorpusDoc = corpusDocs.some(doc => doc.id === editingArticle.id) || currentTab === 'korpus';

    if (isCorpusDoc) {
      if (!editingArticle.title.trim() || !editingArticle.author.trim()) {
        alert('Judul Dokumen Korpus dan Penulis wajib diisi.');
        return;
      }
      if (!editingArticle.documentUrl?.trim()) {
        alert('Tautan Dokumen PDF wajib diisi.');
        return;
      }

      let finalContent = editingArticle.content?.trim() || '';
      if (!finalContent) {
        const titleWords = editingArticle.title.trim().split(/\s+/).filter(Boolean);
        if (titleWords.length >= 5) {
          finalContent = editingArticle.title.trim();
        } else {
          finalContent = Array(5).fill(editingArticle.title.trim()).join(' ');
        }
      }

      const wordsCount = finalContent.split(/\s+/).filter(Boolean).length;

      const updatedDoc: Article = {
        ...editingArticle,
        title: editingArticle.title.trim(),
        author: editingArticle.author.trim(),
        category: editingArticle.category || 'Lain-lain',
        content: finalContent,
        wordCount: wordsCount,
        documentUrl: editingArticle.documentUrl.trim(),
        spreadsheetUrl: editingArticle.spreadsheetUrl?.trim() || '',
        sourceUrl: editingArticle.sourceUrl?.trim() || '',
        morfologiUrl: editingArticle.morfologiUrl?.trim() || '',
        sintaksisUrl: editingArticle.sintaksisUrl?.trim() || '',
        semantikUrl: editingArticle.semantikUrl?.trim() || ''
      };

      try {
        await updateCorpusDocInFirestore(updatedDoc);
        setCorpusDocs(corpusDocs.map(doc => doc.id === editingArticle.id ? updatedDoc : doc));
        setEditingArticle(null);
      } catch (error) {
        console.error('Error updating corpus document:', error);
        alert('Gagal memperbarui dokumen korpus di Firestore.');
      }
    } else {
      if (!editingArticle.title.trim() || !editingArticle.author.trim() || !editingArticle.content?.trim()) {
        alert('Judul Berita, Penulis, dan Isi Lengkap Berita wajib diisi.');
        return;
      }

      const wordsCount = editingArticle.content.trim().split(/\s+/).filter(Boolean).length;

      const updatedArt: Article = {
        ...editingArticle,
        title: editingArticle.title.trim(),
        author: editingArticle.author.trim(),
        category: editingArticle.category || 'Lain-lain',
        content: editingArticle.content.trim(),
        image: editingArticle.image?.trim() || '',
        summary: editingArticle.summary?.trim() || '',
        wordCount: wordsCount
      };

      try {
        await updateArticleInFirestore(updatedArt);
        setArticles(articles.map(art => art.id === editingArticle.id ? updatedArt : art));
        setEditingArticle(null);
      } catch (error) {
        console.error('Error updating article:', error);
        alert('Gagal memperbarui berita di Firestore.');
      }
    }
  };

  // Handle Add Article Form Submission (News & Corpus)
  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalContent = newContent.trim();
    if (newDocumentUrl.trim()) {
      try {
        const extracted = await extractTextFromDocUrl(newDocumentUrl.trim(), finalContent);
        if (extracted && extracted.trim()) {
          finalContent = extracted.trim();
        }
      } catch (err) {
        console.warn("Failed to extract doc text on submit:", err);
      }
    }

    if (currentTab === 'korpus' && !finalContent) {
      // If user hasn't uploaded a DOC/Word text or entered raw text, fallback to repeating title
      const titleWords = newTitle.trim().split(/\s+/).filter(Boolean);
      if (titleWords.length >= 5) {
        finalContent = newTitle.trim();
      } else {
        finalContent = Array(5).fill(newTitle.trim()).join(' ');
      }
    }

    if (!newTitle.trim() || !newAuthor.trim() || !finalContent) {
      setFormError('Semua kolom bertanda bintang wajib diisi.');
      return;
    }

    if (currentTab === 'korpus' && !newDocumentUrl.trim()) {
      setFormError('Tautan Dokumen PDF (Google Drive/Eksternal) wajib diisi.');
      return;
    }

    const newWordsCount = finalContent.split(/\s+/).filter(Boolean).length;
    if (newWordsCount < 5) {
      setFormError('Isi artikel terlalu pendek (minimal 5 kata).');
      return;
    }

    const fallbackImages = [
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
    ];
    const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

    const newArt: Article = {
      id: `art-${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      category: newCategory,
      date: new Date().toISOString().split('T')[0],
      wordCount: newWordsCount,
      content: finalContent,
      image: newImage.trim() || randomFallback,
      summary: newSummary.trim() || 'Artikel ilmiah bahasa Arab baru mengenai kajian kebahasaan dan linguistik di lingkungan universitas.',
      documentUrl: newDocumentUrl.trim() || '',
      spreadsheetUrl: newSpreadsheetUrl.trim() || '',
      sourceUrl: newSourceUrl.trim() || '',
      morfologiUrl: newMorfologiUrl.trim() || '',
      sintaksisUrl: newSintaksisUrl.trim() || '',
      semantikUrl: newSemantikUrl.trim() || ''
    };

    try {
      if (currentTab === 'korpus') {
        await saveCorpusDocToFirestore(newArt);
        setCorpusDocs([newArt, ...corpusDocs]);
      } else {
        await saveArticleToFirestore(newArt);
        setArticles([newArt, ...articles]);
      }
      setNewTitle('');
      setNewAuthor('');
      setNewCategory('Lain-lain');
      setNewContent('');
      setNewImage('');
      setNewSummary('');
      setNewDocumentUrl('');
      setNewSpreadsheetUrl('');
      setNewSourceUrl('');
      setNewMorfologiUrl('');
      setNewSintaksisUrl('');
      setNewSemantikUrl('');
      setFormError('');
      setFormSuccess(true);
      setShowAddNews(false);
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding article/document:', error);
      setFormError('Gagal menyimpan dokumen ke Firestore.');
    }
  };

  // Add User action
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserFormName.trim() || !newUserFormEmail.trim()) {
      setNewUserFormError('Nama dan Email wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserFormEmail.trim())) {
      setNewUserFormError('Format email tidak valid.');
      return;
    }

    const pass = newUserFormPassword.trim() || 'sandi-korpus';

    const newUser: CorpusUser = {
      id: newUserFormEmail.trim().toLowerCase(),
      name: newUserFormName.trim(),
      email: newUserFormEmail.trim().toLowerCase(),
      role: newUserFormRole,
      joinedDate: new Date().toISOString().split('T')[0],
      password: pass
    };

    try {
      await saveUserToFirestore(newUser);
      setUsers(prev => [newUser, ...prev]);
      setShowAddUserModal(false);
      setNewUserFormName('');
      setNewUserFormEmail('');
      setNewUserFormPassword('');
      setNewUserFormRole('Peserta');
      setNewUserFormError('');
    } catch (err) {
      console.error(err);
      setNewUserFormError('Gagal menyimpan pengguna baru ke database.');
    }
  };

  // Update User action
  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim()) {
      alert('Nama wajib diisi.');
      return;
    }

    try {
      await updateUserInFirestore(editingUser);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui pengguna.');
    }
  };

  // Delete User action
  const handleDeleteUser = (id: string) => {
    setDeletingUserId(id);
  };

  const confirmDeleteUser = async (id: string) => {
    try {
      await deleteUserFromFirestore(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeletingUserId(null);
    } catch (err) {
      console.error(err);
      setDeletingUserId(null);
    }
  };

  // Compute active frequency list based on filters
  const frequencyList = generateFrequencyList(corpusDocs, {
    ignoreHarakat: freqIgnoreHarakat,
    removeStopwords: freqRemoveStopwords,
    searchFilter: freqSearchFilter
  });

  const totalFreqPages = Math.ceil(frequencyList.length / freqPerPage);
  const displayedFrequencyList = frequencyList.slice(
    (freqPage - 1) * freqPerPage,
    freqPage * freqPerPage
  );

  // Compute active N-gram list
  const ngramList = generateNgramList(corpusDocs, ngramN, {
    ignoreHarakat: true,
    removeStopwords: ngramRemoveStopwords
  }).slice(0, 15);

  const [quickSyncStatus, setQuickSyncStatus] = useState<string | null>(null);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);

  const handleManualSeedFirestore = async () => {
    setIsQuickSyncing(true);
    setQuickSyncStatus(null);
    try {
      const res = await seedAllDataToFirestore(
        articles,
        corpusDocs,
        galleryItems,
        genres,
        users
      );
      if (res.error) {
        setQuickSyncStatus(`⚠️ Error: ${res.error}`);
      } else {
        setQuickSyncStatus(`✅ Berhasil! ${res.count} data dikirim ke Firebase Firestore (articles, corpus_docs, gallery, genres, users).`);
      }
      return res;
    } catch (e: any) {
      setQuickSyncStatus(`⚠️ Gagal: ${e?.message || 'Error'}`);
      return { count: 0, error: e?.message };
    } finally {
      setIsQuickSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-teal-600/10 selection:text-teal-800 text-slate-800 font-sans">
      
      {/* HEADER SECTION - Brand & Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Area - Custom ArabNet Corpus Logo & Name */}
            <div className="flex items-center gap-2.5 cursor-pointer" id="logo-container" onClick={() => setCurrentTab('beranda')}>
              <div className="w-10 h-10 bg-[#056a3e] rounded-full text-white shadow-sm flex items-center justify-center">
                <CustomBookLogo className="w-5.5 h-5.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  ArabNet <span className="text-[#056a3e]">Corpus</span>
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1" id="main-nav">
              {[
                { id: 'beranda', label: 'Beranda' },
                { id: 'berita', label: 'Berita' },
                { id: 'korpus', label: 'Korpus' },
                { id: 'galeri', label: 'Galeri' },
                ...(isLoggedIn && userRole === 'Admin' ? [{ id: 'pengguna', label: 'Database' }] : []),
                { id: 'tentang', label: 'Tentang' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`nav-${tab.id}`}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`px-2.5 lg:px-4 py-2 text-xs lg:text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'border-[#056a3e] text-[#056a3e]'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {/* Login Button */}
              <button
                id="nav-login"
                onClick={() => setCurrentTab('login')}
                className={`ml-1.5 lg:ml-3 px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  currentTab === 'login'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : isLoggedIn
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-xs'
                }`}
              >
                {isLoggedIn ? (
                  <>
                    <Award className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-600" />
                    <span>{userRole}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </nav>

            {/* Mobile Nav Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-3xs flex items-center justify-center transition-all cursor-pointer focus:outline-none"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-teal-700" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE NAV DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 md:hidden"
            />

            {/* Mobile Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col md:hidden border-l border-slate-100"
            >
              {/* Header inside drawer */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#056a3e] rounded-full text-white shadow-sm flex items-center justify-center">
                    <CustomBookLogo className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-sans font-black text-lg tracking-tight text-slate-950">
                    ArabNet <span className="text-[#056a3e]">Corpus</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation links inside drawer */}
              <div className="flex-grow overflow-y-auto py-5 px-4 space-y-1.5">
                {[
                  { id: 'beranda', label: 'Beranda' },
                  { id: 'berita', label: 'Berita' },
                  { id: 'korpus', label: 'Korpus' },
                  { id: 'galeri', label: 'Galeri' },
                  ...(isLoggedIn && userRole === 'Admin' ? [{ id: 'pengguna', label: 'Database' }] : []),
                  { id: 'tentang', label: 'Tentang' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentTab(tab.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between border ${
                      currentTab === tab.id
                        ? 'bg-teal-50 border-teal-200 text-teal-800 font-extrabold shadow-3xs'
                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{tab.label}</span>
                    </div>
                    {currentTab === tab.id && (
                      <span className="w-2 h-2 rounded-full bg-teal-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* Bottom login status area */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/80">
                <button
                  onClick={() => {
                    setCurrentTab('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border shadow-xs ${
                    currentTab === 'login'
                      ? 'bg-slate-950 text-white border-slate-950 hover:bg-slate-800'
                      : isLoggedIn
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  {isLoggedIn ? (
                    <span>Akun: {userRole}</span>
                  ) : (
                    <span>Masuk ke Akun</span>
                  )}
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT WORKSPACE */}
      <main className={`flex-grow w-full mx-auto ${
        currentTab === 'login' 
          ? 'flex flex-col justify-center items-center bg-[#ebf5f0] p-4 sm:p-6 md:p-8 min-h-[calc(100vh-5rem)]' 
          : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'
      }`}>
        {isDatabaseLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-[#056a3e]/10 text-[#056a3e] rounded-2xl flex items-center justify-center shadow-inner relative">
                <CustomBookLogo className="w-9 h-9" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#056a3e]"></span>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  ArabNet <span className="text-[#056a3e]">Corpus</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Memuat Pangkalan Data & Mesin Linguistik Korpus...
                </p>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="bg-[#056a3e] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingStep === 0 ? 30 : loadingStep === 1 ? 65 : loadingStep === 2 ? 88 : 100}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#056a3e]" />
                <span>
                  {loadingStep === 0 && 'Menghubungkan ke Pangkalan Data...'}
                  {loadingStep === 1 && 'Menyiapkan Teks & Dokumen Korpus...'}
                  {loadingStep === 2 && 'Mengecek Pengguna & Sinkronisasi Real-time...'}
                  {loadingStep === 3 && 'Siap digunakaan!'}
                </span>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* BANNER NOTIFICATION (If customized with added articles) */}
            {articles.length > getInitializedArticles().length && (
              <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-sm text-teal-800 shadow-2xs gap-3">
                {!isResettingCorpus ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-teal-600" />
                      <span>Anda sedang menggunakan korpus khusus dengan <strong>{articles.length} artikel</strong>.</span>
                    </div>
                    <button 
                      onClick={() => setIsResettingCorpus(true)}
                      className="text-xs text-teal-700 hover:text-red-600 font-semibold underline cursor-pointer self-start sm:self-auto"
                    >
                      Kembalikan ke Default
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-amber-800">
                      <Info className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>Yakin ingin mengembalikan korpus ke data awal? Semua artikel tambahan Anda akan dihapus!</span>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button 
                        onClick={confirmResetCorpus}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Ya, Reset
                      </button>
                      <button 
                        onClick={() => setIsResettingCorpus(false)}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB RENDERINGS */}
            {currentTab === 'beranda' && (
              <HomePanel 
                corpusStats={corpusStats} 
                corpusDocs={corpusDocs}
                setCurrentTab={setCurrentTab} 
                setKorpusSubTab={setKorpusSubTab} 
                kwicQuery={kwicQuery}
                setKwicQuery={setKwicQuery}
                kwicIgnoreHarakat={kwicIgnoreHarakat}
                setKwicIgnoreHarakat={setKwicIgnoreHarakat}
                handleKwicSearch={handleKwicSearch}
              />
            )}

            {currentTab === 'berita' && (
              <NewsPanel 
                articles={articles}
                hasWriteAccess={hasWriteAccess}
                genres={genres}
                onAddGenre={handleAddGenre}
                onDeleteGenre={handleDeleteGenre}
                selectedArticleId={selectedArticleId}
                setSelectedArticleId={setSelectedArticleId}
                setCurrentTab={setCurrentTab}
                setKorpusSubTab={setKorpusSubTab}
                showAddNews={showAddNews}
                setShowAddNews={setShowAddNews}
                formError={formError}
                newTitle={newTitle}
                setNewTitle={setNewTitle}
                newAuthor={newAuthor}
                setNewAuthor={setNewAuthor}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                newImage={newImage}
                setNewImage={setNewImage}
                newSummary={newSummary}
                setNewSummary={setNewSummary}
                newContent={newContent}
                setNewContent={setNewContent}
                handleAddArticle={handleAddArticle}
                deletingArticleId={deletingArticleId}
                setDeletingArticleId={setDeletingArticleId}
                confirmDeleteArticle={confirmDeleteArticle}
                handleDeleteArticle={handleDeleteArticle}
                setEditingArticle={setEditingArticle}
              />
            )}

            {currentTab === 'korpus' && (
              <CorpusPanel 
                articles={articles}
                corpusDocs={corpusDocs}
                hasWriteAccess={hasWriteAccess}
                isLoggedIn={isLoggedIn}
                userRole={userRole}
                genres={genres}
                onAddGenre={handleAddGenre}
                onDeleteGenre={handleDeleteGenre}
                selectedArticleId={selectedArticleId}
                setSelectedArticleId={setSelectedArticleId}
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                korpusSubTab={korpusSubTab}
                setKorpusSubTab={setKorpusSubTab}
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
                clickedWord={clickedWord}
                setClickedWord={setClickedWord}
                freqRemoveStopwords={freqRemoveStopwords}
                setFreqRemoveStopwords={setFreqRemoveStopwords}
                freqIgnoreHarakat={freqIgnoreHarakat}
                setFreqIgnoreHarakat={setFreqIgnoreHarakat}
                freqSearchFilter={freqSearchFilter}
                setFreqSearchFilter={setFreqSearchFilter}
                freqPage={freqPage}
                setFreqPage={setFreqPage}
                frequencyList={frequencyList}
                displayedFrequencyList={displayedFrequencyList}
                totalFreqPages={totalFreqPages}
                ngramN={ngramN}
                setNgramN={setNgramN}
                ngramRemoveStopwords={ngramRemoveStopwords}
                setNgramRemoveStopwords={setNgramRemoveStopwords}
                ngramList={ngramList}
                collocationQuery={collocationQuery}
                setCollocationQuery={setCollocationQuery}
                collocationWindowSize={collocationWindowSize}
                setCollocationWindowSize={setCollocationWindowSize}
                handleCollocationSearch={handleCollocationSearch}
                hasSearchedCollocation={hasSearchedCollocation}
                collocationResults={collocationResults}
                formError={formError}
                formSuccess={formSuccess}
                newTitle={newTitle}
                setNewTitle={setNewTitle}
                newAuthor={newAuthor}
                setNewAuthor={setNewAuthor}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                newImage={newImage}
                setNewImage={setNewImage}
                newSummary={newSummary}
                setNewSummary={setNewSummary}
                newContent={newContent}
                setNewContent={setNewContent}
                newDocumentUrl={newDocumentUrl}
                setNewDocumentUrl={setNewDocumentUrl}
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
                handleAddArticle={handleAddArticle}
                setEditingArticle={setEditingArticle}
                handleDeleteArticle={handleDeleteArticle}
                onUpdateArticle={handleUpdateArticle}
              />
            )}

            {currentTab === 'galeri' && (
              <GalleryPanel 
                galleryItems={galleryItems}
                hasWriteAccess={hasWriteAccess}
                activeGalleryItem={activeGalleryItem}
                setActiveGalleryItem={setActiveGalleryItem}
                showAddGallery={showAddGallery}
                setShowAddGallery={setShowAddGallery}
                newGalleryTitle={newGalleryTitle}
                setNewGalleryTitle={setNewGalleryTitle}
                newGalleryDesc={newGalleryDesc}
                setNewGalleryDesc={setNewGalleryDesc}
                newGalleryImage={newGalleryImage}
                setNewGalleryImage={setNewGalleryImage}
                galleryError={galleryError}
                setGalleryError={setGalleryError}
                handleAddGalleryItem={handleAddGalleryItem}
                deletingGalleryId={deletingGalleryId}
                setDeletingGalleryId={setDeletingGalleryId}
                confirmDeleteGalleryItem={confirmDeleteGalleryItem}
                handleDeleteGalleryItem={handleDeleteGalleryItem}
                onUpdateGalleryItem={handleUpdateGalleryItem}
              />
            )}

            {currentTab === 'pengguna' && isLoggedIn && userRole === 'Admin' && (
              <UsersPanel 
                users={users}
                isLoggedIn={isLoggedIn}
                userEmail={userEmail}
                userRole={userRole}
                userSearchQuery={userSearchQuery}
                setUserSearchQuery={setUserSearchQuery}
                userRoleFilter={userRoleFilter}
                setUserRoleFilter={setUserRoleFilter}
                setShowAddUserModal={setShowAddUserModal}
                setEditingUser={setEditingUser}
                handleDeleteUser={handleDeleteUser}
                onSeedFirestore={handleManualSeedFirestore}
                onOpenFirestoreExplorer={() => setShowFirestoreExplorerModal(true)}
              />
            )}

            {currentTab === 'tentang' && (
              <AboutPanel 
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              />
            )}

            {currentTab === 'login' && (
              <LoginPanel 
                isLoggedIn={isLoggedIn}
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
                loginError={loginError}
                setLoginError={setLoginError}
                emailInput={emailInput}
                setEmailInput={setEmailInput}
                passwordInput={passwordInput}
                setPasswordInput={setPasswordInput}
                loginRole={loginRole}
                setLoginRole={setLoginRole}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                handleLoginSubmit={handleLoginSubmit}
                handleLogout={handleLogout}
                isRegistering={isRegistering}
                setIsRegistering={setIsRegistering}
                registerName={registerName}
                setRegisterName={setRegisterName}
                registerEmail={registerEmail}
                setRegisterEmail={setRegisterEmail}
                registerPassword={registerPassword}
                setRegisterPassword={setRegisterPassword}
                registerConfirmPassword={registerConfirmPassword}
                setRegisterConfirmPassword={setRegisterConfirmPassword}
                registerError={registerError}
                setRegisterError={setRegisterError}
                registrationSuccess={registrationSuccess}
                setRegistrationSuccess={setRegistrationSuccess}
                registeredEmail={registeredEmail}
                handleRegisterSubmit={handleRegisterSubmit}
                handleSimulatedConfirmation={handleSimulatedConfirmation}
                setCurrentTab={setCurrentTab}
                setKorpusSubTab={setKorpusSubTab}
                generatedOtp={generatedOtp}
                handleVerifyOtp={handleVerifyOtp}
                isSendingEmail={isSendingEmail}
                resendOtp={resendOtp}
              />
            )}
          </>
        )}
      </main>

      {/* EDITING ARTICLE / CORPUS DOC MODAL */}
      {editingArticle && (() => {
        const isEditingCorpusDoc = corpusDocs.some(doc => doc.id === editingArticle.id) || currentTab === 'korpus';

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100 space-y-6">
              <button
                onClick={() => setEditingArticle(null)}
                className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {isEditingCorpusDoc ? (
                /* FORM EDIT DOKUMEN KORPUS (KHUSUS KORPUS) */
                <>
                  <div className="border-b border-slate-100 pb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 text-[#056a3e] rounded-lg text-[10px] font-bold uppercase tracking-wider mb-1">
                      <BookMarked className="w-3.5 h-3.5" />
                      <span>Mode Edit Admin</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Ubah Dokumen Korpus</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Perbarui data dokumen, tautan berkas PDF/Word, serta spreadsheet analisis linguistik.
                    </p>
                  </div>

                  <form onSubmit={handleEditArticleSubmit} className="space-y-4">
                    
                    {/* 1. INFORMASI UTAMA DOKUMEN */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-[#056a3e]" />
                        <span>1. Informasi Utama Dokumen</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">Judul Dokumen <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={editingArticle.title}
                            onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/20"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">Penulis / Peneliti <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={editingArticle.author}
                            onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/20"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">Genre / Kategori <span className="text-red-500">*</span></label>
                          <select
                            value={editingArticle.category}
                            onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#056a3e] cursor-pointer"
                          >
                            {genres.map((g) => (
                              <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 2. BERKAS UTAMA DOKUMEN / PDF */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-[#056a3e]" />
                          <span>2. Berkas Utama Dokumen / PDF <span className="text-red-500">*</span></span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">PDF, Word (.docx), atau Link Drive</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-8 space-y-2">
                          <label className="w-full px-3.5 py-2 bg-white border border-slate-300 hover:border-[#056a3e] rounded-xl text-xs font-bold text-slate-700 hover:text-[#056a3e] cursor-pointer transition-all flex items-center justify-center gap-2 shadow-3xs group">
                            <Upload className="w-3.5 h-3.5 text-[#056a3e] group-hover:scale-110 transition-transform" />
                            <span>Ganti Berkas dari Komputer / HP</span>
                            <input
                              type="file"
                              accept="application/pdf,image/*,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditingArticle({ ...editingArticle, documentUrl: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          <input
                            type="url"
                            required
                            value={editingArticle.documentUrl || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, documentUrl: e.target.value })}
                            placeholder="Tempelkan tautan Google Drive / URL PDF..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                          />
                        </div>

                        <div className="md:col-span-4">
                          <div className="p-2.5 bg-slate-900 text-white rounded-xl text-center flex flex-col items-center justify-center min-h-[75px] border border-slate-800">
                            {editingArticle.documentUrl ? (
                              <div className="space-y-0.5">
                                <FileText className="w-5 h-5 text-emerald-400 mx-auto animate-pulse" />
                                <span className="text-[11px] font-bold text-emerald-300 block truncate max-w-[140px]">
                                  Dokumen Terhubung
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Belum Ada Berkas</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. TAUTAN NASKAH WORD & SUMBER BERITA */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                        <Link2 className="w-3.5 h-3.5 text-[#056a3e]" />
                        <span>3. Tautan Naskah Word & Sumber Berita (Opsional)</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Tautan Berkas Word (.docx / Google Docs)</label>
                          <input
                            type="url"
                            value={editingArticle.spreadsheetUrl || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, spreadsheetUrl: e.target.value })}
                            placeholder="https://docs.google.com/document/d/..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Tautan Sumber Berita Asli (URL Web)</label>
                          <input
                            type="url"
                            value={editingArticle.sourceUrl || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, sourceUrl: e.target.value })}
                            placeholder="https://www.aljazeera.net/..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. SPREADSHEET ANALISIS LINGUISTIK */}
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3.5 space-y-2.5">
                      <h4 className="text-xs font-bold text-[#056a3e] flex items-center gap-1.5 border-b border-emerald-100 pb-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>4. Spreadsheet Analisis Linguistik (Opsional)</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Spreadsheet Morfologi</label>
                          <input
                            type="url"
                            value={editingArticle.morfologiUrl || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, morfologiUrl: e.target.value })}
                            placeholder="URL Morfologi..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Spreadsheet Sintaksis</label>
                          <input
                            type="url"
                            value={editingArticle.sintaksisUrl || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, sintaksisUrl: e.target.value })}
                            placeholder="URL Sintaksis..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Spreadsheet Semantik</label>
                          <input
                            type="url"
                            value={editingArticle.semantikUrl || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, semantikUrl: e.target.value })}
                            placeholder="URL Semantik..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#056a3e]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5. TEKS NASKAH DOKUMEN */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        5. Teks Naskah Dokumen (Indeksasi Korpus)
                      </label>
                      <textarea
                        rows={3}
                        value={editingArticle.content || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                        placeholder="Teks naskah dokumen korpus dalam bahasa Arab..."
                        dir="rtl"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-sans leading-relaxed outline-none focus:border-[#056a3e]"
                      />
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingArticle(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-3xs active:scale-95"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* FORM EDIT BERITA (KHUSUS PORTAL BERITA) */
                <>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100/80 text-blue-800 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>Formulir Edit Berita Portal</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Ubah Berita</h3>
                    <p className="text-xs text-slate-500 mt-1">Perbarui isi naskah berita, foto sampul, dan ringkasan portal berita.</p>
                  </div>

                  <form onSubmit={handleEditArticleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Judul Berita *</label>
                        <input
                          type="text"
                          required
                          value={editingArticle.title}
                          onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Penulis / Jurnalis *</label>
                        <input
                          type="text"
                          required
                          value={editingArticle.author}
                          onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Kategori Berita *</label>
                        <select
                          value={editingArticle.category}
                          onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 font-medium cursor-pointer"
                        >
                          {genres.map((g) => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Edit Image Upload with Aspect Ratio Preview */}
                    <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Upload className="w-4 h-4 text-[#056a3e]" />
                            <span>Foto Sampul / Gambar Berita</span>
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Pilih berkas gambar baru dari perangkat atau ubah tautan URL foto.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-[#056a3e] bg-emerald-100/70 px-2.5 py-1 rounded-md font-bold self-start sm:self-auto">
                          Tampilan PC 16:9 | HP 4:3
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 items-center">
                        <div className="md:col-span-7 space-y-3">
                          <div className="flex items-center gap-2">
                            <label className="flex-1 px-4 py-2.5 bg-white border border-slate-300 hover:border-[#056a3e] rounded-xl text-xs font-bold text-slate-700 hover:text-[#056a3e] cursor-pointer transition-all flex items-center justify-center gap-2 shadow-3xs group">
                              <Upload className="w-4 h-4 text-[#056a3e] group-hover:scale-110 transition-transform" />
                              <span>Pilih Gambar dari Perangkat</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setEditingArticle({ ...editingArticle, image: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <input
                            type="url"
                            value={editingArticle.image || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, image: e.target.value })}
                            placeholder="Contoh: https://images.unsplash.com/photo-..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#056a3e] font-medium"
                          />
                        </div>

                        <div className="md:col-span-5">
                          <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-3xs flex items-center justify-center text-center group">
                            {editingArticle.image ? (
                              <>
                                <img
                                  src={editingArticle.image}
                                  alt="Pratinjau Sampul"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingArticle({ ...editingArticle, image: '' })}
                                  className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="p-4 text-slate-400 flex flex-col items-center justify-center space-y-1">
                                <BookMarked className="w-8 h-8 text-emerald-500/60" />
                                <span className="text-[11px] font-bold text-slate-300">Pratinjau Sampul</span>
                                <span className="text-[9px] text-slate-500">Tampilan PC 16:9 & HP 4:3</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Ringkasan / Sinopsis Berita</label>
                        <input
                          type="text"
                          value={editingArticle.summary || ''}
                          onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                          placeholder="Ringkasan singkat artikel berita..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Isi Lengkap Berita *</label>
                        <textarea
                          required
                          rows={5}
                          value={editingArticle.content || ''}
                          onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                          placeholder="Tuliskan teks lengkap naskah berita..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingArticle(null)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        Simpan Berita
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100 space-y-6">
            <button
              onClick={() => {
                setShowAddUserModal(false);
                setNewUserFormError('');
              }}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Tambah Pengguna Manual</h3>
              <p className="text-xs text-slate-500 mt-1">Buat pengguna baru secara manual dalam pangkalan data terintegrasi Firestore.</p>
            </div>

            {newUserFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
                {newUserFormError}
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={newUserFormName}
                  onChange={(e) => setNewUserFormName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Alamat Email *</label>
                <input
                  type="email"
                  required
                  placeholder="email@domain.com"
                  value={newUserFormEmail}
                  onChange={(e) => setNewUserFormEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kata Sandi / Password (Opsional, bawaan: sandi-korpus)</label>
                <input
                  type="text"
                  placeholder="Masukkan kata sandi baru"
                  value={newUserFormPassword}
                  onChange={(e) => setNewUserFormPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Hak Akses / Peran *</label>
                <select
                  value={newUserFormRole}
                  onChange={(e) => setNewUserFormRole(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 font-medium animate-fade-in"
                >
                  <option value="Peserta">Peserta</option>
                  <option value="Admin">Admin</option>
                  <option value="Peneliti">Peneliti</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserFormError('');
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER ROLE/NAME MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100 space-y-6">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Ubah Pengguna</h3>
              <p className="text-xs text-slate-500 mt-1">Sesuaikan informasi nama dan peran pengguna dalam sistem digital.</p>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Alamat Email (Tidak dapat diubah)</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kata Sandi / Password *</label>
                <input
                  type="text"
                  required
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Hak Akses / Peran *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 font-medium animate-fade-in"
                >
                  <option value="Peserta">Peserta</option>
                  <option value="Admin">Admin</option>
                  <option value="Peneliti">Peneliti</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETION CONFIRMATION OVERLAYS */}
      {deletingArticleId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500">Apakah Anda yakin ingin menghapus artikel berita ini dari pangkalan data?</p>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setDeletingArticleId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">Batal</button>
              <button onClick={() => confirmDeleteArticle(deletingArticleId)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {deletingGalleryId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500">Apakah Anda yakin ingin menghapus gambar galeri ini?</p>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setDeletingGalleryId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">Batal</button>
              <button onClick={() => confirmDeleteGalleryItem(deletingGalleryId)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {deletingUserId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus Pengguna</h3>
            <p className="text-xs text-slate-500">Apakah Anda yakin ingin menghapus pengguna ini dari database?</p>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setDeletingUserId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">Batal</button>
              <button onClick={() => confirmDeleteUser(deletingUserId)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Firestore Data & Collection Explorer Modal */}
      <FirestoreExplorerModal
        isOpen={showFirestoreExplorerModal}
        onClose={() => setShowFirestoreExplorerModal(false)}
        articles={articles}
        corpusDocs={corpusDocs}
        galleryItems={galleryItems}
        genres={genres}
        users={users}
        onSeed={handleManualSeedFirestore}
      />

      {/* FOOTER SECTION */}
      {currentTab !== 'login' && (
        <footer className="bg-white border-t border-slate-100 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#056a3e] rounded-full text-white shadow-sm flex items-center justify-center">
                <CustomBookLogo className="w-4.5 h-4.5" />
              </div>
              <span className="font-sans font-bold text-lg tracking-tight text-[#056a3e]">
                ArabNet Corpus
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm font-medium">
              © 2026 <span className="text-[#056a3e] font-semibold">ArabNet Corpus</span>. All rights reserved.
            </p>
          </div>
        </footer>
      )}

    </div>
  );
}
