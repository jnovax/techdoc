# Design Spec: Modernized Build Infrastructure with Rspack, SWC, and LightningCSS

## 1. Context & Motivation

### 1.1 Current State
TechDoc's frontend asset bundling infrastructure is currently based on **Webpack 4.47.0** (released in 2020) and **Babel 6.26.3** (dating back to 2017).
This legacy setup introduces several significant issues:
1. **Slow Build Times**: Running full asset bundling takes ~30–60 seconds due to single-threaded JavaScript-based compilation in Webpack 4 and Babel 6.
2. **Obsolete Dependencies & Vulnerabilities**: Relies on EOL libraries including `babel-core`, `babel-loader 7`, `optimize-css-assets-webpack-plugin`, and `mini-css-extract-plugin 1.x`.
3. **Node.js Incompatibility Workarounds**: Webpack 4 relies on legacy OpenSSL algorithms (`md4`), requiring an in-memory monkey-patch of `crypto.createHash` to run on Node.js 18+.
4. **Bloated Client Bundles**: Monolithic `babel-polyfill` is bundled into every major entry point (`index`, `pretty`, `slide`, `cover`), inflating client bundles by ~100KB per page with obsolete polyfills (e.g. for IE11).

### 1.2 Target Vision
Replace the legacy Webpack 4 stack with **Rspack 1.x** (Rust-based drop-in bundler) with built-in **SWC** (Rust JavaScript/TypeScript transpiler) and **LightningCSS** (Rust CSS parser, compiler, and minifier).
The new build system will:
- Accelerate build speeds by **15x–30x** (reducing build times to 1–3 seconds).
- Drop legacy `babel-polyfill` in favor of modern evergreen targets (`ES2020+`).
- Use native Rust LightningCSS for parsing, autoprefixing, and minification.
- Eliminate deprecated dependencies and the `crypto.createHash` monkey-patch.
- Maintain **100% backward compatibility** with existing Express EJS templates and runtime bundles.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- **High-Performance Rust Build**: Seamless compilation using `@rspack/core` and `@rspack/cli`.
- **Drop-in Asset & Partial Generation**: Generate identical bundle entry names (`index`, `pretty`, `slide`, `cover`, `font-pack`) and EJS partials (`*-pack-header.ejs`, `*-pack-scripts.ejs`) in `app/public/views/build/` and `app/public/build/`.
- **Modern Browser Optimization (ES2020+)**: Eliminate `babel-polyfill`, reducing bundle sizes while retaining modern language features.
- **Native CSS with LightningCSS**: Enable `experiments.css: true` and `rspack.LightningCssMinimizerRspackPlugin` to eliminate `mini-css-extract-plugin` and `optimize-css-assets-webpack-plugin`.
- **Hybrid Execution Support**:
  - Direct host execution: `npm run build` / `npm run dev`.
  - Container-based execution: Build helper script/command for containerized environments without host `node_modules`.
- **Automated Verification**: Automated test suites verifying bundle outputs, EJS template references, and runtime HTTP responses.

### 2.2 Non-Goals
- Migrating backend server code (`app.js`, `lib/`) to TypeScript or ES Modules (backend remains CommonJS on Node 18+).
- Rewriting frontend runtime libraries (jQuery, CodeMirror 5, Mermaid, MathJax remain intact).
- Modifying UI layouts or CSS styles.

---

## 3. Architecture & Technology Selection

| Component | Legacy Stack (Webpack 4) | Modernized Stack (Rspack 1.x) | Benefit |
| :--- | :--- | :--- | :--- |
| **Core Bundler** | `webpack 4.47.0` (JS) | `@rspack/core 1.x` (Rust) | 15x–30x faster bundling, native parallelism |
| **CLI Runner** | `webpack-cli 4.10.0` | `@rspack/cli 1.x` | Modern, clean CLI with watch/progress |
| **JS Transpiler** | `babel-loader 7` + `babel-core 6` | `builtin:swc-loader` (Rust) | Instant transpilation, modern ES2020 target |
| **Polyfill Library** | `babel-polyfill` (~100KB) | *None* (Native ES2020+) | ~100KB bundle reduction per page |
| **CSS Extraction** | `mini-css-extract-plugin 1.6` | `experiments.css: true` | Native Rust CSS extraction without extra loaders |
| **CSS Minifier** | `optimize-css-assets-webpack-plugin` | `LightningCssMinimizerRspackPlugin` | Rust-level fast minification & dead-code elimination |
| **HTML/EJS Emitter** | `html-webpack-plugin 4.5.2` | `rspack.HtmlRspackPlugin` | High-speed EJS partial injection |
| **Static Assets Copy** | `copy-webpack-plugin 6.4.1` | `rspack.CopyRspackPlugin` | Rust file copier for MathJax and vendor libs |
| **Crypto Hashing** | `md4` monkey-patch to `sha256` | Native `xxhash64` / `sha256` | Clean Node.js runtime, zero crypto hacks |

---

## 4. Configuration Specification

