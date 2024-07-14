import { nodeExternalsPlugin } from 'esbuild-node-externals';
import esbuildPluginClean from 'esbuild-plugin-clean';
import esbuildPluginTsc from 'esbuild-plugin-tsc';
import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/main.bundle.js',
  platform: 'node',
  target: ['es2022'],
  tsconfig: 'tsconfig.json',
  logLevel: 'debug',
  format: 'cjs',
  plugins: [
    esbuildPluginClean({ patterns: 'dist/*' }),
    esbuildPluginTsc(),
    nodeExternalsPlugin({
      packagePath: 'package.json',
      allowList: [
        'boxen',
        'execa',
        'ora'
      ]
    })
  ]
})
.catch((err) => process.exit(1));
