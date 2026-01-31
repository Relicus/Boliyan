/**
 * Boliyan Comprehensive Feature Indexer
 * 
 * This script scans the entire source tree and produces a structured
 * index of all testable features, mapping:
 * - Components to their routes
 * - Hooks and contexts to their business logic
 * - Exported functions to their test requirements
 */

import fs from 'fs';
import path from 'path';

interface ComponentEntry {
  name: string;
  path: string;
  type: 'page' | 'component' | 'context' | 'hook' | 'lib' | 'type';
  exports: string[];
  dependencies: string[];
}

interface FeatureIndex {
  timestamp: string;
  summary: {
    totalComponents: number;
    totalContexts: number;
    totalHooks: number;
    totalLibs: number;
  };
  routes: string[];
  contexts: ComponentEntry[];
  hooks: ComponentEntry[];
  libs: ComponentEntry[];
  components: {
    marketplace: ComponentEntry[];
    dashboard: ComponentEntry[];
    inbox: ComponentEntry[];
    profile: ComponentEntry[];
    layout: ComponentEntry[];
    search: ComponentEntry[];
    seller: ComponentEntry[];
    notifications: ComponentEntry[];
    ui: ComponentEntry[];
  };
}

const SRC_DIR = path.join(process.cwd(), 'src');
const SAFE_SEGMENT = /^[a-zA-Z0-9._()\[\]-]+$/;

const resolveSafePath = (baseDir: string, segment: string): string | null => {
  if (!SAFE_SEGMENT.test(segment)) return null;
  if (segment.includes('..') || segment.includes('/') || segment.includes('\\')) return null;
  const resolved = path.resolve(baseDir, segment);
  const relative = path.relative(baseDir, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
};

function extractExportsFromFile(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const exports: string[] = [];
    
    // Match "export function X" or "export const X"
    const funcMatches = content.matchAll(/export\s+(function|const|async function)\s+(\w+)/g);
    for (const match of funcMatches) {
      exports.push(match[2]);
    }
    
    // Match "export default function X"
    const defaultMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    if (defaultMatch) {
      exports.push(`default:${defaultMatch[1]}`);
    }
    
    return exports;
  } catch {
    return [];
  }
}

function extractDependencies(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const deps: string[] = [];
    
    // Match imports from @/ (internal)
    const internalMatches = content.matchAll(/from\s+['"]@\/(\w+(?:\/\w+)*)['"];?/g);
    for (const match of internalMatches) {
      deps.push(`@/${match[1]}`);
    }
    
    return [...new Set(deps)];
  } catch {
    return [];
  }
}

function scanDirectory(dir: string, type: ComponentEntry['type']): ComponentEntry[] {
  const entries: ComponentEntry[] = [];
  
  if (!fs.existsSync(dir)) return entries;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (file === 'AGENTS.md') continue;
      const filePath = resolveSafePath(dir, file);
      if (!filePath) continue;
      entries.push({
        name: file.replace(/\.(tsx|ts)$/, ''),
        path: filePath.replace(process.cwd(), ''),
        type,
        exports: extractExportsFromFile(filePath),
        dependencies: extractDependencies(filePath)
      });
    }
  }
  
  return entries;
}

function extractRoutes(): string[] {
  const appDir = path.join(SRC_DIR, 'app');
  const routes: string[] = [];
  
  function walkDir(dir: string, prefix: string) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        const nextDir = resolveSafePath(dir, item.name);
        if (!nextDir) continue;
        // Dynamic routes like [id]
        const routeSegment = item.name.startsWith('[') ? `:${item.name.slice(1, -1)}` : item.name;
        // Skip route groups like (auth)
        if (item.name.startsWith('(')) {
          walkDir(nextDir, prefix);
        } else {
          routes.push(`${prefix}/${routeSegment}`);
          walkDir(nextDir, `${prefix}/${routeSegment}`);
        }
      }
    }
  }
  
  routes.push('/');
  walkDir(appDir, '');
  
  return routes;
}

function buildIndex(): FeatureIndex {
  const contexts = scanDirectory(path.join(SRC_DIR, 'context'), 'context');
  const hooks = scanDirectory(path.join(SRC_DIR, 'hooks'), 'hook');
  const libs = scanDirectory(path.join(SRC_DIR, 'lib'), 'lib');
  
  const componentsBase = path.join(SRC_DIR, 'components');
  
  const index: FeatureIndex = {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: 0,
      totalContexts: contexts.length,
      totalHooks: hooks.length,
      totalLibs: libs.length
    },
    routes: extractRoutes(),
    contexts,
    hooks,
    libs,
    components: {
      marketplace: scanDirectory(path.join(componentsBase, 'marketplace'), 'component'),
      dashboard: scanDirectory(path.join(componentsBase, 'dashboard'), 'component'),
      inbox: scanDirectory(path.join(componentsBase, 'inbox'), 'component'),
      profile: scanDirectory(path.join(componentsBase, 'profile'), 'component'),
      layout: scanDirectory(path.join(componentsBase, 'layout'), 'component'),
      search: scanDirectory(path.join(componentsBase, 'search'), 'component'),
      seller: scanDirectory(path.join(componentsBase, 'seller'), 'component'),
      notifications: scanDirectory(path.join(componentsBase, 'notifications'), 'component'),
      ui: scanDirectory(path.join(componentsBase, 'ui'), 'component')
    }
  };
  
  // Calculate total components
  for (const category of Object.values(index.components)) {
    index.summary.totalComponents += category.length;
  }
  
  return index;
}

// Run the indexer
const index = buildIndex();
const outputPath = path.join(process.cwd(), 'feature_index.json');
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

console.log('=== Boliyan Feature Index ===');
console.log(`Routes: ${index.routes.length}`);
console.log(`Contexts: ${index.summary.totalContexts}`);
console.log(`Hooks: ${index.summary.totalHooks}`);
console.log(`Libs: ${index.summary.totalLibs}`);
console.log(`Components: ${index.summary.totalComponents}`);
console.log(`\nIndex saved to: ${outputPath}`);
