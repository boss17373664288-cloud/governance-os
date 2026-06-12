const {getDefaultConfig, mergeConfig} = require('metro-config');
const path = require('path');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig();
  
  const rnPath = path.dirname(require.resolve('react-native/package.json'));
  
  return mergeConfig(defaultConfig, {
    projectRoot: __dirname,
    watchFolders: [__dirname],
    resolver: {
      assetExts: [...defaultConfig.resolver.assetExts],
      sourceExts: [...defaultConfig.resolver.sourceExts],
      resolveRequest: (context, moduleName, platform) => {
        if (moduleName === 'missing-asset-registry-path') {
          return {
            filePath: path.join(rnPath, 'Libraries/Image/AssetRegistry.js'),
            type: 'sourceFile',
          };
        }
        return context.resolveRequest(context, moduleName, platform);
      },
    },
    transformer: {
      assetRegistryPath: path.join(rnPath, 'Libraries/Image/AssetRegistry'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  });
})();