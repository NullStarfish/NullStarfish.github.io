import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import { absoluteBookPath, getBooks } from '../../../lib/books';

export async function getStaticPaths() {
  const books = await getBooks();
  return books.map((book) => ({
    params: { path: book.relativePath.split('\\').join('/') },
    props: { relativePath: book.relativePath },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const relativePath = String(props.relativePath);
  const filePath = absoluteBookPath(relativePath);
  const contents = await fs.readFile(filePath);

  return new Response(contents, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(contents.byteLength),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(relativePath.split(/[/\\]/).pop() ?? 'book.pdf')}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
