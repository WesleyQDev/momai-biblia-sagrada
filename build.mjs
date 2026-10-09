import { build, context } from 'esbuild'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'))

const entries = []
if (manifest.ui?.page && existsSync(path.join(__dirname, 'src/page.tsx'))) {
  entries.push({ in: 'src/page.tsx', out: 'page' })
}
if (Array.isArray(manifest.ui?.widgets)) {
  for (const widget of manifest.ui.widgets) {
    const entry = widget?.entry || widget?.file
    if (!entry || typeof entry !== 'string' || !entry.startsWith('dist/') || !entry.endsWith('.js')) continue
    const out = entry.slice('dist/'.length, -'.js'.length)
    const id = widget?.id
    const candidates = id ? [`src/widgets/${id}.tsx`, `src/widgets/${id}.ts`, `src/widget-${id}.tsx`] : []
    for (const candidate of candidates) {
      if (existsSync(path.join(__dirname, candidate))) {
        entries.push({ in: candidate, out })
        break
      }
    }
  }
}

mkdirSync(path.join(__dirname, 'dist'), { recursive: true })

const makeHostGlobalsPlugin = {
  name: 'make-host-globals',
  setup(build) {
    const mapGlobal = (filter, globalName, namespace) => {
      build.onResolve({ filter }, (args) => {
        return { path: args.path, namespace }
      })
      build.onLoad({ filter, namespace }, () => {
        return {
          contents: `module.exports = ${globalName};`,
          loader: 'js'
        }
      })
    }
    mapGlobal(/^react$/, 'window.React', 'react-global')
    mapGlobal(/^react-dom$/, 'window.ReactDOM', 'react-dom-global')
    mapGlobal(/^react\/jsx-runtime$/, 'window.JSXRuntime', 'react-jsx-runtime-global')
    mapGlobal(/^momai:sdk$/, 'window.MomAISDK', 'sdk-global')
  }
}

// Locate MomAI renderer source
let momaiSrcDir = path.resolve(__dirname, '../../../../src/renderer/src')
if (!existsSync(momaiSrcDir)) {
  momaiSrcDir = path.resolve(__dirname, '../momai/apps/momai/src/renderer/src')
}
if (!existsSync(momaiSrcDir)) {
  momaiSrcDir = path.resolve(__dirname, '../../momai/apps/momai/src/renderer/src')
}

/** @type {import('esbuild').BuildOptions} */
const uiOptions = {
  entryPoints: entries.map((e) => ({ in: e.in, out: e.out })),
  bundle: true,
  format: 'esm',
  // Enables lazy translation chunks: the six Bible datasets are only fetched
  // when the reader selects them instead of being inlined in every entry.
  splitting: true,
  jsx: 'automatic',
  jsxImportSource: 'react',
  target: 'es2022',
  platform: 'browser',
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  outdir: 'dist',
  logLevel: 'info',
  loader: {
    '.json': 'json',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.svg': 'dataurl'
  },
  nodePaths: [path.join(__dirname, 'node_modules')],
  plugins: [makeHostGlobalsPlugin],
  alias: {
    'momai:registry': path.resolve(momaiSrcDir, 'components/chat/SkillResponseRegistry.ts'),
    'momai:events': path.resolve(momaiSrcDir, 'hooks/useExtensionEvents.ts'),
    'momai:api': path.resolve(momaiSrcDir, 'services/api.ts'),
    'momai:constants': path.resolve(momaiSrcDir, 'constants.ts')
  }
}

// The packager excludes src/ and lib/ from the ZIP, so the background worker
// is bundled into a self-contained dist/runtime.js (the manifest points at it).
// Assets stay external because the worker reads them from disk at runtime.
const workerOptions = {
  entryPoints: [path.join(__dirname, 'runtime.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  outfile: path.join(__dirname, 'dist/runtime.js'),
  sourcemap: true,
  logLevel: 'info',
  nodePaths: [path.join(__dirname, 'node_modules')]
}

async function buildAll() {
  if (entries.length > 0) {
    await build(uiOptions)
  } else {
    console.log('[momai-biblia-sagrada:build] No UI entries in manifest.')
  }
  await build(workerOptions)
  console.log(
    '[momai-biblia-sagrada:build] Built →',
    [...entries.map((e) => e.out + '.js'), 'runtime.js'].join(', ')
  )
}

if (process.argv.includes('--watch')) {
  const contexts = []
  if (entries.length > 0) contexts.push(await context(uiOptions))
  contexts.push(await context(workerOptions))
  await Promise.all(contexts.map((ctx) => ctx.watch()))
  console.log('[momai-biblia-sagrada:build] Watching for changes...')
} else {
  await buildAll()
}
