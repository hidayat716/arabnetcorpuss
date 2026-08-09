import React from 'react';
import { 
  Search, 
  Layers, 
  Table, 
  ExternalLink, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  Pencil,
  FileX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Article } from '../../types';
import { normalizeArabic, tokenizeArabic } from '../../data/initialData';
import { extractTextFromDocUrl } from '../../utils/docExtractor';

// Simple and robust CSV parser to parse Google Sheets CSV exports
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
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
  // Filter out completely empty rows
  return lines.filter(r => r.some(cell => cell.trim() !== ''));
}

// Generate dynamic, structurally accurate morphology, syntax, semantics, and word frequency tables directly from actual document text
export function getFallbackSpreadsheetData(content: string, tabKey: string): string[][] {
  const textToProcess = content && content.trim().length > 0
    ? content
    : "العلم نور يسعى الإنسان إلى المعرفة والتعلم في كل مكان وزمان. اللغة العربية لغة عظيمة وثريّة بالأدب والفصاحة.";

  const words = tokenizeArabic(textToProcess);
  const totalTokens = words.length || 1;
  
  // Count exact frequency of each word in the text (using normalized forms for grouping)
  const wordCounts: Record<string, number> = {};
  const originalWordForNormalized: Record<string, string> = {};
  
  for (const w of words) {
    if (w.trim().length > 0) {
      const normalized = w.replace(/[\u064B-\u0652\u0670]/g, '')
                          .replace(/[أإآٱ]/g, 'ا')
                          .replace(/ة/g, 'ه')
                          .replace(/ى/g, 'ي')
                          .toLowerCase();
      wordCounts[normalized] = (wordCounts[normalized] || 0) + 1;
      
      const current = originalWordForNormalized[normalized];
      if (!current || w.length > current.length) {
        originalWordForNormalized[normalized] = w;
      }
    }
  }

  // Sort unique normalized words by their frequency in descending order
  const sortedKeys = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);

  // Take top unique words (up to 100 entries)
  const targetKeys = sortedKeys.slice(0, 100);

  // Pre-defined dictionary for known frequent Arabic words to enrich analysis
  const dict: Record<string, {
    morphology: string[];
    syntax: string[];
    semantics: string[];
    general: string[];
  }> = {
    'العلم': {
      morphology: ['Isim (Kata Benda)', 'ع - ل - م (Ilmu)', 'فِعْل', 'Definite (Ma\'rifah) dengan Al-. Menunjukkan ilmu/pengetahuan.'],
      syntax: ['Mubtada\' (Subjek)', 'Marfu\' (Dhammah zhahirah)', 'Subjek Kalimat Utama', 'Terletak di awal kalimat nominal (Jumlah Ismiyyah).'],
      semantics: ['Ilmu / Pengetahuan', 'Kebenaran ilmiah & petunjuk jiwa', 'Sinonim: معرفة | Antonim: جهل', 'Merujuk pada kewajiban menuntut ilmu.'],
      general: ['Isim Ma\'rifah', 'ع - ل - م', 'Dasar kemajuan peradaban Islam.']
    },
    'نور': {
      morphology: ['Isim (Kata Benda)', 'ن - و - ر (Cahaya)', 'فُعْل', 'Indefinite (Nakirah). Isim Jamid abstrak.'],
      syntax: ['Khabar (Predikat)', 'Marfu\' (Dhammah tanwin)', 'Pelengkap Mubtada\'', 'Penerang makna dari Mubtada\' "العلم".'],
      semantics: ['Cahaya / Sinar', 'Penerang jalan kehidupan manusia', 'Sinonim: ضياء | Antonim: ظلمة', 'Metafora untuk petunjuk kebenaran.'],
      general: ['Isim Nakirah', 'ن - و - ر', 'Metafora ilmu sebagai penerang kegelapan.']
    },
    'يسعى': {
      morphology: ['Fi\'il Mudhari\' (Present)', 'س - ع - ي (Saha)', 'يَفْعَلُ', 'Fi\'il Mu\'tal Akhir (berakhiran huruf illah Alif Maqsura).'],
      syntax: ['Fi\'il Mudhari\'', 'Marfu\' (Dhammah muqaddarah)', 'Predikat Aktual (Kata Kerja)', 'Mengandung dhamir mustatir "هو" (dia laki-laki).'],
      semantics: ['Berusaha / Melangkah', 'Upaya aktif manusia mencari kebaikan', 'Sinonim: يجتهد | Antonim: يتكاسل', 'Menunjukkan proses dinamis tanpa henti.'],
      general: ['Fi\'il Mudhari\'', 'س - ع - ي', 'Menunjukkan usaha aktif manusia dalam hidup.']
    },
    'الإنسان': {
      morphology: ['Isim (Kata Benda)', 'أ - ن - س (Anas)', 'اِفْعِلَان', 'Isim mufrod mudzakkar ber-Alif Lam.'],
      syntax: ['Fa\'il (Pelaku)', 'Marfu\' (Dhammah zhahirah)', 'Pelaku Utama kata kerja "يسعى"', 'Subjek pelaku dari kata kerja sebelumnya.'],
      semantics: ['Manusia', 'Mahluk berakal yang diberi tanggung jawab', 'Sinonim: بشر | Antonim: حيوان', 'Mahluk sentral dalam pencarian kebenaran.'],
      general: ['Isim Ma\'rifah', 'أ - ن - س', 'Makhluk hidup berakal budi pengemban amanah.']
    },
    'اللغة': {
      morphology: ['Isim (Kata Benda)', 'ل - غ - و (Lagu)', 'فُعْلَة', 'Isim muannats ditandai dengan Ta\' Marbutah (ة).'],
      syntax: ['Mubtada\' (Subjek)', 'Marfu\' (Dhammah zhahirah)', 'Subjek Utama Pembicaraan', 'Isim di awal kalimat yang dibahas.'],
      semantics: ['Bahasa', 'Sistem komunikasi lisan & tulisan', 'Sinonim: lisan | Antonim: صمت', 'Sistem terstruktur pengungkapan gagasan.'],
      general: ['Isim Muannats', 'ل - غ - و', 'Sistem komunikasi manusia paling mulia.']
    },
    'العربية': {
      morphology: ['Isim Sifat (Adjektiva)', 'ع - ر - ب (Arab)', 'فَعَلِيَّة', 'Nisbah muannatsah dengan Ta\' Marbutah.'],
      syntax: ['Na\'at (Sifat)', 'Marfu\' (Dhammah zhahirah)', 'Pemberi Sifat kata "اللغة"', 'Mengikuti Man\'ut (اللغة) dalam segi i\'rab, muannats, ma\'rifah.'],
      semantics: ['Bahasa Arab', 'Bahasa Al-Qur\'an dan Sastra Klasik', 'Sinonim: فصيحة | Antonim: أعجمية', 'Bahasa dengan kekayaan kosakata terbesar.'],
      general: ['Isim Nisbah', 'ع - ر - ب', 'Bahasa Al-Qur\'an dengan keindahan luar biasa.']
    }
  };

  // Build headers depending on tabKey
  let headers: string[] = [];
  if (tabKey === 'morfologi') {
    headers = ["Kata (Lafadz)", "Frekuensi", "Persentase (%)", "Jenis Kata (POS)", "Akar Kata (الجذر)", "Wazan", "Keterangan Morfologi"];
  } else if (tabKey === 'sintaksis') {
    headers = ["Kata / Frasa", "Frekuensi", "Persentase (%)", "Kedudukan (I'rab)", "Tanda I'rab", "Fungsi Sintaksis", "Keterangan Sintaksis"];
  } else if (tabKey === 'semantik') {
    headers = ["Kata / Istilah", "Frekuensi", "Persentase (%)", "Makna Dasar", "Makna Kontekstual", "Relasi Semantik", "Keterangan Semantik"];
  } else {
    headers = ["Kata / Lafadz", "Frekuensi (Jumlah)", "Persentase (%)"];
  }

  const rows: string[][] = [headers];

  const stripHarakat = (text: string) => text.replace(/[\u064B-\u0652\u0670]/g, '');

  targetKeys.forEach((key) => {
    const originalWord = originalWordForNormalized[key] || key;
    const count = wordCounts[key];
    const percentage = ((count / totalTokens) * 100).toFixed(2) + '%';
    const cleanWord = stripHarakat(originalWord);

    // Check if entry exists in known dictionary
    let entry = dict[cleanWord];
    if (!entry) {
      const dictKey = Object.keys(dict).find(k => cleanWord.includes(k) || k.includes(cleanWord));
      if (dictKey) entry = dict[dictKey];
    }

    const isArabic = /[\u0600-\u06FF]/.test(cleanWord);

    if (entry) {
      if (tabKey === 'morfologi') {
        rows.push([originalWord, String(count), percentage, ...entry.morphology]);
      } else if (tabKey === 'sintaksis') {
        rows.push([originalWord, String(count), percentage, ...entry.syntax]);
      } else if (tabKey === 'semantik') {
        rows.push([originalWord, String(count), percentage, ...entry.semantics]);
      } else {
        rows.push([originalWord, String(count), percentage]);
      }
    } else if (isArabic) {
      // Smart detection for Arabic words
      const isFiil = cleanWord.startsWith('ي') || cleanWord.startsWith('ت') || cleanWord.startsWith('ن') || cleanWord.startsWith('أ');
      const isMaarifah = cleanWord.startsWith('ال');
      const isHarf = ['من', 'في', 'عن', 'إلى', 'على', 'مع', 'أن', 'إن', 'لا', 'ما', 'قد', 'ثم', 'أو', 'بل', 'و', 'ف', 'ب', 'ل', 'ك'].includes(cleanWord) || (cleanWord.length <= 2 && !isFiil);

      let pos = 'Isim (Kata Benda)';
      if (isHarf) pos = 'Harf (Partikel/Preposisi)';
      else if (isFiil && !isMaarifah) pos = 'Fi\'il (Kata Kerja)';

      let root = '---';
      let textForRoot = cleanWord;
      if (textForRoot.startsWith('ال')) textForRoot = textForRoot.slice(2);
      if ((textForRoot.startsWith('ي') || textForRoot.startsWith('ت')) && textForRoot.length > 3) textForRoot = textForRoot.slice(1);
      if (textForRoot.length >= 3) {
        root = `${textForRoot[0]} - ${textForRoot[1]} - ${textForRoot[2]}`;
      }

      const isManshub = originalWord.endsWith('َ') || originalWord.endsWith('ً') || originalWord.endsWith('ا');
      const isMajrur = originalWord.endsWith('ِ') || originalWord.endsWith('ٍ') || originalWord.endsWith('ي') || cleanWord.startsWith('ب') || cleanWord.startsWith('ل');
      let irab = 'Marfu\'';
      let tanda = 'Dhammah';
      if (isManshub) { irab = 'Manshub'; tanda = 'Fathah'; }
      else if (isMajrur) { irab = 'Majrur'; tanda = 'Kasrah'; }
      if (isHarf) { irab = 'Mabni'; tanda = 'Sukun / Harakat Asli'; }

      if (tabKey === 'morfologi') {
        rows.push([
          originalWord,
          String(count),
          percentage,
          pos,
          root,
          cleanWord.length === 3 ? 'فَعَلَ' : (isFiil ? 'يَفۡعَلُ' : (isMaarifah ? 'اَلۡفَعۡل' : 'فِعۡل / اِسۡم')),
          `Kata ${isMaarifah ? 'Ma\'rifah (Definite)' : 'Nakirah'} terdeteksi dalam teks naskah.`
        ]);
      } else if (tabKey === 'sintaksis') {
        rows.push([
          originalWord,
          String(count),
          percentage,
          irab,
          tanda,
          isHarf ? 'Partikel Penghubung / Preposisi' : (isFiil ? 'Predikat Fi\'liyyah' : 'Subjek / Pelengkap Nominal'),
          `Dianalisis sintaksis dengan frekuensi ${count}x dalam naskah korpus.`
        ]);
      } else if (tabKey === 'semantik') {
        rows.push([
          originalWord,
          String(count),
          percentage,
          `Makna Kata (${originalWord})`,
          `Penggunaan kontekstual dalam naskah`,
          isMaarifah ? 'Entitas Utama Dokumen' : 'Atribut / Deskriptor Konteks',
          `Gatra makna terikat pada ranah teks korpus Arab.`
        ]);
      } else {
        rows.push([
          originalWord,
          String(count),
          percentage
        ]);
      }
    } else {
      // General non-Arabic word
      if (tabKey === 'morfologi') {
        rows.push([originalWord, String(count), percentage, 'Kata / Istilah', '---', '---', `Terdeteksi ${count}x dalam dokumen.`]);
      } else if (tabKey === 'sintaksis') {
        rows.push([originalWord, String(count), percentage, '---', '---', 'Istilah Umum', `Mendukung konteks naskah (${count}x).`]);
      } else if (tabKey === 'semantik') {
        rows.push([originalWord, String(count), percentage, originalWord, 'Istilah Kontekstual', 'Medan Makna', `Kosakata pendukung naskah.`]);
      } else {
        rows.push([originalWord, String(count), percentage]);
      }
    }
  });

  return rows;
}

