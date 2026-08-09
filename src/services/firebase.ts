import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { Article, CorpusUser, Genre, TeamMember } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const isPlaceholder = !firebaseConfig || firebaseConfig.projectId === 'remixed-project-id';

// Initialize Firebase client SDK for Auth & Firestore
const app = !isPlaceholder 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth = app ? getAuth(app) : null;
const dbId = (firebaseConfig as any)?.firestoreDatabaseId;
export const db = app ? (dbId ? getFirestore(app, dbId) : getFirestore(app)) : null;

// Helper to construct Auth headers with JWT token
const getAuthHeader = async () => {
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      return { 'Authorization': `Bearer ${token}` };
    } catch (e) {
      console.warn('Failed to get auth token:', e);
    }
  }
  return {};
};

// Gallery Item interface
export interface GalleryItem {
  id: number;
  title: string;
  desc: string;
  image: string;
}

// Helper to convert JS object to Firestore REST API field values
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export async function saveViaRestApi(collectionName: string, documentId: string, data: Record<string, any>): Promise<boolean> {
  const apiKey = (firebaseConfig as any)?.apiKey;
  const projectId = (firebaseConfig as any)?.projectId;
  const databaseId = (firebaseConfig as any)?.firestoreDatabaseId || '(default)';
  if (!apiKey || !projectId || projectId === 'remixed-project-id') return false;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}/${encodeURIComponent(documentId)}?key=${apiKey}`;
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson?.error?.message || res.statusText;
    throw new Error(`Firestore REST API (${res.status}): ${message}`);
  }

  return true;
}

export async function deleteViaRestApi(collectionName: string, documentId: string): Promise<boolean> {
  const apiKey = (firebaseConfig as any)?.apiKey;
  const projectId = (firebaseConfig as any)?.projectId;
  const databaseId = (firebaseConfig as any)?.firestoreDatabaseId || '(default)';
  if (!apiKey || !projectId || projectId === 'remixed-project-id') return false;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}/${encodeURIComponent(documentId)}?key=${apiKey}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Direct Firestore + REST Fallback Integrations
// -------------------------------------------------------------

// 1. Articles (News)
export async function getArticlesFromFirestore(initialArticles: Article[]): Promise<Article[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'articles'));
      if (!snap.empty) {
        return snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            title: data.title || '',
            content: data.content || '',
            author: data.author || '',
            category: data.category || 'Umum',
            date: data.date || new Date().toISOString().split('T')[0],
            wordCount: typeof data.wordCount === 'number' ? data.wordCount : (data.content ? data.content.trim().split(/\s+/).length : 0),
            summary: data.summary || '',
            image: data.image || '',
            fileUrl: data.fileUrl || '',
            spreadsheetUrl: data.spreadsheetUrl || '',
            morfologiUrl: data.morfologiUrl || '',
            sintaksisUrl: data.sintaksisUrl || '',
            semantikUrl: data.semantikUrl || '',
            documentUrl: data.documentUrl || ''
          } as Article;
        });
      }
    } catch (e) {
      console.warn('Firestore fetch articles error, falling back:', e);
    }
  }

  try {
    const res = await fetch('/api/articles');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (error) {
    console.error('Error fetching articles from API:', error);
  }
  return initialArticles;
}

export async function saveArticleToFirestore(art: Article): Promise<void> {
  if (art.id) {
    try {
      await saveViaRestApi('articles', String(art.id), art);
    } catch (e) {
      if (db) {
        try {
          await setDoc(doc(db, 'articles', String(art.id)), art, { merge: true });
        } catch (err) {
          console.warn('Firestore save article error:', err);
        }
      }
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(art)
    });
  } catch (e) {
    // optional API sync fallback
  }
}

export async function updateArticleInFirestore(art: Article): Promise<void> {
  return saveArticleToFirestore(art);
}

export async function deleteArticleFromFirestore(id: string): Promise<void> {
  try {
    await deleteViaRestApi('articles', String(id));
  } catch (e) {
    // ignore REST error
  }
  if (db) {
    try {
      await deleteDoc(doc(db, 'articles', String(id)));
    } catch (e) {
      console.warn('Firestore delete article error:', e);
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch(`/api/articles/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });
  } catch (e) {
    // optional API sync fallback
  }
}

