const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');

// Load application TS/TSX in Node's test runner without a second build setup.
// Mocks intercept dependencies before execution; browser globals stay untouched.
function createLoader(mocks = {}) {
  const cache = new Map();

  function load(filename) {
    let file = path.resolve(root, filename);
    if (!fs.existsSync(file)) {
      file = [file + '.ts', file + '.tsx', path.join(file, 'index.ts')]
        .find(fs.existsSync) ?? file;
    }
    if (Object.hasOwn(mocks, file)) return mocks[file];
    if (cache.has(file)) return cache.get(file).exports;

    const module = { exports: {} };
    cache.set(file, module);
    const source = fs.readFileSync(file, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2017,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: file,
    });
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (specifier.startsWith('@/')) return load('src/' + specifier.slice(2));
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(file), specifier));
      return require(specifier);
    };
    new Function('require', 'module', 'exports', outputText)(localRequire, module, module.exports);
    return module.exports;
  }

  return load;
}

module.exports = { createLoader, root };