### 4.1 File Layout
```
app/
├── rspack.common.js       # Shared entries, resolve aliases, shims, plugins, and loaders
├── rspack.dev.js          # Development configuration (cheap-module-source-map, watch)
├── rspack.prod.js         # Production configuration (contenthash, SWC & LightningCSS minimizers)
├── rspack.htmlexport.js   # Standalone bundle for standalone HTML export feature
└── package.json           # Updated scripts and modernized devDependencies
```

### 4.2 Entry Points & Output
The bundle architecture preserves all entry points:
- **`font-pack`**: `public/css/font.css`
- **`common`**: jQuery, Velocity, Bootstrap shims
- **`cover` & `cover-pack`**: Cover portal scripts and validation
- **`index` & `index-pack`**: Full Markdown editor, CodeMirror, Socket.io, diagram engines
- **`pretty` & `pretty-pack`**: Read-only documentation viewer
- **`slide` & `slide-pack`**: Reveal.js presentation mode
- **`index-styles` & `index-styles-pack`**: Editor and viewer stylesheet packs

Output specification:
- Production: `public/build/[name].[contenthash:10].js` and `public/build/[name].[contenthash:10].css`
- Development: `public/build/[name].js` and `public/build/[name].css`

### 4.3 Native CSS & LightningCSS Configuration
```javascript
// rspack.common.js
experiments: {
  css: true // Enable native LightningCSS pipeline
}
```
In `rspack.prod.js`:
```javascript
optimization: {
  minimizer: [
    new rspack.SwcJsMinimizerRspackPlugin({
      format: { comments: false }
    }),
    new rspack.LightningCssMinimizerRspackPlugin()
  ],
  splitChunks: {
    chunks: 'all'
  }
}
```

### 4.4 Shims, Expose, & ProvidePlugin
Existing global variable requirements are preserved:
- `ProvidePlugin`:
  - `Visibility: 'visibilityjs'`
  - `Cookies: 'js-cookie'`
  - `key: 'keymaster'`
  - `$: 'jquery'`, `jQuery: 'jquery'`, `'window.jQuery': 'jquery'`
  - `moment: 'moment'`
  - `CodeMirror: '@hedgedoc/codemirror-5/lib/codemirror.js'`
- `externals`:
  - `'socket.io-client': 'io'`
  - `'jquery': '$'`
  - `'moment': 'moment'`
  - `'select2': 'select2'`
  - `'constrain-object': 'ConstrainObject'`
- `imports-loader` & `exports-loader` compatibility for `codemirror-spell-checker` and `ot.min.js`.

### 4.5 EJS Partials Generation with HtmlRspackPlugin
Emits the exact 8 partial templates required by the Express view engine:
1. `index-pack-header.ejs` & `index-pack-scripts.ejs`
2. `cover-pack-header.ejs` & `cover-pack-scripts.ejs`
3. `pretty-pack-header.ejs` & `pretty-pack-scripts.ejs`
4. `slide-pack-header.ejs` & `slide-pack-scripts.ejs`

Templates read `htmlWebpackPlugin.files.css` and `htmlWebpackPlugin.files.js` with `defer`, ensuring seamless rendering.

---

## 5. Execution Workflows & Container Integration

### 5.1 Host-Based Execution
```bash
# Production asset build
npm run build         # invokes: rspack build --config rspack.prod.js

# Development watch mode
npm run dev           # invokes: rspack build --config rspack.dev.js --watch
```

### 5.2 Standalone Container Build (No Host `node_modules` required)
For containerized workflows where `node_modules` is not installed on the host machine:
```bash
# Standalone build script: bin/build-assets.sh
podman run --rm \
  -v "$(pwd)/app:/app:z" \
  -w /app \
  node:22-alpine \
  sh -c "npm install && npm run build"
```

---

## 6. Dependency Cleanup & Pruning

### 6.1 Dependencies to Remove
- `babel-core`, `babel-cli`, `babel-loader`, `babel-plugin-transform-runtime`, `babel-polyfill`, `babel-preset-env`, `babel-runtime`
- `webpack`, `webpack-cli`, `webpack-merge`
- `mini-css-extract-plugin`, `optimize-css-assets-webpack-plugin`
- `esbuild-loader` (replaced by built-in SWC and LightningCSS)
- `url-loader`, `file-loader` (replaced by Rspack Asset Modules)

### 6.2 Dependencies to Add
- `@rspack/core`: `^1.0.0`
- `@rspack/cli`: `^1.0.0`

---

## 7. Verification & Testing Strategy

1. **Automated Bundle Integrity Test (`app/test/rspack-build.test.js`)**:
   - Verify that running the build produces expected hashed assets in `public/build/`.
   - Verify that all 8 EJS partials in `public/views/build/` are non-empty and contain valid `<link>` and `<script defer>` tags.
   - Verify that legacy `babel-polyfill` is not present in output bundles.
2. **Existing Layout & UI Test Suites**:
   - `app/test/widescreen-layout.test.js`
   - `app/test/docusaurus-theme.test.js`
   - `app/test/docusaurus-tokens.test.js`
   - `app/test/inpage-search.test.js`
3. **HTTP Smoke Testing**:
   - Test that `/` (Dashboard), `/features` (Editor), and `/s/features` (Publish Viewer) return HTTP 200 with correct CSS and JS assets loaded.
