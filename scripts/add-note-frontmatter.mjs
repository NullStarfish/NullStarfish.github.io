import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const notesRoot = path.resolve(process.cwd(), 'notes');
const shouldWrite = process.argv.includes('--write');

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));

  return files.flat();
}

function titleFromPath(filePath) {
  return path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, ' ').trim();
}

function plainText(markdown) {
  return markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?]]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`>#~|]/g, '')
    .replace(/\\([()[\]])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function descriptionFromBody(body, title) {
  let inFence = false;
  const paragraphs = [];
  let current = [];

  const flush = () => {
    const value = plainText(current.join(' '));
    if (value) paragraphs.push(value);
    current = [];
  };

  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      flush();
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^\s*(---+|\$\$|\\\[|\\\])\s*$/.test(line)) {
      flush();
      continue;
    }
    if (/^\s*(#{1,6}\s+|!\[|https?:\/\/)/.test(line)) {
      flush();
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    current.push(line.trim());
  }
  flush();

  const description = paragraphs.find((paragraph) => paragraph.length >= 8)
    ?? paragraphs[0]
    ?? `关于“${title}”的学习笔记。`;

  return description.length > 120 ? `${description.slice(0, 117)}…` : description;
}

function contentMetadata(filePath) {
  const relative = path.relative(notesRoot, filePath);
  const parts = relative.split(path.sep);
  const [root, section, subsection] = parts;

  if (root === 'AI') {
    return {
      topic: '人工智能',
      tags: ['AI', ...(section === 'AI&ML' ? ['机器学习'] : [])],
    };
  }

  if (root === 'Linux-101') {
    if (section === 'scala-chisel-notes') {
      const subsectionTags = {
        'scala特性': 'Scala 特性',
        'chisel_utils': 'Chisel 工具',
        '类和方法': 'Scala 类与方法',
        '实战例子': 'Chisel 实战',
      };
      return {
        topic: 'Scala 与 Chisel',
        tags: ['Scala', 'Chisel', ...(subsectionTags[subsection] ? [subsectionTags[subsection]] : [])],
      };
    }

    const sections = {
      git: { topic: 'Git', tags: ['Linux', 'Git'] },
      os: { topic: 'Linux', tags: ['Linux', '操作系统'] },
      shell: { topic: 'Shell', tags: ['Linux', 'Shell'] },
      '编译': { topic: '编译工具', tags: ['Linux', '编译'] },
    };
    const metadata = sections[section] ?? { topic: 'Linux', tags: ['Linux'] };
    const extraTag = parts.length > 3 ? subsection : undefined;

    return {
      ...metadata,
      tags: [...metadata.tags, ...(extraTag ? [extraTag] : [])],
    };
  }

  return {
    topic: root || '未分类',
    tags: [],
  };
}

function serializeFrontmatter({ title, description, topic, tags }) {
  const tagLines = tags.map((tag) => `  - ${JSON.stringify(tag)}`).join('\n');

  return [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `topic: ${JSON.stringify(topic)}`,
    'tags:',
    tagLines || '  []',
    'featured: false',
    'draft: false',
    '---',
    '',
  ].join('\n');
}

const markdownFiles = (await walk(notesRoot))
  .filter((filePath) => /\.md$/i.test(filePath))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const changed = [];
for (const filePath of markdownFiles) {
  const body = await fs.readFile(filePath, 'utf8');
  if (body.startsWith('---\n') || body.startsWith('---\r\n')) continue;

  const title = titleFromPath(filePath);
  const metadata = contentMetadata(filePath);
  const description = descriptionFromBody(body, title);
  const frontmatter = serializeFrontmatter({ title, description, ...metadata });

  changed.push(path.relative(process.cwd(), filePath));
  if (shouldWrite) {
    await fs.writeFile(filePath, `${frontmatter}${body}`, 'utf8');
  }
}

const mode = shouldWrite ? 'Updated' : 'Would update';
console.log(`${mode} ${changed.length} Markdown files.`);
for (const filePath of changed) console.log(filePath);
