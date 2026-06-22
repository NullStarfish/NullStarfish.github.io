import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function replaceInlineMath(line: string) {
  const segments = line.split(/(`+[^`]*`+)/g);

  return segments
    .map((segment, index) => {
      if (index % 2 === 1) return segment;
      return segment.replace(/\\\((.+?)\\\)/g, (_, formula: string) => `$${formula}$`);
    })
    .join('');
}

function normalizeMathDelimiters(markdown: string) {
  let fence: string | undefined;

  return markdown
    .split('\n')
    .map((line) => {
      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
      if (fenceMatch) {
        if (!fence) {
          fence = fenceMatch[1][0];
        } else if (fence === fenceMatch[1][0]) {
          fence = undefined;
        }
        return line;
      }

      if (fence) return line;
      if (/^\s*\\\[\s*$/.test(line)) return '$$';
      if (/^\s*\\\]\s*$/.test(line)) return '$$';

      return replaceInlineMath(line);
    })
    .join('\n');
}

export default function mathMarkdownProcessor() {
  const baseProcessor = unified({
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, {
      strict: false,
      throwOnError: false,
    }]],
  });

  return {
    ...baseProcessor,
    async createRenderer(shared: Parameters<typeof baseProcessor.createRenderer>[0]) {
      const renderer = await baseProcessor.createRenderer(shared);

      return {
        render(content: string, options?: Parameters<typeof renderer.render>[1]) {
          return renderer.render(normalizeMathDelimiters(content), options);
        },
      };
    },
  };
}
