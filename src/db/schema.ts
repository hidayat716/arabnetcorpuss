import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table matching CorpusUser type
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').$type<'Peneliti' | 'Admin' | 'Peserta'>().notNull().default('Peserta'),
  joinedDate: text('joined_date').notNull(), // YYYY-MM-DD
  password: text('password'), // Sandi pengguna
  createdAt: timestamp('created_at').defaultNow(),
});

// Articles (News items)
export const articles = pgTable('articles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  author: text('author').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  wordCount: integer('word_count').notNull(),
  image: text('image'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Corpus Documents
export const corpusDocs = pgTable('corpus_docs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  author: text('author').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  wordCount: integer('word_count').notNull(),
  image: text('image'),
  summary: text('summary'),
  documentUrl: text('document_url'),
  spreadsheetUrl: text('spreadsheet_url'),
  morfologiUrl: text('morfologi_url'),
  sintaksisUrl: text('sintaksis_url'),
  semantikUrl: text('semantik_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gallery Items
export const gallery = pgTable('gallery', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  desc: text('desc').notNull(),
  image: text('image').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Genres
export const genres = pgTable('genres', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
