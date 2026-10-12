/**
 * One source of truth for who Roni is — used by structured data (JSON-LD),
 * /llms.txt and the Hebrew profile page, so search engines and AI models get
 * the same consistent facts in English and Hebrew.
 */
import { site } from './site';

export const names = {
  en: 'Roni Michaeli',
  he: 'רוני מיכאלי',
  // Ways people may type the name.
  variants: ['Roni Michaeli', 'רוני מיכאלי', 'ronimichaeli', 'Michaeli Roni', 'מיכאלי רוני', 'roni5604'],
};

export const summary = {
  en: 'Roni Michaeli is an Israeli software developer and AI specialist. He holds a B.Sc. in Computer Science and Mathematics from Ariel University, writes his own code in Python, TypeScript, C#, Java, C/C++ and Dart, and specialises in working with AI — machine-learning models and AI-assisted development of complete products: web and mobile apps, games and data projects. He is available for a full-time developer role.',
  he: 'רוני מיכאלי הוא מפתח תוכנה ומומחה לעבודה עם בינה מלאכותית (AI) מישראל. בוגר תואר ראשון (B.Sc.) במדעי המחשב ומתמטיקה מאוניברסיטת אריאל, כותב קוד בעצמו ב-Python, TypeScript, C#, Java, C/C++ ו-Dart, ומתמחה בבניית מוצרים שלמים בעזרת AI: אתרים, אפליקציות, משחקים, מודלים של למידת מכונה ופרויקטי דאטה. זמין למשרת פיתוח מלאה.',
};

export const person = {
  '@type': 'Person',
  '@id': `${site.url}/#person`,
  name: names.en,
  alternateName: names.variants.filter((n) => n !== names.en),
  givenName: 'Roni',
  familyName: 'Michaeli',
  url: site.url,
  mainEntityOfPage: site.url,
  image: `${site.url}/og.jpg`,
  description: summary.en,
  disambiguatingDescription: 'Software developer and AI specialist from Israel; B.Sc. Computer Science & Mathematics, Ariel University.',
  jobTitle: ['Software Developer', 'AI Specialist', 'Private Tutor in Computer Science and Mathematics'],
  hasOccupation: {
    '@type': 'Occupation',
    name: 'Software Developer',
    occupationLocation: { '@type': 'Country', name: 'Israel' },
    skills: 'Python, TypeScript, JavaScript, C#, Java, C/C++, Dart, React, React Native, Flutter, Astro, Node.js, Firebase, PyTorch, TensorFlow, OpenCV, AI-assisted development',
  },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Ariel University',
    alternateName: 'אוניברסיטת אריאל',
    sameAs: 'https://en.wikipedia.org/wiki/Ariel_University',
  },
  hasCredential: {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'degree',
    name: 'B.Sc. in Computer Science and Mathematics',
    recognizedBy: { '@type': 'CollegeOrUniversity', name: 'Ariel University' },
  },
  knowsAbout: [
    'Software development',
    'Computer science',
    'Artificial intelligence',
    'Machine learning',
    'Deep learning',
    'Computer vision',
    'Full-stack development',
    'Mobile app development',
    'Game development',
    'Python',
    'TypeScript',
    'C#',
    'Java',
    'React',
    'Flutter',
  ],
  knowsLanguage: [
    { '@type': 'Language', name: 'Hebrew', alternateName: 'he' },
    { '@type': 'Language', name: 'English', alternateName: 'en' },
  ],
  nationality: { '@type': 'Country', name: 'Israel' },
  address: { '@type': 'PostalAddress', addressCountry: 'IL' },
  seeks: { '@type': 'Demand', description: 'Full-time software developer role — full-stack, backend or AI-focused.' },
  sameAs: [site.linkedin, site.github, 'https://roni5604.github.io/private-lessons-site/'],
};
