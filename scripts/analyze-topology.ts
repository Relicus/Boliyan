import fs from 'fs';
import path from 'path';

/**
 * TOPOLOGY ANALYSIS ENGINE v2.0
 * Data-Oriented OOP Architecture
 * 
 * Features:
 * - Dynamic ID Detection (template literals)
 * - Orphan & Duplicate ID Detection
 * - State Flow Mapping (useApp, useBidding, etc.)
 * - Route Graph (Link href analysis)
 * - Mermaid Diagram Output
 */

// --- UTILITIES ---

function walkSync(dir: string, filelist: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

// --- TEST COVERAGE SCANNER ---

interface TestSelector {
  selector: string;
  testFile: string;
  line: number;
  type: 'id' | 'id-contains' | 'class' | 'role' | 'text' | 'other';
}

class TestCoverageScanner {
  public selectors: TestSelector[] = [];
  public coveredIds: Set<string> = new Set();
  public coveredPatterns: string[] = [];

  scan(testsPath: string) {
    if (!fs.existsSync(testsPath)) {
      console.log(`  Tests directory not found: ${testsPath}`);
      return;
    }

    const testFiles = walkSync(testsPath).filter(
      f => f.endsWith('.spec.ts') || f.endsWith('.spec.js') || f.endsWith('.test.ts') || f.endsWith('.test.js')
    );

    for (const file of testFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const relPath = path.relative(process.cwd(), file);

      lines.forEach((line, index) => {
        // Match #id selectors
        const idMatch = line.match(/#([a-zA-Z0-9_-]+)/g);
        if (idMatch) {
          idMatch.forEach(sel => {
            const id = sel.substring(1);
            this.selectors.push({ selector: id, testFile: relPath, line: index + 1, type: 'id' });
            this.coveredIds.add(id);
          });
        }

        // Match id*="pattern" or id="value" in locators
        const idContainsMatch = line.match(/id\*=["']([^"']+)["']/g);
        if (idContainsMatch) {
          idContainsMatch.forEach(sel => {
            const pattern = sel.match(/id\*=["']([^"']+)["']/)?.[1];
            if (pattern) {
              this.selectors.push({ selector: pattern, testFile: relPath, line: index + 1, type: 'id-contains' });
              this.coveredPatterns.push(pattern);
            }
          });
        }

        // Match locator('[id="..."]') or locator('#...')
        const locatorIdMatch = line.match(/locator\s*\(\s*['"`]#([^'"`\s]+)['"`]\s*\)/g);
        if (locatorIdMatch) {
          locatorIdMatch.forEach(sel => {
            const id = sel.match(/#([^'"`\s\]]+)/)?.[1];
            if (id) {
              this.selectors.push({ selector: id, testFile: relPath, line: index + 1, type: 'id' });
              this.coveredIds.add(id);
            }
          });
        }

        // Match getByTestId('...')
        const testIdMatch = line.match(/getByTestId\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
        if (testIdMatch) {
          testIdMatch.forEach(sel => {
            const id = sel.match(/getByTestId\s*\(\s*['"`]([^'"`]+)['"`]/)?.[1];
            if (id) {
              this.selectors.push({ selector: id, testFile: relPath, line: index + 1, type: 'id' });
              this.coveredIds.add(id);
            }
          });
        }
      });
    }
  }

  /**
   * Check if an ID (static or dynamic pattern) is covered by tests
   */
  isCovered(id: string, isDynamic: boolean): boolean {
    // Direct match for static IDs
    if (this.coveredIds.has(id)) return true;

    // For dynamic IDs like "item-card-*", check if any pattern matches
    if (isDynamic) {
      const basePattern = id.replace(/\*/g, '');
      return this.coveredPatterns.some(p => basePattern.includes(p) || p.includes(basePattern.replace(/-$/, '')));
    }

    // Check if any id*= pattern covers this ID
    for (const pattern of this.coveredPatterns) {
      if (id.includes(pattern)) return true;
    }

    return false;
  }

  getStats() {
    return {
      totalSelectors: this.selectors.length,
      uniqueCoveredIds: this.coveredIds.size,
      patterns: this.coveredPatterns.length
    };
  }
}

// --- DATA MODELS ---

interface Interaction {
  type: 'click' | 'input' | 'submit' | 'link' | 'state-change' | 'unknown';
  handler?: string;
}

interface StateUsage {
  hook: string;
  destructured: string[];
}

interface RouteLink {
  from: string;
  to: string;
  isDynamic: boolean;
}

class InteractableNode {
  public isDynamic: boolean;
  public pattern?: string;

  constructor(
    public id: string,
    public element: string,
    public interaction: Interaction,
    public file: string,
    public line: number,
    isDynamic = false,
    pattern?: string
  ) {
    this.isDynamic = isDynamic;
    this.pattern = pattern;
  }

  isOrphan(): boolean {
    return this.interaction.type === 'unknown';
  }

  isStandard(): boolean {
    if (this.isDynamic) return true; // Dynamic IDs follow pattern
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(this.id);
  }
}

class ComponentNode {
  public interactables: InteractableNode[] = [];
  public imports: string[] = [];
  public idPrefixes: Set<string> = new Set();
  public stateUsage: StateUsage[] = [];
  public routeLinks: RouteLink[] = [];

  constructor(
    public name: string,
    public filepath: string,
    public type: 'page' | 'component' | 'layout'
  ) {}

  addInteractable(node: InteractableNode) {
    this.interactables.push(node);
    const prefix = node.id.split('-')[0];
    if (prefix) this.idPrefixes.add(prefix);
  }
}

class TopologyGraph {
  public components: Map<string, ComponentNode> = new Map();
  public idMap: Map<string, InteractableNode[]> = new Map(); // Array for duplicates
  public links: Array<{ source: string; target: string; type: string }> = [];
  public routes: RouteLink[] = [];
  public testCoverage: TestCoverageScanner | null = null;

  setTestCoverage(scanner: TestCoverageScanner) {
    this.testCoverage = scanner;
  }

  addId(id: string, node: InteractableNode) {
    if (!this.idMap.has(id)) {
      this.idMap.set(id, []);
    }
    this.idMap.get(id)!.push(node);
  }

  getDuplicates(): Map<string, InteractableNode[]> {
    const dupes = new Map<string, InteractableNode[]>();
    this.idMap.forEach((nodes, id) => {
      if (nodes.length > 1 && !nodes[0].isDynamic) {
        dupes.set(id, nodes);
      }
    });
    return dupes;
  }

  getOrphans(): InteractableNode[] {
    const orphans: InteractableNode[] = [];
    this.idMap.forEach(nodes => {
      nodes.forEach(n => {
        if (n.isOrphan()) orphans.push(n);
      });
    });
    return orphans;
  }

  resolveLinks() {
    this.components.forEach(comp => {
      // 1. Hierarchy Links (Imports)
      comp.imports.forEach(imp => {
        const target = Array.from(this.components.values()).find(
          c => c.name === imp || c.filepath.includes(imp)
        );
        if (target && target.name !== comp.name) {
          this.links.push({ source: comp.name, target: target.name, type: 'imports' });
        }
      });

      // 2. State Flow Links
      comp.stateUsage.forEach(usage => {
        this.components.forEach(other => {
          if (other === comp) return;
          const sharedHook = other.stateUsage.some(u => u.hook === usage.hook);
          if (sharedHook) {
            const existingLink = this.links.find(
              l => l.source === comp.name && l.target === other.name && l.type === 'state-shared'
            );
            if (!existingLink) {
              this.links.push({ source: comp.name, target: other.name, type: 'state-shared' });
            }
          }
        });
      });

      // 3. Route Links
      comp.routeLinks.forEach(route => {
        this.routes.push(route);
      });
    });
  }

  toMermaid(): string {
    let mermaid = 'flowchart TD\n';
    const addedNodes = new Set<string>();

    // Add component nodes
    this.components.forEach(comp => {
      const nodeId = comp.name.replace(/[^a-zA-Z0-9]/g, '_');
      const icon = comp.type === 'page' ? '[[' : comp.type === 'layout' ? '{{' : '(';
      const iconEnd = comp.type === 'page' ? ']]' : comp.type === 'layout' ? '}}' : ')';
      mermaid += `  ${nodeId}${icon}"${comp.name}"${iconEnd}\n`;
      addedNodes.add(nodeId);
    });

    mermaid += '\n';

    // Add links
    const uniqueLinks = new Map<string, { source: string; target: string; type: string }>();
    this.links.forEach(link => {
      const key = `${link.source}-${link.target}`;
      if (!uniqueLinks.has(key)) {
        uniqueLinks.set(key, link);
      }
    });

    uniqueLinks.forEach(link => {
      const sourceId = link.source.replace(/[^a-zA-Z0-9]/g, '_');
      const targetId = link.target.replace(/[^a-zA-Z0-9]/g, '_');
      if (addedNodes.has(sourceId) && addedNodes.has(targetId)) {
        const arrow = link.type === 'imports' ? '-->' : link.type === 'state-shared' ? '-.->' : '==>';
        mermaid += `  ${sourceId} ${arrow} ${targetId}\n`;
      }
    });

    return mermaid;
  }

  toJSON() {
    const featureMap: Record<string, string[]> = {};
    this.idMap.forEach((nodes, id) => {
      const prefix = id.split('-')[0];
      if (!featureMap[prefix]) featureMap[prefix] = [];
      if (!featureMap[prefix].includes(id)) featureMap[prefix].push(id);
    });

    const duplicates = this.getDuplicates();
    const orphans = this.getOrphans();

    // Test Coverage Analysis
    const allIds = Array.from(this.idMap.entries());
    const coveredIds: string[] = [];
    const uncoveredIds: string[] = [];

    if (this.testCoverage) {
      allIds.forEach(([id, nodes]) => {
        const isDynamic = nodes.some(n => n.isDynamic);
        if (this.testCoverage!.isCovered(id, isDynamic)) {
          coveredIds.push(id);
        } else {
          uncoveredIds.push(id);
        }
      });
    }

    return {
      components: Array.from(this.components.values()).map(c => ({
        name: c.name,
        path: c.filepath,
        type: c.type,
        idPrefixes: Array.from(c.idPrefixes),
        interactableCount: c.interactables.length,
        stateHooks: c.stateUsage.map(s => s.hook),
        routeLinks: c.routeLinks.length
      })),
      features: featureMap,
      links: this.links,
      routes: this.routes,
      diagnostics: {
        duplicateIds: Array.from(duplicates.entries()).map(([id, nodes]) => ({
          id,
          locations: nodes.map(n => `${n.file}:${n.line}`)
        })),
        orphanIds: orphans.map(n => ({
          id: n.id,
          element: n.element,
          location: `${n.file}:${n.line}`
        })),
        dynamicIdPatterns: Array.from(this.idMap.values())
          .flat()
          .filter(n => n.isDynamic)
          .map(n => ({ pattern: n.pattern, file: n.file, line: n.line }))
      },
      testCoverage: this.testCoverage ? {
        coveredIds,
        uncoveredIds,
        coveragePercent: allIds.length > 0 
          ? Math.round((coveredIds.length / allIds.length) * 100) 
          : 0,
        testSelectors: this.testCoverage.selectors,
        patterns: this.testCoverage.coveredPatterns
      } : null,
      stats: {
        totalComponents: this.components.size,
        totalInteractables: Array.from(this.idMap.values()).flat().length,
        staticIds: Array.from(this.idMap.values()).flat().filter(n => !n.isDynamic).length,
        dynamicIds: Array.from(this.idMap.values()).flat().filter(n => n.isDynamic).length,
        duplicateIdCount: duplicates.size,
        orphanIdCount: orphans.length,
        stateConnections: this.links.filter(l => l.type === 'state-shared').length,
        routeCount: this.routes.length,
        testCoverage: this.testCoverage ? {
          covered: coveredIds.length,
          uncovered: uncoveredIds.length,
          percent: allIds.length > 0 ? Math.round((coveredIds.length / allIds.length) * 100) : 0
        } : null
      }
    };
  }
}

// --- ANALYSIS ENGINE ---

class AnalysisEngine {
  private graph = new TopologyGraph();

  async run(searchPath: string) {
    console.log(`\n Scanning ${searchPath}...\n`);
    const files = walkSync(searchPath);

    for (const file of files) {
      if (file.includes('.test.') || file.includes('.spec.')) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const name = path.basename(file, path.extname(file));
      const isPage = file.includes('\\app\\') || file.includes('/app/');
      const isLayout = name === 'layout';
      const type = isLayout ? 'layout' : isPage ? 'page' : 'component';

      const node = new ComponentNode(name, path.relative(process.cwd(), file), type);

      // 1. Extract Imports
      this.extractImports(content, node);

      // 2. Extract Static & Dynamic IDs
      this.extractIds(lines, node);

      // 3. Extract State Usage
      this.extractStateUsage(content, node);

      // 4. Extract Route Links
      this.extractRouteLinks(content, node);

      this.graph.components.set(node.filepath, node);
    }

    this.graph.resolveLinks();
    return this.graph;
  }

  private extractImports(content: string, node: ComponentNode) {
    const importRegex = /import.*from\s+["']@\/components\/([^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const impName = match[1].split('/').pop() || '';
      if (impName && !node.imports.includes(impName)) {
        node.imports.push(impName);
      }
    }
  }

  private extractIds(lines: string[], node: ComponentNode) {
    lines.forEach((line, index) => {
      // Static IDs: id="foo" or id={'foo'}
      const staticMatch = line.match(/id=\{?["']([^"'`\s}]+)["']\}?/);
      if (staticMatch) {
        const id = staticMatch[1];
        const interactable = new InteractableNode(
          id,
          this.inferElement(line),
          this.inferInteraction(line),
          node.filepath,
          index + 1,
          false
        );
        node.addInteractable(interactable);
        this.graph.addId(id, interactable);
      }

      // Dynamic IDs: id={`prefix-${var}`}
      const dynamicMatch = line.match(/id=\{`([^`]+)`\}/);
      if (dynamicMatch) {
        const pattern = dynamicMatch[1];
        const baseId = pattern.replace(/\$\{[^}]+\}/g, '*');
        const interactable = new InteractableNode(
          baseId,
          this.inferElement(line),
          this.inferInteraction(line),
          node.filepath,
          index + 1,
          true,
          pattern
        );
        node.addInteractable(interactable);
        this.graph.addId(baseId, interactable);
      }
    });
  }

  private extractStateUsage(content: string, node: ComponentNode) {
    const hooks = ['useApp', 'useBidding', 'useTime', 'useState', 'useContext'];
    hooks.forEach(hook => {
      const regex = new RegExp(`const\\s+\\{([^}]+)\\}\\s*=\\s*${hook}\\(`, 'g');
      let match;
      while ((match = regex.exec(content)) !== null) {
        const destructured = match[1]
          .split(',')
          .map(s => s.trim())
          .filter(s => s && !s.includes(':'));
        node.stateUsage.push({ hook, destructured });
      }
    });
  }

  private extractRouteLinks(content: string, node: ComponentNode) {
    // Match <Link href="..."> and <Link href={`...`}>
    const staticLinkRegex = /<Link[^>]*href=["']([^"']+)["']/g;
    const dynamicLinkRegex = /<Link[^>]*href=\{`([^`]+)`\}/g;

    let match;
    while ((match = staticLinkRegex.exec(content)) !== null) {
      node.routeLinks.push({
        from: node.filepath,
        to: match[1],
        isDynamic: false
      });
    }
    while ((match = dynamicLinkRegex.exec(content)) !== null) {
      node.routeLinks.push({
        from: node.filepath,
        to: match[1],
        isDynamic: true
      });
    }
  }

  private inferElement(line: string): string {
    if (line.includes('<button')) return 'button';
    if (line.includes('<input')) return 'input';
    if (line.includes('<Link')) return 'Link';
    if (line.includes('<motion')) return 'motion';
    if (line.includes('<img')) return 'img';
    const tagMatch = line.match(/<([a-zA-Z][a-zA-Z0-9]*)/);
    return tagMatch ? tagMatch[1] : 'div';
  }

  private inferInteraction(line: string): Interaction {
    if (line.includes('onClick')) {
      const handlerMatch = line.match(/onClick=\{([^}]+)\}/);
      return { type: 'click', handler: handlerMatch?.[1]?.trim() };
    }
    if (line.includes('onChange')) {
      const handlerMatch = line.match(/onChange=\{([^}]+)\}/);
      return { type: 'input', handler: handlerMatch?.[1]?.trim() };
    }
    if (line.includes('onSubmit')) return { type: 'submit' };
    if (line.includes('href')) return { type: 'link' };
    return { type: 'unknown' };
  }
}

// --- EXECUTION ---

const engine = new AnalysisEngine();
engine.run(path.join(process.cwd(), 'apps/web/src')).then(graph => {
  // Scan Tests for Coverage
  const testScanner = new TestCoverageScanner();
  testScanner.scan(path.join(process.cwd(), 'apps/web/tests'));
  graph.setTestCoverage(testScanner);

  const report = graph.toJSON();
  const mermaid = graph.toMermaid();

  // Write JSON Report
  fs.writeFileSync('topology-report.json', JSON.stringify(report, null, 2));

  // Write Mermaid Diagram
  fs.writeFileSync('topology-diagram.mmd', mermaid);

  // Console Summary
  const { stats, diagnostics, testCoverage } = report;
  console.log('='.repeat(50));
  console.log('       TOPOLOGY ANALYSIS COMPLETE');
  console.log('='.repeat(50));
  console.log(`\n Components:        ${stats.totalComponents}`);
  console.log(` Total IDs:         ${stats.totalInteractables}`);
  console.log(`   - Static:        ${stats.staticIds}`);
  console.log(`   - Dynamic:       ${stats.dynamicIds}`);
  console.log(` State Connections: ${stats.stateConnections}`);
  console.log(` Route Links:       ${stats.routeCount}`);
  console.log('');

  // Test Coverage Section
  if (testCoverage && stats.testCoverage) {
    const coverageColor = stats.testCoverage.percent >= 70 ? '' : stats.testCoverage.percent >= 40 ? '' : '';
    console.log(` TEST COVERAGE:`);
    console.log(`   Covered:   ${stats.testCoverage.covered} IDs`);
    console.log(`   Uncovered: ${stats.testCoverage.uncovered} IDs`);
    console.log(`   Coverage:  ${stats.testCoverage.percent}%`);
    console.log('');

    if (testCoverage.uncoveredIds.length > 0 && testCoverage.uncoveredIds.length <= 20) {
      console.log(' UNCOVERED IDs (need tests):');
      testCoverage.uncoveredIds.slice(0, 15).forEach(id => {
        console.log(`   - ${id}`);
      });
      if (testCoverage.uncoveredIds.length > 15) {
        console.log(`   ... and ${testCoverage.uncoveredIds.length - 15} more`);
      }
      console.log('');
    }
  }

  if (stats.duplicateIdCount > 0) {
    console.log(` DUPLICATES FOUND: ${stats.duplicateIdCount}`);
    diagnostics.duplicateIds.forEach(d => {
      console.log(`   - "${d.id}" in:`);
      d.locations.forEach(loc => console.log(`       ${loc}`));
    });
    console.log('');
  }

  if (stats.orphanIdCount > 0) {
    console.log(` ORPHAN IDs (no handler): ${stats.orphanIdCount}`);
    diagnostics.orphanIds.slice(0, 10).forEach(o => {
      console.log(`   - ${o.id} (${o.element}) at ${o.location}`);
    });
    if (diagnostics.orphanIds.length > 10) {
      console.log(`   ... and ${diagnostics.orphanIds.length - 10} more`);
    }
    console.log('');
  }

  console.log(' Output Files:');
  console.log('   - topology-report.json (Full data)');
  console.log('   - topology-diagram.mmd (Mermaid flowchart)');
  console.log('='.repeat(50));
});
