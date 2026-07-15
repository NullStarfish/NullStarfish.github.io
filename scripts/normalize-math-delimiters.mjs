import { promises as fs } from "node:fs";
import path from "node:path";

const roots = ["notes", "src/content/posts"];

async function walk(directory) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const files = await Promise.all(entries.map((entry) => {
		const file = path.join(directory, entry.name);
		return entry.isDirectory() ? walk(file) : [file];
	}));
	return files.flat();
}

let changedFiles = 0;
let changedDelimiters = 0;

for (const root of roots) {
	for (const file of await walk(root)) {
		if (!file.endsWith(".md")) continue;
		const source = await fs.readFile(file, "utf8");
		let replacements = 0;
		const expanded = source.replace(/^[ \t]*\${4}[ \t]*$/gm, () => {
			replacements += 2;
			return "$$\n\n$$";
		});
		const normalized = expanded.replace(
			/^(?:[ \t]*\\[\[\]][ \t]*|[ \t]*#?[ \t]*[\[\]][ \t]*)$/gm,
			() => {
				replacements += 1;
				return "$$";
			},
		);
		if (replacements > 0) {
			await fs.writeFile(file, normalized, "utf8");
			changedFiles += 1;
			changedDelimiters += replacements;
		}
	}
}

console.log(`Normalized ${changedDelimiters} math delimiters in ${changedFiles} files.`);