// 2. Corpus Documents
export async function getCorpusDocsFromFirestore(initialDocs: Article[]): Promise<Article[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'corpus_docs'));
      if (!snap.empty) {
        return snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            title: data.title || '',
            content: data.content || '',
            author: data.author || '',
            category: data.category || 'Umum',
            date: data.date || new Date().toISOString().split('T')[0],
            wordCount: typeof data.wordCount === 'number' ? data.wordCount : (data.content ? data.content.trim().split(/\s+/).length : 0),
            summary: data.summary || '',
            image: data.image || '',
            fileUrl: data.fileUrl || '',
            spreadsheetUrl: data.spreadsheetUrl || '',
            morfologiUrl: data.morfologiUrl || '',
            sintaksisUrl: data.sintaksisUrl || '',
            semantikUrl: data.semantikUrl || '',
            documentUrl: data.documentUrl || ''
          } as Article;
        });
      }
    } catch (e) {
      console.warn('Firestore fetch corpus_docs error, falling back:', e);
    }
  }

  try {
    const res = await fetch('/api/corpus_docs');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (error) {
    console.error('Error fetching corpus docs from API:', error);
  }
  return initialDocs;
}

export async function saveCorpusDocToFirestore(d: Article): Promise<void> {
  if (d.id) {
    try {
      await saveViaRestApi('corpus_docs', String(d.id), d);
    } catch (e) {
      if (db) {
        try {
          await setDoc(doc(db, 'corpus_docs', String(d.id)), d, { merge: true });
        } catch (err) {
          console.warn('Firestore save corpus doc error:', err);
        }
      }
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch('/api/corpus_docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(d)
    });
  } catch (e) {
    // optional API sync fallback
  }
}

export async function updateCorpusDocInFirestore(d: Article): Promise<void> {
  return saveCorpusDocToFirestore(d);
}

export async function deleteCorpusDocFromFirestore(id: string): Promise<void> {
  try {
    await deleteViaRestApi('corpus_docs', String(id));
  } catch (e) {
    // ignore
  }
  if (db) {
    try {
      await deleteDoc(doc(db, 'corpus_docs', String(id)));
    } catch (e) {
      console.warn('Firestore delete corpus doc error:', e);
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch(`/api/corpus_docs/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });
  } catch (e) {
    // optional API sync fallback
  }
}

// 3. Gallery
export async function getGalleryFromFirestore(initialGallery: GalleryItem[]): Promise<GalleryItem[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'gallery'));
      if (!snap.empty) {
        return snap.docs.map(docSnap => {
          const data = docSnap.data();
          const parsedId = typeof data.id === 'number' ? data.id : parseInt(docSnap.id) || Date.now();
          return {
            id: parsedId,
            title: data.title || '',
            desc: data.desc || '',
            image: data.image || ''
          } as GalleryItem;
        });
      }
    } catch (e) {
      console.warn('Firestore fetch gallery error, falling back:', e);
    }
  }

  try {
    const res = await fetch('/api/gallery');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (error) {
    console.error('Error fetching gallery from API:', error);
  }
  return initialGallery;
}

export async function saveGalleryToFirestore(item: GalleryItem): Promise<void> {
  if (item.id) {
    try {
      await saveViaRestApi('gallery', String(item.id), item);
    } catch (e) {
      if (db) {
        try {
          await setDoc(doc(db, 'gallery', String(item.id)), item, { merge: true });
        } catch (err) {
          console.warn('Firestore save gallery item error:', err);
        }
      }
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(item)
    });
  } catch (e) {
    // optional API sync fallback
  }
}

export async function deleteGalleryFromFirestore(id: number | string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, 'gallery', String(id)));
    } catch (e) {
      console.warn('Firestore delete gallery error:', e);
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch(`/api/gallery/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });
  } catch (e) {
    // optional API sync fallback
  }
}

// 4. Users
export async function getUserFromFirestore(id: string): Promise<CorpusUser | null> {
  if (db) {
    try {
      const docSnap = await getDoc(doc(db, 'users', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'Peserta',
          joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
          password: data.password || ''
        } as CorpusUser;
      }
    } catch (e) {
      console.warn('Firestore fetch user error:', e);
    }
  }

  try {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
    if (res.ok) return await res.json();
  } catch (error) {
    console.error('Error fetching user from API:', error);
  }
  return null;
}

