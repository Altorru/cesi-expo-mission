const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// boneyard-js publie native.tsx (TypeScript brut) dans ses exports "default".
// Metro ne transpile pas les node_modules non connus → on force la résolution
// vers native.js (le fichier compilé) pour éviter toute erreur de syntaxe.
const originalResolver = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'boneyard-js/native') {
    return {
      filePath: require.resolve('boneyard-js/dist/native.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
