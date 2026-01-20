#!/usr/bin/env node

/**
 * Feature Registry Validator & Auto-Discovery Script
 * 
 * This script scans the entire codebase for:
 * 1. All `id="..."` attributes
 * 2. All interactive elements (buttons, inputs, forms)
 * 3. All onClick/onChange handlers
 * 4. All navigation links
 * 
 * Then compares against feature-registry.json to identify gaps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const REGISTRY_PATH = path.join(__dirname, '../src/lib/feature-registry.json');
const OUTPUT_PATH = path.join(__dirname, '../feature-audit-report.json');

// Patterns to search for
const PATTERNS = {
  ids: /id=["']([a-z0-9-]+)["']/gi,
  buttons: /<[Bb]utton[^>]*>/g,
  inputs: /<[Ii]nput[^>]*>/g,
  forms: /<form[^>]*>/g,
  links: /<Link[^>]*href=["']([^"']+)["']/g,
  onClick: /onClick=\{([^}]+)\}/g,
  onChange: /onChange=\{([^}]+)\}/g,
  onSubmit: /onSubmit=\{([^}]+)\}/g,
};

// Results storage
const results = {
  totalFiles: 0,
  totalIds: 0,
  totalInteractive: 0,
  idsByFile: {},
  interactiveByFile: {},
  allIds: new Set(),
  registeredIds: new Set(),
  missingIds: new Set(),
  unusedRegisteredIds: new Set(),
};

/**
 * Recursively find all .tsx and .ts files
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', 'build'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Extract all IDs from a file
 */
function extractIds(content) {
  const ids = [];
  let match;
  
  const regex = /id=["']([a-z0-9-]+)["']/gi;
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  
  return ids;
}

/**
 * Count interactive elements
 */
function countInteractive(content) {
  return {
    buttons: (content.match(PATTERNS.buttons) || []).length,
    inputs: (content.match(PATTERNS.inputs) || []).length,
    forms: (content.match(PATTERNS.forms) || []).length,
    links: (content.match(PATTERNS.links) || []).length,
    onClick: (content.match(PATTERNS.onClick) || []).length,
    onChange: (content.match(PATTERNS.onChange) || []).length,
    onSubmit: (content.match(PATTERNS.onSubmit) || []).length,
  };
}

/**
 * Load existing feature registry
 */
function loadRegistry() {
  try {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    const registeredIds = new Set();
    
    registry.clusters.forEach(cluster => {
      cluster.features.forEach(feature => {
        feature.ui_ids.forEach(id => registeredIds.add(id));
      });
    });
    
    return registeredIds;
  } catch (error) {
    console.error('Error loading registry:', error.message);
    return new Set();
  }
}

/**
 * Main scanning function
 */
function scanCodebase() {
  console.log('🔍 Scanning codebase for features...\n');
  
  const files = findFiles(SRC_DIR);
  results.totalFiles = files.length;
  
  files.forEach(file => {
    const relativePath = path.relative(SRC_DIR, file);
    const content = fs.readFileSync(file, 'utf8');
    
    // Extract IDs
    const ids = extractIds(content);
    if (ids.length > 0) {
      results.idsByFile[relativePath] = ids;
      ids.forEach(id => results.allIds.add(id));
      results.totalIds += ids.length;
    }
    
    // Count interactive elements
    const interactive = countInteractive(content);
    const totalInteractive = Object.values(interactive).reduce((a, b) => a + b, 0);
    
    if (totalInteractive > 0) {
      results.interactiveByFile[relativePath] = interactive;
      results.totalInteractive += totalInteractive;
    }
  });
  
  console.log(`✅ Scanned ${results.totalFiles} files`);
  console.log(`✅ Found ${results.totalIds} unique IDs`);
  console.log(`✅ Found ${results.totalInteractive} interactive elements\n`);
}

/**
 * Compare with registry
 */
function compareWithRegistry() {
  console.log('🔍 Comparing with feature registry...\n');
  
  results.registeredIds = loadRegistry();
  
  // Find IDs in code but not in registry
  results.allIds.forEach(id => {
    if (!results.registeredIds.has(id)) {
      results.missingIds.add(id);
    }
  });
  
  // Find IDs in registry but not in code (potentially removed/renamed)
  results.registeredIds.forEach(id => {
    if (!results.allIds.has(id)) {
      results.unusedRegisteredIds.add(id);
    }
  });
  
  console.log(`📊 Registry Coverage: ${results.registeredIds.size} IDs registered`);
  console.log(`⚠️  Missing from Registry: ${results.missingIds.size} IDs`);
  console.log(`🗑️  Unused in Registry: ${results.unusedRegisteredIds.size} IDs\n`);
}

/**
 * Generate report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.totalFiles,
      totalIds: results.totalIds,
      totalInteractive: results.totalInteractive,
      registeredIds: results.registeredIds.size,
      missingIds: results.missingIds.size,
      unusedIds: results.unusedRegisteredIds.size,
      coverage: ((results.registeredIds.size / results.totalIds) * 100).toFixed(2) + '%',
    },
    missingIds: Array.from(results.missingIds).sort(),
    unusedRegisteredIds: Array.from(results.unusedRegisteredIds).sort(),
    idsByFile: results.idsByFile,
    interactiveByFile: results.interactiveByFile,
  };
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));
  
  console.log('📝 Report generated at:', OUTPUT_PATH);
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Coverage: ${report.summary.coverage}`);
  console.log(`Missing IDs: ${report.summary.missingIds}`);
  console.log(`Unused IDs: ${report.summary.unusedIds}`);
  console.log('='.repeat(60) + '\n');
  
  if (results.missingIds.size > 0) {
    console.log('⚠️  MISSING IDs (not in registry):');
    Array.from(results.missingIds).slice(0, 20).forEach(id => {
      console.log(`   - ${id}`);
    });
    if (results.missingIds.size > 20) {
      console.log(`   ... and ${results.missingIds.size - 20} more`);
    }
    console.log('');
  }
  
  if (results.unusedRegisteredIds.size > 0) {
    console.log('🗑️  UNUSED IDs (in registry but not in code):');
    Array.from(results.unusedRegisteredIds).slice(0, 20).forEach(id => {
      console.log(`   - ${id}`);
    });
    if (results.unusedRegisteredIds.size > 20) {
      console.log(`   ... and ${results.unusedRegisteredIds.size - 20} more`);
    }
  }
}

// Run the script
scanCodebase();
compareWithRegistry();
generateReport();
