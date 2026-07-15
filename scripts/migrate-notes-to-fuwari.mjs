import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve("notes");
const targetRoot = path.resolve("src/content/posts");

async function walk(directory) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map((entry) => {
		const fullPath = path.join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	}));
	return nested.flat();
}

function splitFrontmatter(markdown) {
	const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	return match
		? { frontmatter: match[1], body: markdown.slice(match[0].length) }
		: { frontmatter: "", body: markdown };
}

function scalar(frontmatter, key) {
	const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
	if (!match) return "";
	const value = match[1].trim();
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		try { return JSON.parse(value); } catch { return value.slice(1, -1); }
	}
	return value;
}

function list(frontmatter, key) {
	const inline = scalar(frontmatter, key);
	if (inline.startsWith("[") && inline.endsWith("]")) {
		return inline.slice(1, -1).split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
	}
	const block = frontmatter.match(new RegExp(`^${key}:\\s*\\r?\\n((?:\\s+-\\s+.*(?:\\r?\\n|$))*)`, "m"));
	return block ? [...block[1].matchAll(/^\s+-\s+(.+?)\s*$/gm)].map((match) => match[1].replace(/^['"]|['"]$/g, "")) : [];
}

function titleFrom(relativePath, body) {
	const heading = body.match(/^#\s+(.+?)\s*$/m)?.[1];
	return heading || path.basename(relativePath, path.extname(relativePath)).replace(/[_-]+/g, " ").trim();
}

function descriptionFrom(body, title) {
	const paragraph = body
		.replace(/```[\s\S]*?```/g, "")
		.split(/\r?\n\s*\r?\n/)
		.map((part) => part.replace(/^#+\s+/gm, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`>#~|]/g, "").replace(/\s+/g, " ").trim())
		.find((part) => part.length >= 8);
	const value = paragraph || `关于“${title}”的学习笔记。`;
	return value.length > 150 ? `${value.slice(0, 147)}…` : value;
}

function gitDate(relativePath) {
	try {
		const output = execFileSync("git", ["log", "--follow", "--format=%cs", "--", path.join("notes", relativePath)], { encoding: "utf8" }).trim();
		return output.split(/\r?\n/).filter(Boolean).at(-1) || "2026-01-01";
	} catch {
		return "2026-01-01";
	}
}

function serialize(data) {
	return [
		"---",
		`title: ${JSON.stringify(data.title)}`,
		`published: ${data.published}`,
		...(data.updated ? [`updated: ${data.updated}`] : []),
		`description: ${JSON.stringify(data.description)}`,
		`tags: [${data.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
		`category: ${JSON.stringify(data.category)}`,
		`draft: ${data.draft}`,
		"---",
		"",
	].join("\n");
}

await fs.rm(targetRoot, { recursive: true, force: true });
await fs.cp(sourceRoot, targetRoot, { recursive: true });

const files = await walk(targetRoot);
let migrated = 0;
for (const file of files) {
	if (!/\.md$/i.test(file)) continue;
	const relativePath = path.relative(targetRoot, file);
	const markdown = await fs.readFile(file, "utf8");
	const { frontmatter, body } = splitFrontmatter(markdown);
	const title = scalar(frontmatter, "title") || titleFrom(relativePath, body);
	const category = scalar(frontmatter, "topic") || relativePath.split(path.sep)[0] || "未分类";
	const published = scalar(frontmatter, "created") || scalar(frontmatter, "published") || gitDate(relativePath);
	const updated = scalar(frontmatter, "updated");
	const description = scalar(frontmatter, "description") || descriptionFrom(body, title);
	const tags = list(frontmatter, "tags");
	const draft = scalar(frontmatter, "draft") === "true";
	await fs.writeFile(file, `${serialize({ title, category, published, updated, description, tags, draft })}${body.replace(/^\s+/, "")}`, "utf8");
	migrated += 1;
}

console.log(`Migrated ${migrated} Markdown notes into Fuwari posts.`);
