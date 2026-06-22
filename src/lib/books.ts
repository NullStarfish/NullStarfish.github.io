import { promises as fs } from 'node:fs';
import path from 'node:path';

const booksRoot = path.resolve(process.cwd(), 'books');

interface BookMetadata {
  title?: string;
  author?: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
}

export interface Book {
  title: string;
  author?: string;
  description: string;
  tags: string[];
  featured: boolean;
  slug: string;
  relativePath: string;
  fileUrl: string;
  size: number;
}

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));
  return files.flat();
}

function cleanName(value: string) {
  return value
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugFromPath(relativePath: string) {
  return relativePath
    .replace(/\.pdf$/i, '')
    .split(path.sep)
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

function encodePath(relativePath: string) {
  return relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment).replaceAll('%2C', ','))
    .join('/');
}

async function readMetadata(pdfPath: string): Promise<BookMetadata> {
  const metadataPath = pdfPath.replace(/\.pdf$/i, '.json');
  const contents = await fs.readFile(metadataPath, 'utf8').catch(() => undefined);
  if (!contents) return {};

  try {
    const metadata = JSON.parse(contents) as BookMetadata;
    if (metadata.tags && !Array.isArray(metadata.tags)) {
      throw new Error('"tags" 必须是字符串数组');
    }
    return metadata;
  } catch (error) {
    throw new Error(`无法解析书籍元数据 ${path.relative(process.cwd(), metadataPath)}：${String(error)}`);
  }
}

export async function getBooks(): Promise<Book[]> {
  const pdfFiles = (await walk(booksRoot))
    .filter((filePath) => /\.pdf$/i.test(filePath))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));

  const books = await Promise.all(pdfFiles.map(async (pdfPath) => {
    const relativePath = path.relative(booksRoot, pdfPath);
    const metadata = await readMetadata(pdfPath);
    const stat = await fs.stat(pdfPath);
    const directoryTags = path.dirname(relativePath) === '.'
      ? []
      : path.dirname(relativePath).split(path.sep).map(cleanName);
    const title = metadata.title?.trim() || cleanName(path.basename(pdfPath));

    return {
      title,
      author: metadata.author?.trim() || undefined,
      description: metadata.description?.trim() || `《${title}》的 PDF 阅读版本。`,
      tags: [...new Set([...(metadata.tags ?? []), ...directoryTags])],
      featured: metadata.featured ?? false,
      slug: slugFromPath(relativePath),
      relativePath,
      fileUrl: `/library/files/${encodePath(relativePath)}`,
      size: stat.size,
    };
  }));

  const seen = new Map<string, string>();
  for (const book of books) {
    const existing = seen.get(book.slug);
    if (existing) {
      throw new Error(`书架中发现重复 slug "${book.slug}"：${existing} 与 ${book.relativePath}`);
    }
    seen.set(book.slug, book.relativePath);
  }

  return books.sort((a, b) =>
    Number(b.featured) - Number(a.featured)
    || a.title.localeCompare(b.title, 'zh-CN'));
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function absoluteBookPath(relativePath: string) {
  const resolved = path.resolve(booksRoot, relativePath);
  if (!resolved.startsWith(`${booksRoot}${path.sep}`)) {
    throw new Error('非法 PDF 路径');
  }
  return resolved;
}
