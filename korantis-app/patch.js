const fs = require('fs');
let code = fs.readFileSync('src/app/data/venues.ts', 'utf8');

code = code.replace(/export interface Venue \{([\s\S]+?)\}/, (match, body) => {
  return `export interface Venue {${body}  tagline_es?: string;\n  narrative_es?: string;\n  category_es?: string;\n}`;
});

code = code.replace(/category: '(.*?)',\n\s*location: '(.*?)',([\s\S]*?)tagline: '(.*?)',\n\s*narrative: '(.*?)',/g, (match, cat, loc, mid, t, n) => {
  return `category: '${cat}',\n    category_es: '${cat} (ES)',\n    location: '${loc}',${mid}tagline: '${t}',\n    tagline_es: '${t} (ES)',\n    narrative: '${n}',\n    narrative_es: '${n} (ES)',`;
});

fs.writeFileSync('src/app/data/venues.ts', code);
