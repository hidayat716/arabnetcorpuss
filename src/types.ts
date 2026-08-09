/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  date: string;
  wordCount: number;
  image?: string;
  summary?: string;
  documentUrl?: string;
  spreadsheetUrl?: string;
  sourceUrl?: string;
  morfologiUrl?: string;
  sintaksisUrl?: string;
  semantikUrl?: string;
}

export interface ConcordanceResult {
  leftContext: string;
  keyword: string;
  rightContext: string;
  articleId: string;
  articleTitle: string;
  wordIndex: number;
}

export interface FrequencyItem {
  word: string;
  count: number;
  percentage: number;
  rank: number;
}

export interface NgramItem {
  phrase: string;
  count: number;
  percentage: number;
}

export interface CollocationItem {
  word: string;
  count: number;
  strength: number; // Mutual Information-like score or simple correlation
  distance: number; // Average distance from the keyword
}

export interface CorpusStats {
  totalArticles: number;
  totalWords: number;
  uniqueWords: number;
  ttr: number; // Type-Token Ratio
  avgWordLength: number;
  avgSentenceLength: number;
}

export interface CorpusUser {
  id: string; // Unique identifier (e.g., email or timestamp id)
  name: string;
  email: string;
  role: 'Peneliti' | 'Admin' | 'Peserta';
  joinedDate: string; // YYYY-MM-DD
  password?: string; // Kata sandi pengguna
}

export interface Genre {
  id: string;
  name: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  bio?: string;
}



