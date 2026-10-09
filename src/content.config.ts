import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const categories = ['AI & ML', 'Web & Apps', 'Games', 'Simulation', 'Data'] as const;

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      summary: z.string(),
      year: z.string(),
      order: z.number(),
      category: z.enum(categories),
      featured: z.boolean().default(false),
      role: z.string(),
      stack: z.array(z.string()),
      highlights: z.array(z.string()).default([]),
      cover: image(),
      coverAlt: z.string(),
      gallery: z
        .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
        .default([]),
      live: z.string().url().optional(),
      links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
      accent: z.string().default('#22d3ee'),
    }),
});

export const collections = { projects };
