
import fs from 'fs';
import path from 'path';

/**
 * NATIVE FILE WALKER (Replaces glob)
 */
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

/**
 * DATA-ORIENTED OOP STRUCTURE
 * Focuses on maintaining a consistent representation of the UI topology.
 */

interface Interaction {
  type: 'click' | 'input' | 'submit' | 'link' | 'state-change' | 'unknown';
  handler?: string;
  targetId?: string;
}

class InteractableNode {
  constructor(
    public id: string,
    public element: string,
    public interaction: Interaction,
    public file: string,
    public line: number
  ) {}

  /**
   * Identifies if this ID follows the project's mandatory kebab-case convention.
   */
  isStandard(): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(this.id);
  }
}

class ComponentNode {
  public interactables: InteractableNode[] = [];
  public imports: string[] = [];
  public idPrefixes: Set<string> = new Set();

  constructor(
    public name: string,
    public path: string,
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
  public idMap: Map<string, InteractableNode> = new Map();
  public links: Array<{ source: string, target: string, type: string }> = [];

  /**
   * Creates logical links between components based on ID patterns and imports.
   */
  resolveLinks() {
    this.components.forEach(comp => {
      // 1. Link by Imports (Structural Tree)
      comp.imports.forEach(imp => {
        const target = Array.from(this.components.values()).find(c => c.name === imp || c.path.includes(imp));
        if (target) {
          this.links.push({ source: comp.name, target: target.name, type: 'hierarchy' });
        }
      });

      // 2. Link by ID Opportunities (Functional Links)
      // If a component has an ID that matches a prefix found in another component, there's a potential link.
      comp.interactables.forEach(node => {
        const parts = node.id.split('-');
        const entityId = parts[parts.length - 1]; // Assume i123 style
        
        if (entityId && entityId.startsWith('i')) {
           this.components.forEach(other => {
             if (other === comp) return;
             const hasSharedEntity = other.interactables.some(n => n.id.endsWith(entityId));
             if (hasSharedEntity) {
               this.links.push({ source: node.id, target: other.name, type: 'entity-bridge' });
             }
           });
        }
      });
    });
  }

  toJSON() {
    const featureMap: Record<string, string[]> = {};
    this.idMap.forEach((node, id) => {
      const prefix = id.split('-')[0];
      if (!featureMap[prefix]) featureMap[prefix] = [];
      featureMap[prefix].push(id);
    });

    return {
      nodes: Array.from(this.components.values()).map(c => ({
        name: c.name,
        path: c.path,
        type: c.type,
        idPrefixes: Array.from(c.idPrefixes),
        interactableCount: c.interactables.length
      })),
      features: featureMap,
      links: this.links,
      stats: {
        totalComponents: this.components.size,
        totalInteractables: this.idMap.size,
        standardIds: Array.from(this.idMap.values()).filter(n => n.isStandard()).length
      }
    };
  }
}

class AnalysisEngine {
  private graph = new TopologyGraph();

  async run(searchPath: string) {
    console.log(`Scanning ${searchPath}...`);
    const files = walkSync(searchPath);

    for (const file of files) {
      if (file.includes('.test.') || file.includes('.spec.')) continue;
      
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const name = path.basename(file, path.extname(file));
      const type = file.includes('/app/') ? 'page' : 'component';
      
      const node = new ComponentNode(name, path.relative(process.cwd(), file), type);

      // Extract Imports
      const importRegex = /import.*from\s+["']@\/components\/([^"']+)["']/g;
      let impMatch;
      while ((impMatch = importRegex.exec(content)) !== null) {
        const impName = impMatch[1].split('/').pop() || '';
        node.imports.push(impName);
      }

      // Extract IDs & Interactables
      lines.forEach((line, index) => {
        const idMatch = line.match(/id=\{?["']([^"'\s}]+)["']\}?/);
        if (idMatch) {
          const id = idMatch[1];
          const interactable = new InteractableNode(
            id,
            this.inferElement(line),
            this.inferInteraction(line),
            node.path,
            index + 1
          );
          node.addInteractable(interactable);
          this.graph.idMap.set(id, interactable);
        }
      });

      this.graph.components.set(node.path, node);
    }

    this.graph.resolveLinks();
    return this.graph;
  }

  private inferElement(line: string): string {
    if (line.includes('<button')) return 'button';
    if (line.includes('<input')) return 'input';
    if (line.includes('<Link')) return 'Link';
    if (line.includes('<motion')) return 'motion';
    const tagMatch = line.match(/<([a-zA-Z0-9]+)/);
    return tagMatch ? tagMatch[1] : 'div';
  }

  private inferInteraction(line: string): Interaction {
    if (line.includes('onClick')) return { type: 'click' };
    if (line.includes('onChange')) return { type: 'input' };
    if (line.includes('onSubmit')) return { type: 'submit' };
    if (line.includes('href')) return { type: 'link' };
    return { type: 'unknown' };
  }
}

// EXECUTION
const engine = new AnalysisEngine();
engine.run(path.join(process.cwd(), 'apps/web/src')).then(graph => {
  const output = JSON.stringify(graph.toJSON(), null, 2);
  fs.writeFileSync('topology-report.json', output);
  console.log('Topology analysis complete. Results saved to topology-report.json');
  
  // Quick Summary to Console
  const stats = graph.toJSON().stats;
  console.log(`\n--- TOPOLOGY SUMMARY ---`);
  console.log(`Components Found: ${stats.totalComponents}`);
  console.log(`Interactables (IDs): ${stats.totalInteractables}`);
  console.log(`Standardized IDs: ${stats.standardIds}`);
  console.log(`Structural Links Found: ${graph.links.length}`);
});
