import { codeToHtml, type BundledLanguage } from 'shiki'

const EXT_LANG: Record<string, BundledLanguage> = {
  bash: 'bash',
  c: 'c',
  cjs: 'javascript',
  clj: 'clojure',
  cljs: 'clojure',
  cmake: 'cmake',
  cpp: 'cpp',
  cs: 'csharp',
  css: 'css',
  dart: 'dart',
  dockerfile: 'dockerfile',
  edn: 'clojure',
  el: 'emacs-lisp',
  elm: 'elm',
  erl: 'erlang',
  ex: 'elixir',
  exs: 'elixir',
  fish: 'fish',
  go: 'go',
  graphql: 'graphql',
  groovy: 'groovy',
  h: 'c',
  haml: 'haml',
  hbs: 'handlebars',
  hpp: 'cpp',
  hs: 'haskell',
  html: 'html',
  ini: 'ini',
  java: 'java',
  jl: 'julia',
  js: 'javascript',
  json: 'json',
  jsonc: 'jsonc',
  jsx: 'jsx',
  kt: 'kotlin',
  less: 'less',
  lua: 'lua',
  md: 'markdown',
  mdx: 'mdx',
  mjs: 'javascript',
  mk: 'makefile',
  ml: 'ocaml',
  nim: 'nim',
  nix: 'nix',
  php: 'php',
  pl: 'perl',
  py: 'python',
  r: 'r',
  rb: 'ruby',
  rs: 'rust',
  sass: 'sass',
  scala: 'scala',
  scss: 'scss',
  sh: 'bash',
  sql: 'sql',
  svelte: 'svelte',
  swift: 'swift',
  tex: 'latex',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'tsx',
  vue: 'vue',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  zig: 'zig',
  zsh: 'bash',
}

const BASENAME_LANG: Record<string, BundledLanguage> = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
}

function detectLang(path: string): BundledLanguage | 'text' {
  const lower = path.toLowerCase()
  const base = lower.split('/').pop() ?? lower
  if (base in BASENAME_LANG) return BASENAME_LANG[base]
  const ext = base.includes('.') ? base.split('.').pop()! : ''
  return EXT_LANG[ext] ?? 'text'
}

const cache = new Map<string, Promise<string>>()

export function highlightCode(
  code: string,
  path: string,
  theme: 'light' | 'dark',
): Promise<string> {
  const lang = detectLang(path)
  const key = `${theme}:${lang}:${path}:${code.length}:${code.slice(0, 64)}`
  const existing = cache.get(key)
  if (existing) return existing
  const promise = codeToHtml(code, {
    lang,
    theme: theme === 'dark' ? 'github-dark' : 'github-light',
  }).catch((err: unknown) => {
    cache.delete(key)
    throw err
  })
  cache.set(key, promise)
  return promise
}
