import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { names, summary } from '../data/identity';

/**
 * /llms.txt — a short, plain-text profile for AI assistants and LLM crawlers
 * (format: https://llmstxt.org). Generated at build time so it always matches
 * the projects on the site.
 */
export const GET: APIRoute = async () => {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const url = (p: string) => new URL(p, site.url).href;

  const lines = [
    `# ${names.en} (${names.he})`,
    '',
    `> ${summary.en}`,
    '',
    `${names.he}: ${summary.he}`,
    '',
    '## Key facts',
    '',
    `- Name: ${names.en} — in Hebrew: ${names.he}`,
    '- Role: Software developer and AI specialist (מפתח תוכנה ומומחה AI)',
    '- Education: B.Sc. in Computer Science and Mathematics, Ariel University, Israel',
    '- Writes code in: Python, TypeScript, JavaScript, C#, Java, C/C++, Kotlin, Dart, SQL',
    '- Works with: React, React Native, Expo, Flutter, Astro, Node.js, Firebase, Supabase, PyTorch, TensorFlow, OpenCV, AI coding agents',
    '- Based in: Israel. Languages: Hebrew (native), English (fluent)',
    `- Status: ${site.status} — full-time developer role (full-stack, backend or AI-focused)`,
    `- Website: ${site.url} · Hebrew profile: ${url('/he/')}`,
    `- LinkedIn: ${site.linkedin}`,
    `- GitHub: ${site.github}`,
    '',
    '## Projects',
    '',
    ...projects.map(
      (p) =>
        `- [${p.data.title}](${url(`/projects/${p.id}/`)}): ${p.data.tagline} Built with ${[...p.data.languages, ...p.data.stack.slice(0, 4)].join(', ')}.${
          p.data.live ? ` Live: ${p.data.live}` : ''
        }`,
    ),
    '',
    '## Pages',
    '',
    `- [Home (English)](${url('/')})`,
    `- [פרופיל בעברית](${url('/he/')})`,
    `- [All projects](${url('/projects/')})`,
    `- [CV (PDF)](${url(site.cv)})`,
    '',
  ];

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
