/** Brand-ish colours for programming-language badges (used as a dot + tint). */
export const languageColors: Record<string, string> = {
  Python: '#4b8bbe',
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Dart: '#00b4ab',
  Java: '#e76f00',
  Kotlin: '#a97bff',
  'C#': '#9b4f96',
  'C / C++': '#659ad2',
  C: '#659ad2',
  'C++': '#f34b7d',
  Solidity: '#9ca3af',
  HTML: '#e34c26',
  CSS: '#2965f1',
  XML: '#22d3ee',
  SQL: '#f29111',
};

export const langColor = (name: string) => languageColors[name] ?? '#22d3ee';

/** Grouped skills for the Skills section on the home page. */
export const skillGroups = [
  {
    title: 'Languages',
    note: 'What I write code in',
    items: ['Python', 'TypeScript', 'JavaScript', 'C#', 'C / C++', 'Java', 'Kotlin', 'Dart', 'SQL', 'HTML', 'CSS', 'Solidity'],
    langs: true,
  },
  {
    title: 'Frameworks & platforms',
    note: 'Web, mobile and backend',
    items: ['React', 'React Native', 'Expo', 'Flutter', 'Astro', 'Node.js', '.NET', 'Android SDK', 'Firebase', 'Supabase', 'Tailwind CSS'],
  },
  {
    title: 'AI & data',
    note: 'Models, vision and data',
    items: ['PyTorch', 'TensorFlow', 'Keras', 'scikit-learn', 'OpenCV', 'NumPy', 'Pandas', 'AI coding agents', 'Claude Code', 'Cursor'],
  },
  {
    title: 'Engineering',
    note: 'How I build and deliver',
    items: ['Algorithms & data structures', 'Git & GitHub', 'GitHub Actions / CI', 'Testing', 'Accessibility', 'Smart contracts'],
  },
];
