// Learn more https://docs.expo.dev/guides/monorepos
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo
config.watchFolders = [workspaceRoot];

// Allow Metro to resolve modules from the monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

// REMOVED: disableHierarchicalLookup was causing expo-doctor failures
// and potentially affecting the runtime. Let hierarchical lookup work
// since we've set nodeModulesPaths correctly.

module.exports = config;