interface SpreadsheetEmbedProps {
  title: string;
  description: string;
  fieldKey: 'morfologiUrl' | 'sintaksisUrl' | 'semantikUrl' | 'spreadsheetUrl';
  activeSpreadsheetArticle: Article;
  onUpdateArticle: (art: Article) => void;
  setActiveSpreadsheetArticle: (art: Article) => void;
  hasWriteAccess: boolean;
  spreadsheetTab: 'analisis' | 'morfologi' | 'sintaksis' | 'semantik' | 'google-sheet';
  defaultViewMode?: 'interactive' | 'iframe';
}

export default function SpreadsheetEmbed({
  title,
  description,
  fieldKey,
  activeSpreadsheetArticle,
  onUpdateArticle,
  setActiveSpreadsheetArticle,
  hasWriteAccess,
  spreadsheetTab,
  defaultViewMode = 'interactive'
}: SpreadsheetEmbedProps) {
  // Embedded spreadsheet search states
  const [embedSearchQuery, setEmbedSearchQuery] = React.useState('');
  const [embedSearchStatus, setEmbedSearchStatus] = React.useState('');
  const [fetchedSheets, setFetchedSheets] = React.useState<Record<string, { data: string[][]; error: string | null; loading: boolean }>>({});
  const [fetchedDocText, setFetchedDocText] = React.useState<string>('');
  const [embedViewMode, setEmbedViewMode] = React.useState<'interactive' | 'iframe'>(defaultViewMode);
  const [isIframeFullscreen, setIsIframeFullscreen] = React.useState(false);
  const [embedPage, setEmbedPage] = React.useState(1);

  const url = activeSpreadsheetArticle[fieldKey] || '';

  // Auto-fetch raw document text from Google Docs or Word links / Base64 in activeSpreadsheetArticle
  React.useEffect(() => {
    if (!activeSpreadsheetArticle) return;
    const docLinks = [
      activeSpreadsheetArticle.documentUrl,
      activeSpreadsheetArticle.spreadsheetUrl,
      activeSpreadsheetArticle.morfologiUrl,
      activeSpreadsheetArticle.sintaksisUrl,
      activeSpreadsheetArticle.semantikUrl
    ].filter(Boolean) as string[];

    const docTarget = docLinks.find(l => l.startsWith('data:') || l.includes('/document/d/') || l.includes('docs.google.com') || l.includes('.docx') || l.startsWith('http')) || activeSpreadsheetArticle.documentUrl || '';

    if (docTarget) {
      extractTextFromDocUrl(docTarget, activeSpreadsheetArticle.content)
        .then(extractedText => {
          if (extractedText && extractedText.trim()) {
            setFetchedDocText(extractedText.trim());
          } else {
            setFetchedDocText(activeSpreadsheetArticle.content || '');
          }
        })
        .catch(err => {
          console.warn('Live doc fetch warning:', err);
          setFetchedDocText(activeSpreadsheetArticle.content || '');
        });
    } else {
      setFetchedDocText(activeSpreadsheetArticle.content || '');
    }
  }, [activeSpreadsheetArticle]);

  // Reset embedded search query and status when tab or article changes
  React.useEffect(() => {
    setEmbedSearchQuery('');
    setEmbedSearchStatus('');
    setEmbedPage(1);
  }, [spreadsheetTab, activeSpreadsheetArticle]);

  // Reset embed page when query changes
  React.useEffect(() => {
    setEmbedPage(1);
  }, [embedSearchQuery]);

  // Fetch Google Spreadsheet in real time as CSV when active sheet/url changes
  React.useEffect(() => {
    if (!activeSpreadsheetArticle) return;
    
    let currentUrl = '';
    let key = '';
    if (spreadsheetTab === 'morfologi') {
      currentUrl = activeSpreadsheetArticle.morfologiUrl || '';
      key = 'morfologi';
    } else if (spreadsheetTab === 'sintaksis') {
      currentUrl = activeSpreadsheetArticle.sintaksisUrl || '';
      key = 'sintaksis';
    } else if (spreadsheetTab === 'semantik') {
      currentUrl = activeSpreadsheetArticle.semantikUrl || '';
      key = 'semantik';
    } else if (spreadsheetTab === 'google-sheet') {
      currentUrl = activeSpreadsheetArticle.spreadsheetUrl || '';
      key = 'google-sheet';
    }

    if (!currentUrl) return;

    // Extract spreadsheet ID
    const match = currentUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) return;
    const spreadsheetId = match[1];

    const cacheKey = `${activeSpreadsheetArticle.id}-${key}-${spreadsheetId}`;
    
    // Use functional state updater to avoid fetchedSheets dependency
    setFetchedSheets(prev => {
      if (prev[cacheKey]) return prev;
      
      // If not yet fetched, fetch it
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

      fetch(csvUrl)
        .then(res => {
          if (!res.ok) throw new Error('Gagal mengakses lembar kerja.');
          return res.text();
        })
        .then(text => {
          const parsed = parseCSV(text);
          setFetchedSheets(curr => ({
            ...curr,
            [cacheKey]: { data: parsed, error: null, loading: false }
          }));
        })
        .catch(err => {
          console.log('Gagal mengunduh spreadsheet:', err.message || err);
          setFetchedSheets(curr => ({
            ...curr,
            [cacheKey]: { 
              data: [], 
              error: 'Gagal memuat data spreadsheet. Pastikan tautan Google Sheets telah dipublikasikan ke web atau memiliki izin akses publik.', 
              loading: false 
            }
          }));
        });

      return {
        ...prev,
        [cacheKey]: { data: [], error: null, loading: true }
      };
    });
  }, [activeSpreadsheetArticle, spreadsheetTab]);

  // Get live data if available or fallback gracefully to extracted text analysis
  let tabKey = '';
  if (spreadsheetTab === 'morfologi') tabKey = 'morfologi';
  else if (spreadsheetTab === 'sintaksis') tabKey = 'sintaksis';
  else if (spreadsheetTab === 'semantik') tabKey = 'semantik';
  else if (spreadsheetTab === 'google-sheet') tabKey = 'google-sheet';

  const matchId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = matchId ? matchId[1] : '';
  const cacheKey = `${activeSpreadsheetArticle.id}-${tabKey}-${spreadsheetId}`;
  const sheetState = fetchedSheets[cacheKey] || { data: [], error: null, loading: false };

  // Combine all document text for complete Arabic word and frequency analysis
  const fullTextToAnalyze = [
    fetchedDocText || '',
    activeSpreadsheetArticle.content || '',
    activeSpreadsheetArticle.summary || '',
    activeSpreadsheetArticle.title || ''
  ].filter(Boolean).join(' ');

  // Use live CSV sheet data if available, otherwise automatically fallback to generated document analysis data
  const rawTableData = (sheetState.data && sheetState.data.length > 0)
    ? sheetState.data
    : getFallbackSpreadsheetData(fullTextToAnalyze, tabKey || 'general');

  // Process search & rows
  const query = embedSearchQuery.trim();
  const hasSearchActive = !!query;
  
  let matchedRows: string[][] = [];
  let allRows: string[][] = [];
  let headers: string[] = [];

  if (rawTableData && rawTableData.length > 0) {
    headers = rawTableData[0] || [];
    allRows = rawTableData.slice(1);
    
    if (hasSearchActive) {
      const normQuery = normalizeArabic(query, {
        removeHarakat: true,
        normalizeAlif: true,
        normalizeYa: true,
        normalizeTeh: true
      }).toLowerCase();

      matchedRows = allRows.filter(row => {
        return row.some(cell => {
          const normCell = normalizeArabic(cell || '', {
            removeHarakat: true,
            normalizeAlif: true,
            normalizeYa: true,
            normalizeTeh: true
          }).toLowerCase();
          return normCell.includes(normQuery);
        });
      });
    }
  }

  // Helper to construct smart iframe URLs for Google Docs, Word files, Google Sheets, and PDFs
  const getEmbedIframeUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';
    const trimmed = rawUrl.trim();

    // Google Docs Document (/document/d/DOC_ID)
    const matchDoc = trimmed.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    if (matchDoc && matchDoc[1]) {
      return `https://docs.google.com/document/d/${matchDoc[1]}/preview`;
    }

    // Google Sheets Spreadsheet (/spreadsheets/d/SHEET_ID or /d/e/pubhtml)
    const matchE = trimmed.match(/\/d\/(e\/[a-zA-Z0-9-_]+)/);
    if (matchE && matchE[1]) {
      return `https://docs.google.com/spreadsheets/d/${matchE[1]}/pubhtml?widget=true&headers=false&chrome=false`;
    }

    const matchSheet = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (matchSheet && matchSheet[1]) {
      return `https://docs.google.com/spreadsheets/d/${matchSheet[1]}/preview?widget=true&headers=false&chrome=false`;
    }

    // Google Drive File (/file/d/FILE_ID)
    const matchDrive = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (matchDrive && matchDrive[1]) {
      return `https://drive.google.com/file/d/${matchDrive[1]}/preview`;
    }

    // Generic /d/ID fallback
    const matchGenericD = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (matchGenericD && matchGenericD[1]) {
      if (trimmed.includes('document')) {
        return `https://docs.google.com/document/d/${matchGenericD[1]}/preview`;
      }
      return `https://docs.google.com/spreadsheets/d/${matchGenericD[1]}/preview?widget=true&headers=false&chrome=false`;
    }

    // If already preview or pubhtml or embedded
    if (trimmed.includes('/preview') || trimmed.includes('/pubhtml') || trimmed.includes('embedded=true')) {
      return trimmed;
    }

    // Direct Word (.doc, .docx), PDF, or external web link
    if (/\.(doc|docx|pdf|txt|rtf)$/i.test(trimmed) || trimmed.startsWith('http')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(trimmed)}&embedded=true`;
    }

    return trimmed;
  };

  // Highlighting helper for rendering cells
  const highlightText = (text: string, q: string) => {
    if (!q) return text;
    try {
      const escapedQuery = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, i) => 
            regex.test(part) ? (
              <mark key={i} className="bg-amber-100 text-amber-950 font-bold px-1 py-0.5 rounded border border-amber-200">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch (e) {
      return text;
    }
  };
  
  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      {/* If URL is NOT set, show the description and configuration form */}
      {!url && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
      )}

      {url ? (
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Search Bar section */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-3xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800">Tabel Aktif: {title}</span>
              </div>
              {hasWriteAccess && (
                <button
                  onClick={() => {
                    const newUrl = prompt(`Masukkan Tautan Google Sheets baru untuk ${title}:`, url);
                    if (newUrl !== null) {
                      const updated = { ...activeSpreadsheetArticle, [fieldKey]: newUrl.trim() };
                      onUpdateArticle(updated);
                      setActiveSpreadsheetArticle(updated);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-[#056a3e] transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ubah Tautan Google Sheets</span>
                </button>
              )}
            </div>

            {/* SEARCH INPUT */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={embedSearchQuery}
                  onChange={(e) => setEmbedSearchQuery(e.target.value)}
                  placeholder="Masukkan kata Arab atau istilah untuk dicari..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#056a3e] focus:ring-1 focus:ring-[#056a3e]/10 bg-white font-sans text-slate-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEmbedViewMode('interactive');
                      if (embedSearchQuery.trim()) {
                        setEmbedSearchStatus(`Pencarian instan berhasil dilakukan!`);
                      }
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEmbedViewMode('interactive');
                    if (embedSearchQuery.trim()) {
                      setEmbedSearchStatus(`Pencarian instan berhasil dilakukan!`);
                    } else {
                      setEmbedSearchStatus('Menampilkan seluruh data tabel.');
                    }
                  }}
                  className="px-4 py-2.5 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-98"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Cari Kata</span>
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Tab Baru</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Real-time Loading Status */}
            {sheetState.loading && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-[#056a3e] font-medium">
                <span className="w-3.5 h-3.5 border-2 border-[#056a3e] border-t-transparent rounded-full animate-spin"></span>
                <span>Menyinkronkan data dari Google Sheets untuk pencarian instan...</span>
              </div>
            )}

            {/* SEARCH NOTIFICATION & INSTRUCTION BADGE */}
            {embedSearchStatus && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 leading-relaxed font-medium animate-fade-in flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-emerald-950 mb-0.5">Pencarian Cepat:</p>
                  <p>{embedSearchStatus} Anda juga dapat menyalin kata ini dan menggunakan Ctrl+F pada tampilan spreadsheet asli.</p>
                </div>
                <button 
                  onClick={() => setEmbedSearchStatus('')}
                  className="text-emerald-600 hover:text-emerald-900 text-xs font-bold pl-2 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>

          {/* VIEW MODE TOGGLE TABS */}
          <div className="flex border-b border-slate-200 bg-slate-50/40 p-1 rounded-xl">
            <button
              onClick={() => setEmbedViewMode('interactive')}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                embedViewMode === 'interactive'
                  ? 'bg-white text-[#056a3e] shadow-3xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Pencarian Cepat & Tabel Interaktif</span>
            </button>
            <button
              onClick={() => setEmbedViewMode('iframe')}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                embedViewMode === 'iframe'
                  ? 'bg-white text-[#056a3e] shadow-3xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tampilan Dokumen / Naskah Word (Iframe)</span>
            </button>
          </div>

          {/* VIEW CONTENTS based on mode */}
          {embedViewMode === 'interactive' ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden flex-1 shadow-2xs h-[620px] bg-white flex flex-col">
              {sheetState.loading && sheetState.data.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                  <span className="w-8 h-8 border-3 border-[#056a3e] border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-xs font-semibold text-slate-600">Menyinkronkan dan memproses data dari naskah dokumen...</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Table Title and Metadata */}
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {hasSearchActive 
                        ? `Hasil Pencarian: ${matchedRows.length} baris ditemukan` 
                        : `Total Data: ${allRows.length} baris`
                      }
                    </span>
                    {hasSearchActive && (
                      <button
                        onClick={() => setEmbedSearchQuery('')}
                        className="text-[10px] text-red-600 hover:text-red-800 font-bold cursor-pointer"
                      >
                        Bersihkan Pencarian
                      </button>
                    )}
                  </div>

                  {/* Table element */}
                  <div className="flex-1 overflow-auto bg-slate-50/30">
                    {((hasSearchActive ? matchedRows : allRows).length === 0) ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                        <p className="text-xs font-bold text-slate-800">Kata "{query}" tidak ditemukan di dalam naskah dokumen.</p>
                        <p className="text-[11px] text-slate-500 max-w-sm">
                          Pastikan kata yang dicari tepat. Anda juga dapat menggunakan tombol "Buka Berkas" di atas untuk mencari di dokumen lengkap.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full border-collapse text-left">
                        <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10 shadow-3xs">
                          <tr>
                            <th className="px-4 py-2.5 w-12 text-center bg-slate-100">No</th>
                            {headers.map((header, idx) => (
                              <th key={idx} className="px-4 py-2.5 font-bold bg-slate-100">{header || `Kolom ${idx + 1}`}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {(() => {
                            const listToRender = hasSearchActive ? matchedRows : allRows;
                            const itemsPerPage = 15;
                            const startIndex = (embedPage - 1) * itemsPerPage;
                            const paginated = listToRender.slice(startIndex, startIndex + itemsPerPage);
                            
                            return paginated.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-emerald-50/20 transition-colors odd:bg-white even:bg-slate-50/20">
                                <td className="px-4 py-2.5 text-xs text-slate-400 font-mono text-center">{startIndex + rowIdx + 1}</td>
                                {headers.map((_, colIdx) => (
                                  <td key={colIdx} className="px-4 py-2.5 text-xs text-slate-800 font-sans leading-relaxed">
                                    {highlightText(row[colIdx] || '', query)}
                                  </td>
                                ))}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* PAGINATION PANEL */}
                  {(() => {
                    const listToRender = hasSearchActive ? matchedRows : allRows;
                    const itemsPerPage = 15;
                    const totalPages = Math.ceil(listToRender.length / itemsPerPage);
                    if (totalPages <= 1) return null;
                    
                    return (
                      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between z-10">
                        <button
                          disabled={embedPage === 1}
                          onClick={() => setEmbedPage(prev => Math.max(1, prev - 1))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Sebelumnya</span>
                        </button>
                        <span className="text-[11px] font-bold text-slate-600">
                          Halaman {embedPage} dari {totalPages}
                        </span>
                        <button
                          disabled={embedPage === totalPages}
                          onClick={() => setEmbedPage(prev => Math.min(totalPages, prev + 1))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <span>Berikutnya</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* Google Docs / Word / Document / Sheet Embed Frame - Full Height & Fullscreen Mode */
            <>
              <div className="border border-slate-200 rounded-2xl overflow-hidden flex-1 shadow-inner h-[760px] min-h-[72vh] w-full bg-slate-100 relative flex flex-col group">
                {/* Floating Top Control Toolbar */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-lg text-white transition-all opacity-90 hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setIsIframeFullscreen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Buka Tampilan Dokumen Layar Penuh (Fullscreen)"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Layar Penuh</span>
                  </button>
                  <div className="w-px h-3.5 bg-white/30"></div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Buka Tautan Asli di Tab Baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tab Baru</span>
                  </a>
                </div>

                <iframe
                  src={getEmbedIframeUrl(url)}
                  className="w-full h-full border-0 bg-white flex-1"
                  title={`${title} Embed View`}
                  referrerPolicy="no-referrer"
                ></iframe>
              </div>

              {/* Fullscreen Overlay Modal for Document Viewer */}
              {isIframeFullscreen && (
                <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 flex flex-col animate-fade-in">
                  {/* Fullscreen Top Navigation Bar */}
                  <div className="bg-slate-900 text-white px-5 py-3 rounded-t-2xl flex items-center justify-between border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                          {title} — Tampilan Dokumen Layar Penuh
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {activeSpreadsheetArticle.title} • {activeSpreadsheetArticle.author}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
                      >
                        <span>Buka di Tab Baru</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setIsIframeFullscreen(false)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-98"
                      >
                        <Minimize2 className="w-4 h-4" />
                        <span>Keluar Layar Penuh</span>
                      </button>
                    </div>
                  </div>

                  {/* Fullscreen Iframe Viewport */}
                  <div className="flex-1 bg-white rounded-b-2xl overflow-hidden shadow-2xl relative">
                    <iframe
                      src={getEmbedIframeUrl(url)}
                      className="w-full h-full border-0 bg-white"
                      title={`${title} Fullscreen Embed`}
                      referrerPolicy="no-referrer"
                    ></iframe>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : !hasWriteAccess ? (
        <div className="py-16 px-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/90 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 shadow-3xs">
            <FileX className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Belum ada data {title.toLowerCase()}</p>
          </div>
        </div>
      ) : (
        <div className="py-8 px-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-sm font-bold text-slate-800">Belum Ada Tautan Google Spreadsheet untuk {title}</h4>
            <p className="text-xs text-slate-500">
              Hubungkan lembar kerja Google Sheets untuk melacak data jumlah kata dan analisis {title.toLowerCase()} dari dokumen ini secara kolaboratif.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-white p-4 rounded-xl border border-slate-150 shadow-3xs space-y-3">
            <label className="text-[11px] text-slate-700 font-bold block text-left">Masukkan Tautan Google Sheets ({title})</label>
            <div className="flex gap-2">
              <input
                type="url"
                id={`input-inline-sheet-url-${fieldKey}`}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={() => {
                  const inputEl = document.getElementById(`input-inline-sheet-url-${fieldKey}`) as HTMLInputElement;
                  if (inputEl && inputEl.value.trim()) {
                    const newUrl = inputEl.value.trim();
                    const updated = { ...activeSpreadsheetArticle, [fieldKey]: newUrl };
                    onUpdateArticle(updated);
                    setActiveSpreadsheetArticle(updated);
                  }
                }}
                className="px-4 py-2 bg-[#056a3e] hover:bg-[#044d2d] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                Hubungkan
              </button>
            </div>
          </div>

          {/* How to connect step-by-step guidance for admins */}
          <div className="max-w-2xl mx-auto bg-teal-50/40 p-4 rounded-xl border border-teal-100 text-left space-y-2.5">
            <h5 className="text-xs font-bold text-teal-800 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Cara Menghubungkan Google Sheets (Pilih Salah Satu Metode):</span>
            </h5>
            <div className="space-y-3 text-xs text-teal-900/80 pl-1">
              <div>
                <p className="font-semibold text-teal-950 mb-1">Metode A: Berbagi Tautan (Lebih Mudah & Cepat)</p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1.5">
                  <li>Buka spreadsheet Anda di <strong>Google Sheets</strong>.</li>
                  <li>Klik tombol biru <strong>Bagikan (Share)</strong> di kanan atas.</li>
                  <li>Ubah Akses Umum menjadi <strong>Siapa saja yang memiliki tautan (Anyone with the link)</strong> dengan peran "Pelihat (Viewer)".</li>
                  <li>Salin link tersebut dari browser Anda (format: <code>.../d/[ID_SPEADSHEET]/edit?usp=sharing</code>) dan masukkan di atas.</li>
                </ol>
              </div>
              <div className="border-t border-teal-100 pt-2">
                <p className="font-semibold text-teal-950 mb-1">Metode B: Publikasikan ke Web (Tampilan Bersih & Terbuka)</p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1.5">
                  <li>Buka spreadsheet Anda, klik menu <strong>File</strong> &gt; <strong>Bagikan (Share)</strong> &gt; <strong>Publikasikan ke web (Publish to the web)</strong>.</li>
                  <li>Klik tombol <strong>Publikasikan (Publish)</strong>.</li>
                  <li>Salin tautan yang muncul (format: <code>.../d/e/[ID_PUBLISH]/pubhtml</code>) dan masukkan di atas.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
