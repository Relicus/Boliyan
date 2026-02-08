import fs from 'node:fs';
import path from 'node:path';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const IMPORT_PATTERNS = [
  /import\s+[^'"`]*?from\s*['"]([^'"`]+)['"]/g,
  /export\s+[^'"`]*?from\s*['"]([^'"`]+)['"]/g,
  /import\(\s*['"]([^'"`]+)['"]\s*\)/g,
  /require\(\s*['"]([^'"`]+)['"]\s*\)/g
];

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, 'src');
const auditRoots = [
  path.join(srcRoot, 'components'),
  path.join(srcRoot, 'hooks'),
  path.join(srcRoot, 'lib'),
  path.join(srcRoot, 'context')
];
const KNOWN_UNREFERENCED_FILES = new Set([
  path.normalize(path.join(srcRoot, 'components', 'marketplace', 'ProductOverlay.tsx')),
  path.normalize(path.join(srcRoot, 'components', 'profile', 'ReviewForm.tsx')),
  path.normalize(path.join(srcRoot, 'components', 'search', 'SimilarItems.tsx')),
  path.normalize(path.join(srcRoot, 'components', 'ui', 'carousel.tsx')),
  path.normalize(path.join(srcRoot, 'components', 'ui', 'command.tsx')),
  path.normalize(path.join(srcRoot, 'components', 'ui', 'motion-button.tsx'))
]);

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
      continue;
    }

    if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(path.normalize(fullPath));
    }
  }

  return files;
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
    return null;
  }

  const basePath = specifier.startsWith('@/')
    ? path.join(srcRoot, specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);

  const candidates = [];
  if (path.extname(basePath)) {
    candidates.push(basePath);
  } else {
    candidates.push(basePath);
    for (const ext of SOURCE_EXTENSIONS) {
      candidates.push(`${basePath}${ext}`);
    }
    for (const ext of SOURCE_EXTENSIONS) {
      candidates.push(path.join(basePath, `index${ext}`));
    }
  }

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
      return normalized;
    }
  }

  return null;
}

function collectReferences(files) {
  const referenced = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    for (const pattern of IMPORT_PATTERNS) {
      let match = pattern.exec(content);
      while (match) {
        const resolved = resolveImport(file, match[1]);
        if (resolved) {
          referenced.add(resolved);
        }
        match = pattern.exec(content);
      }
      pattern.lastIndex = 0;
    }
  }

  return referenced;
}

function isInAuditRoots(file) {
  return auditRoots.some((root) => file.startsWith(root));
}

const allFiles = listFiles(srcRoot);
const auditFiles = allFiles.filter(isInAuditRoots);
const referencedFiles = collectReferences(allFiles);
const unusedFiles = auditFiles.filter((file) => !referencedFiles.has(file));
const unexpectedUnusedFiles = unusedFiles.filter((file) => !KNOWN_UNREFERENCED_FILES.has(file));
const allowlistedUnusedFiles = unusedFiles.filter((file) => KNOWN_UNREFERENCED_FILES.has(file));

if (unexpectedUnusedFiles.length === 0) {
  console.log('Unused file audit passed: no unreferenced files in src/components, src/hooks, src/lib, or src/context.');
  if (allowlistedUnusedFiles.length > 0) {
    console.log('Known unreferenced baseline files:');
    for (const file of allowlistedUnusedFiles.sort()) {
      console.log(`- ${path.relative(projectRoot, file)}`);
    }
  }
  process.exit(0);
}

console.error('Unused file audit failed. Remove or reference these files:');
for (const file of unexpectedUnusedFiles.sort()) {
  console.error(`- ${path.relative(projectRoot, file)}`);
}

process.exit(1);
