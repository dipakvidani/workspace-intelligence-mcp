export const DEFAULT_IGNORED_DIRS = [
  'node_modules', 'dist', 'build', 'coverage', '.next', '.turbo',
  '.git', '.svn', '.hg', '__pycache__', '.cache', '.output',
  '.nuxt', '.vercel', '.netlify', 'vendor', 'tmp', '.tmp',
];

export const DEFAULT_IGNORED_GLOBS = DEFAULT_IGNORED_DIRS.map(d => `**/${d}/**`);

export const DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB
export const DEFAULT_MAX_SEARCH_RESULTS = 200;
export const DEFAULT_MAX_TREE_DEPTH = 5;
export const DEFAULT_CACHE_TTL_MS = 60_000; // 1 minute

export const SERVICE_INDICATORS: Record<string, string[]> = {
  'package.json': ['node', 'javascript', 'typescript'],
  'tsconfig.json': ['typescript'],
  'Dockerfile': ['docker'],
  'docker-compose.yml': ['docker'],
  'docker-compose.yaml': ['docker'],
  'prisma/schema.prisma': ['prisma'],
  'schema.prisma': ['prisma'],
  '.env': ['environment'],
  'go.mod': ['go'],
  'Cargo.toml': ['rust'],
  'requirements.txt': ['python'],
  'pyproject.toml': ['python'],
  'Gemfile': ['ruby'],
  'pom.xml': ['java'],
  'build.gradle': ['java', 'kotlin'],
};

export const FRAMEWORK_INDICATORS: Record<string, string> = {
  'next.config': 'Next.js',
  'nuxt.config': 'Nuxt',
  'vite.config': 'Vite',
  'angular.json': 'Angular',
  'svelte.config': 'SvelteKit',
  'remix.config': 'Remix',
  'astro.config': 'Astro',
  'nest-cli.json': 'NestJS',
  'gatsby-config': 'Gatsby',
};

export const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.exe', '.dll', '.so', '.dylib',
  '.wasm', '.lock',
]);
