export const site = {
  name: 'Roni Michaeli',
  role: 'AI-Native Full-Stack Developer',
  url: 'https://ronimichaeli.com',
  title: 'Roni Michaeli — AI-Native Full-Stack Developer',
  description:
    'Roni Michaeli builds AI-powered products end to end — LLM apps, machine-learning models and fast, polished web and mobile experiences. B.Sc. Computer Science & Mathematics, Ariel University.',
  location: 'Israel',
  status: 'Open to new roles',
  // The address is assembled in the browser so it isn't sitting in the HTML for scrapers.
  emailParts: ['roniro5604', 'gmail.com'] as const,
  whatsapp: 'https://wa.me/972544396677',
  github: 'https://github.com/roni5604',
  cv: '/cv/Roni-Michaeli-CV.pdf',
  updated: '2026-10-10',
};

export const nav = [
  { label: 'Work', href: '/#work' },
  { label: 'About', href: '/#about' },
  { label: 'AI', href: '/#ai' },
  { label: 'Journey', href: '/#journey' },
  { label: 'Contact', href: '/#contact' },
];

export const roles = [
  'ships LLM-powered products',
  'builds with AI agents, not against them',
  'trains models that actually learn',
  'turns maths into fast code',
  'owns features from database to pixel',
];

export const stack = [
  'Python',
  'PyTorch',
  'TensorFlow',
  'LLM APIs',
  'AI Agents',
  'Claude Code',
  'Cursor',
  'OpenCV',
  'React',
  'React Native',
  'Expo',
  'Flutter',
  'Astro',
  'TypeScript',
  'Node.js',
  'Firebase',
  'Supabase',
  'C#  ·  .NET',
  'Java',
  'Kotlin',
  'C / C++',
  'SQL',
  'Solidity',
  'Git',
];

export const aiPillars = [
  {
    id: 'llm',
    kicker: '01',
    title: 'LLM-powered products',
    body: 'Features where a language model does real work — understanding text, generating content, and making decisions inside a product people actually use. Prompts, tools, evals and guardrails treated as code.',
    points: ['Prompt & tool design', 'Structured outputs', 'Evaluation loops'],
  },
  {
    id: 'agentic',
    kicker: '02',
    title: 'AI-native development',
    body: 'I build with coding agents as part of the team. Specs, tests and CI keep them honest, so whole products — like a seven-game multiplayer card platform — go from idea to production in weeks, not quarters.',
    points: ['Claude Code & Cursor', 'Spec-driven workflows', 'Tests & CI as guardrails'],
  },
  {
    id: 'ml',
    kicker: '03',
    title: 'Machine & deep learning',
    body: 'From baselines to CNNs: data preparation, training, honest evaluation and shipping the model behind a usable interface. Plus the maths underneath — I studied it, not just imported it.',
    points: ['PyTorch & TensorFlow', 'Computer vision', 'Data for NLP'],
  },
];

export const journey = [
  {
    when: '2017 — 2021',
    title: 'Operations Room Manager · IDF',
    body: 'Ran a 24/7 war room at a high-risk base — Motorola, Eldor and EL-FAR security systems, cameras and sensors, rapid response under real pressure.',
  },
  {
    when: 'Ariel University',
    title: 'B.Sc. Computer Science & Mathematics',
    body: 'Algorithms, ML, computer vision, distributed systems and serious maths. Projects in drones, satellites, GNSS and deep learning.',
  },
  {
    when: '2023 — 2026',
    title: 'Private Tutor · CS & Mathematics',
    body: 'Prepared university and high-school students for demanding exams. Teaching made me a sharper communicator and a cleaner coder.',
  },
  {
    when: 'Freelance',
    title: 'Web Developer',
    body: 'Designed and built sites and landing pages for business clients — from a martial-arts studio to a restaurant brand.',
  },
  {
    when: '2025 — Now',
    title: 'AI-native product builder',
    body: 'Shipping full products with AI agents in the loop: a Hebrew word game, a real-time multiplayer card platform and an open Hebrew NLP dataset.',
  },
];

export const faqs = [
  {
    q: 'What does “AI-native developer” mean in practice?',
    a: 'Two things. I build products where AI is a feature — LLMs, ML models, computer vision. And I build everything with AI agents in my workflow, using specs, tests and CI so the speed never costs quality.',
  },
  {
    q: 'Why hire a Computer Science & Mathematics graduate?',
    a: 'Because the hard part is rarely the syntax. Mathematics gives me the tools to reason about algorithms, models and edge cases — and to know when an AI answer is wrong.',
  },
  {
    q: 'Are you ready for a full-time role?',
    a: 'Yes. I’m looking for a full-stack, backend or AI-engineering role in a strong team, and I’m ready to commit long-term.',
  },
  {
    q: 'How fast do you learn new technologies?',
    a: 'This portfolio spans Flutter, React Native, Astro, PyTorch, Solidity and orbital mechanics. I research, build and ship — I don’t wait to be taught.',
  },
  {
    q: 'How do you handle pressure?',
    a: 'Four years running a 24/7 operations room taught me to stay calm, prioritise fast and deliver when it counts.',
  },
  {
    q: 'Frontend or backend?',
    a: 'Both. I like owning a feature from the database and the model all the way to a smooth, accessible UI.',
  },
];
