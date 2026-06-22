import { getCollection, type CollectionEntry } from 'astro:content';

export type NoteEntry = CollectionEntry<'notes'>;

export interface Note {
  entry: NoteEntry;
  title: string;
  description: string;
  slug: string;
  topic: string;
  tags: string[];
  created?: Date;
  updated?: Date;
  featured: boolean;
  draft: boolean;
}

function titleFromId(id: string) {
  const filename = id.split('/').pop()?.replace(/\.md$/i, '') ?? id;
  return decodeURIComponent(filename).replace(/[-_]+/g, ' ');
}

function slugFromId(id: string) {
  return id
    .replace(/\.md$/i, '')
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .filter(Boolean)
    .join('-');
}

function descriptionFromBody(body?: string) {
  if (!body) return '这篇笔记暂时没有摘要。';

  const paragraph = body
    .replace(/^---[\s\S]*?---/m, '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#') && !part.startsWith('```'));

  if (!paragraph) return '这篇笔记暂时没有摘要。';

  const plain = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return plain.length > 140 ? `${plain.slice(0, 137)}…` : plain;
}

function normalize(entry: NoteEntry): Note {
  return {
    entry,
    title: entry.data.title ?? titleFromId(entry.id),
    description: entry.data.description ?? descriptionFromBody(entry.body),
    slug: entry.data.slug ?? slugFromId(entry.id),
    topic: entry.data.topic,
    tags: entry.data.tags,
    created: entry.data.created,
    updated: entry.data.updated,
    featured: entry.data.featured,
    draft: entry.data.draft,
  };
}

function noteTimestamp(note: Note) {
  return note.updated?.getTime() ?? note.created?.getTime() ?? 0;
}

export async function getAllNotes() {
  const notes = (await getCollection('notes')).map(normalize);
  const seen = new Map<string, string>();

  for (const note of notes) {
    const existing = seen.get(note.slug);
    if (existing) {
      throw new Error(`发现重复 slug "${note.slug}"：${existing} 与 ${note.entry.id}`);
    }
    seen.set(note.slug, note.entry.id);
  }

  return notes.sort((a, b) => {
    const dateDifference = noteTimestamp(b) - noteTimestamp(a);
    return dateDifference || a.title.localeCompare(b.title, 'zh-CN');
  });
}

export async function getPublishedNotes() {
  return (await getAllNotes()).filter((note) => !note.draft);
}

export function groupCounts(values: string[]) {
  return [...values.reduce((counts, value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  }, new Map<string, number>())]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function formatDate(date?: Date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function topicHref(topic: string) {
  return `/topics/${encodeURIComponent(topic)}/`;
}

export function tagHref(tag: string) {
  return `/tags/${encodeURIComponent(tag)}/`;
}
