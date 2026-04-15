const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// boneyard-js publie native.tsx (TypeScript brut) dans ses exports "default".
// Metro ne transpile pas les node_modules non connus → on force la résolution
// vers native.js (le fichier compilé à la racine du package) pour éviter
// l'erreur "Package subpath './dist/native.js' is not defined by exports".
const originalResolver = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'boneyard-js/native') {
    const path = require('path');
    return {
      filePath: path.resolve(__dirname, 'node_modules/boneyard-js/native.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
