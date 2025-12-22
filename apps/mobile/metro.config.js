const {getDefaultConfig} = require('expo/metro-config');
const {withShareExtension} = require('expo-share-extension/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Handle monorepo setup
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Handle workspace dependencies
config.resolver.alias = {
  '@stashl/domain': path.resolve(workspaceRoot, 'packages/domain/src'),
};

module.exports = withShareExtension(config);