export async function getUsersFromFirestore(initialUsers: CorpusUser[]): Promise<CorpusUser[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        return snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            name: data.name || '',
            email: data.email || '',
            role: data.role || 'Peserta',
            joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
            password: data.password || ''
          } as CorpusUser;
        });
      }
    } catch (e) {
      console.warn('Firestore fetch users error, falling back:', e);
    }
  }

  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (error) {
    console.error('Error fetching users from API:', error);
  }
  return initialUsers;
}

export async function saveUserToFirestore(user: CorpusUser): Promise<void> {
  const userId = user.id || auth?.currentUser?.uid || user.email;
  const userPayload = {
    ...user,
    id: userId,
    uid: auth?.currentUser?.uid || userId
  };

  if (userId) {
    try {
      await saveViaRestApi('users', String(userId), userPayload);
    } catch (e) {
      if (db) {
        try {
          await setDoc(doc(db, 'users', String(userId)), userPayload, { merge: true });
        } catch (err) {
          console.warn('Firestore save user error:', err);
        }
      }
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(userPayload)
    });
  } catch (e) {
    // optional API sync fallback
  }
}

export async function updateUserInFirestore(user: CorpusUser): Promise<void> {
  return saveUserToFirestore(user);
}

export async function deleteUserFromFirestore(id: string): Promise<void> {
  try {
    await deleteViaRestApi('users', String(id));
  } catch (e) {
    // ignore
  }
  if (db) {
    try {
      await deleteDoc(doc(db, 'users', String(id)));
    } catch (e) {
      console.warn('Firestore delete user error:', e);
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });
  } catch (e) {
    // optional API sync fallback
  }
}

// 5. Genres
export async function getGenresFromFirestore(initialGenres: Genre[]): Promise<Genre[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'genres'));
      if (!snap.empty) {
        return snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            name: data.name || ''
          } as Genre;
        });
      }
    } catch (e) {
      console.warn('Firestore fetch genres error, falling back:', e);
    }
  }

  try {
    const res = await fetch('/api/genres');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (error) {
    console.error('Error fetching genres from API:', error);
  }
  return initialGenres;
}

export async function saveGenreToFirestore(genre: Genre): Promise<void> {
  if (genre.id) {
    try {
      await saveViaRestApi('genres', String(genre.id), genre);
    } catch (e) {
      if (db) {
        try {
          await setDoc(doc(db, 'genres', String(genre.id)), genre, { merge: true });
        } catch (err) {
          console.warn('Firestore save genre error:', err);
        }
      }
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch('/api/genres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(genre)
    });
  } catch (e) {
    // optional API sync fallback
  }
}

