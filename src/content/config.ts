import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		series: z
			.object({
				name: z.string().min(1),
				order: z.number().int().positive(),
			})
			.optional(),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	schema: z.object({}),
});
const projectsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		status: z.enum(["active", "completed", "archived"]).default("active"),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
		tags: z.array(z.string()).default([]),
		image: z.string().optional().default(""),
		repository: z.string().url().optional(),
		demo: z.string().url().optional(),
		entryType: z.enum(["project", "chapter"]).default("project"),
		parentProject: z.string().optional(),
		section: z.string().optional().default(""),
		order: z.number().int().nonnegative().default(0),
		navTitle: z.string().optional(),
	}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
	projects: projectsCollection,
};
