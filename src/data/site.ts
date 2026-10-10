export const site = {
  name: 'Roni Michaeli',
  role: 'Software Developer & AI Specialist',
  url: 'https://ronimichaeli.com',
  title: 'Roni Michaeli — Software Developer & AI Specialist',
  description:
    'Roni Michaeli is a software developer with a B.Sc. in Computer Science & Mathematics who writes his own code and specialises in building with AI — machine-learning models, games, web and mobile apps. Available for work.',
  location: 'Israel',
  status: 'Available for work',
  // The address is assembled in the browser so it isn't sitting in the HTML for scrapers.
  emailParts: ['roniro5604', 'gmail.com'] as const,
  whatsapp: 'https://wa.me/972544396677',
  phoneDisplay: '+972 54-439-6677',
  github: 'https://github.com/roni5604',
  linkedin: 'https://www.linkedin.com/in/roni-michaeli-7523a5262/',
  cv: '/cv/Roni-Michaeli-CV.pdf',
  updated: '2026-10-10',
};

export const nav = [
  { label: 'Skills', href: '/#skills' },
  { label: 'Projects', href: '/#work' },
  { label: 'Contact', href: '/#contact' },
  { label: 'About', href: '/#about' },
  { label: 'Journey', href: '/#journey' },
];

export const roles = [
  'writes clean code — by hand',
  'builds full products end to end',
  'specialises in working with AI',
  'trains models that actually learn',
  'turns maths into fast algorithms',
];

export const stack = [
  'Python',
  'TypeScript',
  'JavaScript',
  'C / C++',
  'C#  ·  .NET',
  'Java',
  'Kotlin',
  'Dart',
  'SQL',
  'React',
  'React Native',
  'Expo',
  'Flutter',
  'Astro',
  'Node.js',
  'Firebase',
  'Supabase',
  'PyTorch',
  'TensorFlow',
  'OpenCV',
  'AI coding agents',
  'Claude Code',
  'Cursor',
  'Solidity',
  'Git',
];

export const aiPillars = [
  {
    id: 'code',
    kicker: '01',
    title: 'I write the code',
    body: 'Computer science is my foundation, not a shortcut. Algorithms, data structures and clean architecture — I design and write the code myself, and I understand every line that goes to production.',
    points: ['C, C++, C#, Java, Python', 'Algorithms & data structures', 'Clean, tested code'],
  },
  {
    id: 'agentic',
    kicker: '02',
    title: 'AI as a force multiplier',
    body: 'I specialise in working with AI coding agents. Specs, tests and CI keep them honest, and my own review keeps the quality — so complete products, like a seven-game multiplayer card platform, are built in weeks.',
    points: ['Claude Code & Cursor', 'Spec-driven workflows', 'Tests & CI as guardrails'],
  },
  {
    id: 'ml',
    kicker: '03',
    title: 'Machine & deep learning',
    body: 'From baselines to CNNs: data preparation, training, honest evaluation and putting the model behind a usable interface. Plus the maths underneath — I studied it, not just imported it.',
    points: ['PyTorch & TensorFlow', 'Computer vision', 'Datasets for NLP'],
  },
];

export const journey = [
  {
    when: 'High school',
    title: 'Where it started',
    body: 'Fell in love with computers early — majored in Computer Science (5 units), plus Network Management and Physics. Writing my first programs is still the most fun I’ve had at a keyboard.',
  },
  {
    when: '2017 — 2021',
    title: 'Military service',
    body: 'Operations room manager — responsibility, teamwork and staying focused under pressure.',
  },
  {
    when: 'Ariel University',
    title: 'B.Sc. Computer Science & Mathematics',
    body: 'Algorithms, data structures, machine learning, computer vision and serious maths. Projects in drones, satellites, GNSS and deep learning.',
  },
  {
    when: '2023 — 2026',
    title: 'Private Tutor · CS & Mathematics',
    body: 'Prepared university and high-school students for demanding exams. Explaining code to others made me a sharper communicator and a cleaner coder.',
  },
  {
    when: 'Freelance',
    title: 'Web Developer',
    body: 'Designed and built sites and landing pages for business clients — from a martial-arts coach to a restaurant brand.',
  },
  {
    when: '2025 — Now',
    title: 'Developer specialising in AI',
    body: 'Building complete products with AI in my workflow: a Hebrew word game, a real-time multiplayer card platform and an open Hebrew NLP dataset.',
  },
];

export const faqs = [
  {
    q: 'Do you write the code yourself?',
    a: 'Yes. I’m a Computer Science graduate and I write code by hand every day — C, C++, C#, Java, Python, TypeScript. AI makes me faster, but I design the solution, review every line and own the result.',
  },
  {
    q: 'What does “specialising in AI” mean in practice?',
    a: 'Two things. I build with AI — machine-learning models, computer vision and data for NLP. And I work with AI coding agents in a disciplined way, with specs, tests and CI, so speed never costs quality.',
  },
  {
    q: 'Are you available for work?',
    a: 'Yes — I’m available now for a full-time developer role: full-stack, backend or AI-focused, in a strong team where I can commit long-term.',
  },
  {
    q: 'Why hire a Computer Science & Mathematics graduate?',
    a: 'Because the hard part is rarely the syntax. Mathematics gives me the tools to reason about algorithms, models and edge cases — and to know when an AI answer is wrong.',
  },
  {
    q: 'How fast do you learn new technologies?',
    a: 'This portfolio spans Flutter, React Native, Astro, PyTorch, Solidity and orbital mechanics. I research, build and finish — I don’t wait to be taught.',
  },
  {
    q: 'Frontend or backend?',
    a: 'Both. I like owning a feature from the database and the logic all the way to a smooth, accessible UI.',
  },
];