export async function deleteGenreFromFirestore(id: string): Promise<void> {
  try {
    await deleteViaRestApi('genres', String(id));
  } catch (e) {
    // ignore
  }
  if (db) {
    try {
      await deleteDoc(doc(db, 'genres', String(id)));
    } catch (e) {
      console.warn('Firestore delete genre error:', e);
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    await fetch(`/api/genres/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });
  } catch (e) {
    // optional API sync fallback
  }
}

// Helper to check if a document already exists in Firestore
export async function checkDocExistsInFirestore(collectionName: string, documentId: string): Promise<boolean> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, collectionName, String(documentId)));
      if (snap.exists()) return true;
    } catch {
      // ignore & fallback to REST check
    }
  }

  const apiKey = (firebaseConfig as any)?.apiKey;
  const projectId = (firebaseConfig as any)?.projectId;
  const databaseId = (firebaseConfig as any)?.firestoreDatabaseId || '(default)';
  if (!apiKey || !projectId || projectId === 'remixed-project-id') return false;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}/${encodeURIComponent(String(documentId))}?key=${apiKey}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Seed/Sync All Data directly into Firebase Firestore
// -------------------------------------------------------------
export async function seedAllDataToFirestore(
  articles: Article[],
  corpusDocs: Article[],
  gallery: GalleryItem[],
  genres: Genre[],
  users: CorpusUser[]
): Promise<{ count: number; error?: string }> {
  const allCandidateTasks: Array<{ col: string; id: string; data: any }> = [];

  for (const item of articles) {
    if (item.id) allCandidateTasks.push({ col: 'articles', id: String(item.id), data: item });
  }
  for (const item of corpusDocs) {
    if (item.id) allCandidateTasks.push({ col: 'corpus_docs', id: String(item.id), data: item });
  }
  for (const item of gallery) {
    if (item.id) allCandidateTasks.push({ col: 'gallery', id: String(item.id), data: item });
  }
  for (const item of genres) {
    if (item.id) allCandidateTasks.push({ col: 'genres', id: String(item.id), data: item });
  }
  for (const item of users) {
    const uId = item.id || item.email;
    if (uId) allCandidateTasks.push({ col: 'users', id: String(uId), data: item });
  }

  // Filter out documents that ALREADY exist in Firestore to prevent overwriting user edits/uploads
  const missingTasks: Array<{ col: string; id: string; data: any }> = [];
  for (let i = 0; i < allCandidateTasks.length; i += 5) {
    const chunk = allCandidateTasks.slice(i, i + 5);
    await Promise.all(
      chunk.map(async (task) => {
        const exists = await checkDocExistsInFirestore(task.col, task.id);
        if (!exists) {
          missingTasks.push(task);
        }
      })
    );
  }

  if (missingTasks.length === 0) {
    return { count: 0 };
  }

  const allTasks = missingTasks;

  // Attempt 1: Direct HTTPS REST API (Instant, non-blocking, clear status codes)
  try {
    let successCount = 0;
    for (let i = 0; i < allTasks.length; i += 5) {
      const chunk = allTasks.slice(i, i + 5);
      await Promise.all(
        chunk.map(async (task) => {
          await saveViaRestApi(task.col, task.id, task.data);
          successCount++;
        })
      );
    }
    return { count: successCount };
  } catch (err: any) {
    console.warn('REST API Seed failed, checking error or attempting SDK fallback:', err);
    const errMsg = err?.message || '';

    if (errMsg.includes('NOT_FOUND') || errMsg.includes('does not exist')) {
      return {
        count: 0,
        error: `Database Firestore belum dibuat pada Google Cloud / Firebase Console project '${(firebaseConfig as any)?.projectId}'. Buka Firebase Console > Firestore Database > Klik 'Create Database'.`
      };
    }

    if (errMsg.includes('PERMISSION_DENIED')) {
      return {
        count: 0,
        error: `Akses ditolak (Permission Denied). Pastikan Firestore Security Rules mengizinkan write access.`
      };
    }

    // Attempt 2: SDK WriteBatch Fallback
    if (db) {
      try {
        const batch = writeBatch(db);
        for (const task of allTasks) {
          batch.set(doc(db, task.col, task.id), task.data, { merge: true });
        }
        await batch.commit();
        return { count: allTasks.length };
      } catch (sdkErr: any) {
        return { count: 0, error: sdkErr?.message || errMsg || 'Gagal menyimpan ke Firestore.' };
      }
    }

    return { count: 0, error: errMsg || 'Gagal menyimpan data ke Firestore.' };
  }
}

// -------------------------------------------------------------
// Real-Time 2-Way Synchronized Listeners (Firestore <-> Website)
// -------------------------------------------------------------

export function subscribeArticlesFromFirestore(
  onUpdate: (articles: Article[]) => void,
  initialFallback: Article[]
): () => void {
  if (!db) {
    onUpdate(initialFallback);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'articles'),
    (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            title: data.title || '',
            content: data.content || '',
            author: data.author || '',
            category: data.category || 'Umum',
            date: data.date || new Date().toISOString().split('T')[0],
            wordCount: typeof data.wordCount === 'number' ? data.wordCount : (data.content ? data.content.trim().split(/\s+/).length : 0),
            summary: data.summary || '',
            image: data.image || '',
            fileUrl: data.fileUrl || '',
            spreadsheetUrl: data.spreadsheetUrl || '',
            morfologiUrl: data.morfologiUrl || '',
            sintaksisUrl: data.sintaksisUrl || '',
            semantikUrl: data.semantikUrl || '',
            documentUrl: data.documentUrl || ''
          } as Article;
        });
        onUpdate(items);
      } else {
        onUpdate(initialFallback);
      }
    },
    (error) => {
      console.warn('Realtime articles sync warning:', error);
    }
  );
}

export function subscribeCorpusDocsFromFirestore(
  onUpdate: (docs: Article[]) => void,
  initialFallback: Article[]
): () => void {
  if (!db) {
    onUpdate(initialFallback);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'corpus_docs'),
    (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            title: data.title || '',
            content: data.content || '',
            author: data.author || '',
            category: data.category || 'Umum',
            date: data.date || new Date().toISOString().split('T')[0],
            wordCount: typeof data.wordCount === 'number' ? data.wordCount : (data.content ? data.content.trim().split(/\s+/).length : 0),
            summary: data.summary || '',
            image: data.image || '',
            fileUrl: data.fileUrl || '',
            spreadsheetUrl: data.spreadsheetUrl || '',
            morfologiUrl: data.morfologiUrl || '',
            sintaksisUrl: data.sintaksisUrl || '',
            semantikUrl: data.semantikUrl || '',
            documentUrl: data.documentUrl || ''
          } as Article;
        });
        onUpdate(items);
      } else {
        onUpdate(initialFallback);
      }
    },
    (error) => {
      console.warn('Realtime corpus_docs sync warning:', error);
    }
  );
}

export function subscribeGalleryFromFirestore(
  onUpdate: (gallery: GalleryItem[]) => void,
  initialFallback: GalleryItem[]
): () => void {
  if (!db) {
    onUpdate(initialFallback);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'gallery'),
    (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          const parsedId = typeof data.id === 'number' ? data.id : parseInt(docSnap.id) || Date.now();
          return {
            id: parsedId,
            title: data.title || '',
            desc: data.desc || '',
            image: data.image || ''
          } as GalleryItem;
        });
        onUpdate(items);
      } else {
        onUpdate(initialFallback);
      }
    },
    (error) => {
      console.warn('Realtime gallery sync warning:', error);
    }
  );
}

export function subscribeUsersFromFirestore(
  onUpdate: (users: CorpusUser[]) => void,
  initialFallback: CorpusUser[]
): () => void {
  if (!db) {
    onUpdate(initialFallback);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            name: data.name || '',
            email: data.email || '',
            role: data.role || 'Peserta',
            joinedDate: data.joinedDate || new Date().toISOString().split('T')[0]
          } as CorpusUser;
        });
        onUpdate(items);
      } else {
        onUpdate(initialFallback);
      }
    },
    (error) => {
      console.warn('Realtime users sync warning:', error);
    }
  );
}

export function subscribeGenresFromFirestore(
  onUpdate: (genres: Genre[]) => void,
  initialFallback: Genre[]
): () => void {
  if (!db) {
    onUpdate(initialFallback);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'genres'),
    (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            name: data.name || ''
          } as Genre;
        });
        onUpdate(items);
      } else {
        onUpdate(initialFallback);
      }
    },
    (error) => {
      console.warn('Realtime genres sync warning:', error);
    }
  );
}

// 7. Team Members (Tim Pengembang)
export async function getTeamMembersFromFirestore(initialMembers: TeamMember[]): Promise<TeamMember[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'team_members'));
      if (!snap.empty) {
        return snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            name: data.name || '',
            role: data.role || 'Peneliti',
            photoUrl: data.photoUrl || '',
            bio: data.bio || ''
          } as TeamMember;
        });
      }
    } catch (e) {
      console.warn('Firestore fetch team_members error, falling back:', e);
    }
  }
  return initialMembers;
}

export async function saveTeamMemberToFirestore(member: TeamMember): Promise<void> {
  if (member.id) {
    try {
      await saveViaRestApi('team_members', String(member.id), member);
    } catch (e) {
      if (db) {
        try {
          await setDoc(doc(db, 'team_members', String(member.id)), member, { merge: true });
        } catch (err) {
          console.warn('Firestore save team member error:', err);
        }
      }
    }
  }
}

export async function deleteTeamMemberFromFirestore(id: string): Promise<void> {
  try {
    await deleteViaRestApi('team_members', String(id));
  } catch (e) {
    // ignore
  }
  if (db) {
    try {
      await deleteDoc(doc(db, 'team_members', String(id)));
    } catch (e) {
      console.warn('Firestore delete team member error:', e);
    }
  }
}

export function subscribeTeamMembersFromFirestore(
  onUpdate: (members: TeamMember[]) => void,
  initialFallback: TeamMember[]
): () => void {
  if (!db) {
    onUpdate(initialFallback);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'team_members'),
    (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id || data.id,
            name: data.name || '',
            role: data.role || 'Peneliti',
            photoUrl: data.photoUrl || '',
            bio: data.bio || ''
          } as TeamMember;
        });
        onUpdate(items);
      } else {
        onUpdate(initialFallback);
      }
    },
    (error) => {
      console.warn('Realtime team_members sync warning:', error);
    }
  );
}


