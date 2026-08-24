const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

function isEsmAuthPackage(request) {
  return (
    request === 'better-auth' ||
    request.startsWith('better-auth/') ||
    request.startsWith('@better-auth/') ||
    request.startsWith('@thallesp/nestjs-better-auth') ||
    request.startsWith('better-call') ||
    request.startsWith('@noble/') ||
    request.startsWith('@better-fetch/') ||
    request === 'jose' ||
    request.startsWith('jose/') ||
    request === 'nanostores' ||
    request.startsWith('nanostores/') ||
    request === 'kysely' ||
    request.startsWith('kysely/') ||
    request === 'defu' ||
    request.startsWith('defu/')
  );
}

function isPackageRequest(request) {
  if (!request) {
    return false;
  }
  if (
    request.startsWith('.') ||
    request.startsWith('/') ||
    request.startsWith('node:')
  ) {
    return false;
  }
  if (/^[A-Za-z]:[\\/]/.test(request)) {
    return false;
  }
  return true;
}

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: [
    function ({ request }, callback) {
      if (!isPackageRequest(request) || isEsmAuthPackage(request)) {
        return callback();
      }
      return callback(null, `commonjs ${request}`);
    },
  ],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      externalDependencies: 'none',
      mergeExternals: true,
    }),
  ],
};
