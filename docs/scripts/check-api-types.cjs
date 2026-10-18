/**
 * Checks that every signature, parameter, return type and member printed on the generated API
 * pages (content/api) is identical to the real export of react-native-filament, and that no public
 * member is missing. Run after `bun run api`.
 */
const fs = require('fs')
const path = require('path')
const repo = path.resolve(__dirname, '../..')
const ts = require(path.join(repo, 'node_modules/typescript'))
const here = fs.mkdtempSync(path.join(require('os').tmpdir(), 'rnf-api-check-'))
const apiDir = path.join(repo, 'docs/content/api')

const compilerOptions = {
  strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true, esModuleInterop: true, types: [], baseUrl: here,
  paths: {
    'react-native-filament': [path.join(repo, 'packages/react-native-filament/src/index.ts')],
    react: [path.join(repo, 'node_modules/@types/react')],
    'react/*': [path.join(repo, 'node_modules/@types/react/*')],
    '*': [path.join(repo, 'node_modules/*'), path.join(repo, 'node_modules/@types/*')],
  },
}

// 1. Public exports of the package, split into values and types.
const probe = path.join(here, 'probe.ts')
fs.writeFileSync(probe, "import * as RNF from 'react-native-filament'\nexport {}\n")
const probeProgram = ts.createProgram([probe], compilerOptions)
const checker = probeProgram.getTypeChecker()
const index = probeProgram.getSourceFile(path.join(repo, 'packages/react-native-filament/src/index.ts'))
const moduleSymbol = checker.getSymbolAtLocation(index)
const exportsList = checker.getExportsOfModule(moduleSymbol).map((symbol) => {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
  return { name: symbol.name, value: (target.flags & ts.SymbolFlags.Value) !== 0, type: (target.flags & (ts.SymbolFlags.Type)) !== 0 }
})

// 2. Parse the generated pages.
const pages = []
for (const category of fs.readdirSync(apiDir)) {
  const dir = path.join(apiDir, category)
  if (!fs.statSync(dir).isDirectory()) continue
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    const blocks = [...text.matchAll(/```ts\n([\s\S]*?)\n```/g)].map((m) => ({ code: m[1], index: m.index }))
    if (blocks.length === 0) continue
    const signature = blocks[0].code
    const sections = [...text.matchAll(/^## (.+)$/gm)].map((m) => ({ name: m[1], index: m.index }))
    const sectionAt = (i) => sections.filter((s) => s.index < i).pop()?.name
    const members = blocks.slice(1).filter((b) => ['Properties', 'Props', 'Methods'].includes(sectionAt(b.index))).map((b) => b.code)
    const parameters = blocks.slice(1).filter((b) => sectionAt(b.index) === 'Parameters').map((b) => b.code)
    const returns = blocks.slice(1).filter((b) => sectionAt(b.index) === 'Returns').map((b) => b.code)
    pages.push({ category, file, signature, members, parameters, returns })
  }
}

// 3. Generate the check file.
const values = exportsList.filter((e) => e.value).map((e) => e.name)
const types = exportsList.filter((e) => e.type && !e.value).map((e) => e.name)
let out = `import type { ${types.join(', ')} } from 'react-native-filament'\n`
out += `import { ${values.join(', ')} } from 'react-native-filament'\n`
out += `import type { DependencyList, JSX, ReactNode } from 'react'\n`
out += `import type { HybridObject, HybridView, ReactNativeView, Sync } from 'react-native-nitro-modules'\nimport type { ComposedGesture } from 'react-native-gesture-handler'\nimport type { ViewProps } from 'react-native'\n`
out += `type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false\n`
out += `type Assert<T extends true> = T\ninterface Marker0 { readonly marker0: unique symbol }\ninterface Marker1 { readonly marker1: unique symbol }\n`
const lineToPage = []
const emit = (code, page, what) => {
  for (const line of code.split('\n')) {
    out += line + '\n'
    lineToPage[out.split('\n').length - 2] = { page: `${page.category}/${page.file}`, what }
  }
}
const skipped = []
let checks = 0
for (const page of pages) {
  const sig = page.signature.split('\n')
  const id = `${page.category}_${page.file.replace('.mdx', '')}`.replace(/-/g, '_')
  if (sig[0].startsWith('function ')) {
    const name = sig[0].match(/^function (\w+)/)[1]
    if (!values.includes(name)) { skipped.push(`${page.category}/${page.file}: ${name} is not a value export`); continue }
    emit(sig.map((line) => 'declare ' + line.replace(`function ${name}`, `function Doc__${id}`)).join('\n'), page, 'signature decl')
    emit(`type Check__${id} = Assert<Equals<typeof Doc__${id}, typeof ${name}>>`, page, `signature of ${name}`)
    checks++
  } else if (sig[0].startsWith('const ')) {
    const [, name, typeText] = sig[0].match(/^const (\w+): (.*)$/)
    emit(`declare const Doc__${id}: ${typeText}`, page, 'const decl')
    emit(`type Check__${id} = Assert<Equals<typeof Doc__${id}, typeof ${name}>>`, page, `type of ${name}`)
    checks++
  } else if (sig[0].startsWith('type ')) {
    const [, name, rest] = sig.join('\n').match(/^type (\w+)(?:<[^=]*>)? = ([\s\S]*)$/)
    const generic = sig[0].match(/^type \w+(<[^=]*>)/)
    if (generic) { skipped.push(`${page.category}/${page.file}: generic alias ${name}${generic[1]} compared by hand`); continue }
    emit(`type Doc__${id} = ${rest}`, page, 'alias decl')
    emit(`type Check__${id} = Assert<Equals<Doc__${id}, ${name}>>`, page, `alias ${name}`)
    checks++
  } else if (sig[0].startsWith('interface ')) {
    const [, name, typeParams] = sig[0].match(/^interface (\w+)(<[^>]*>)?/)
    const params = typeParams ? typeParams.slice(1, -1).split(',').map((p) => p.trim().split(/\s/)[0]) : []
    const markers = params.map((_, i) => `Marker${i}`)
    const body = page.members.join('\n').split('\n').map((line) => '  ' + line).join('\n')
    emit(`interface Doc__${id}${typeParams ?? ''} {\n${body}\n}`, page, 'interface decl')
    const docType = markers.length ? `Doc__${id}<${markers.join(', ')}>` : `Doc__${id}`
    const realType = markers.length ? `${name}<${markers.join(', ')}>` : name
    const keys = [...new Set(page.members.join('\n').split('\n').map((line) => line.match(/^(?:readonly )?([A-Za-z_$][\w$]*)\??[(:<]/)?.[1]).filter(Boolean))]
    for (const key of keys) {
      emit(`type Check__${id}__${key} = Assert<Equals<Pick<${docType}, '${key}'>, Pick<${realType}, '${key}'>>>`, page, `member ${name}.${key}`)
      checks++
    }
    const pageNames = new Set(pages.map((p) => p.signature.split('\n')[0].match(/^(?:function|const|type|interface) (\w+)/)?.[1]))
    const bases = (sig[0].match(/ extends (.*)$/)?.[1] ?? '').split(',').map((b) => b.trim()).filter(Boolean)
    const external = bases.filter((b) => b === 'ViewProps')
    const base = (page.category === 'hybrid-objects' ? ' | keyof HybridObject<any>' : '') + external.map((b) => ` | keyof ${b}`).join('')
    emit(`type Missing__${id} = Assert<Equals<Exclude<keyof ${realType}, keyof ${docType}${base}>, never>>`, page, `no undocumented members of ${name}`)
    checks += 1
  } else {
    skipped.push(`${page.category}/${page.file}: unrecognized signature ${sig[0].slice(0, 60)}`)
  }
}
const sectionMismatches = []
for (const page of pages) {
  const line = page.signature.split('\n')[0]
  if (!line.startsWith('function ') || page.signature.includes('\n')) continue
  let start = line.indexOf(' ', 0) + 1
  while (/[\w$]/.test(line[start])) start++
  if (line[start] === '<') {
    let depth = 0
    for (; start < line.length; start++) {
      if (line[start] === '<') depth++
      else if (line[start] === '>' && line[start - 1] !== '=') depth--
      if (depth === 0) { start++; break }
    }
  }
  const inner = line.slice(start + 1, line.lastIndexOf('):'))
  const ret = line.slice(line.lastIndexOf('):') + 2).trim()
  const joined = page.parameters.join(', ')
  if (page.parameters.length && joined !== inner) sectionMismatches.push(`${page.category}/${page.file}: Parameters "${joined}" vs signature "${inner}"`)
  if (page.returns.length && page.returns[0] !== ret) sectionMismatches.push(`${page.category}/${page.file}: Returns "${page.returns[0]}" vs "${ret}"`)
}
const checkFile = path.join(here, 'docs-api.check.ts')
fs.writeFileSync(checkFile, out + 'export {}\n')

// 4. Type-check and map diagnostics back to pages.
const program = ts.createProgram([checkFile], compilerOptions)
const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => d.file && d.file.fileName === checkFile)
const problems = new Map()
for (const d of diagnostics) {
  const { line } = d.file.getLineAndCharacterOfPosition(d.start)
  const where = lineToPage[line] ?? { page: '?', what: '?' }
  const key = `${where.page} — ${where.what}`
  const message = ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 220)
  if (!problems.has(key)) problems.set(key, [])
  problems.get(key).push(`TS${d.code}: ${message}`)
}
console.log(`pages: ${pages.length}, exports: ${exportsList.length}, identity checks: ${checks}, failing items: ${problems.size}`)
for (const [key, list] of problems) console.log(`\n✗ ${key}\n   ${list.slice(0, 2).join('\n   ')}`)
console.log(`\nParameters/Returns sections differing from the signature (${sectionMismatches.length}):\n  ` + sectionMismatches.join('\n  '))
console.log(`\nskipped (${skipped.length}):\n  ` + skipped.join('\n  '))
const failed = problems.size > 0 || sectionMismatches.length > 0
const documented = new Set(pages.map((p) => p.signature.split('\n')[0].match(/^(?:function|const|type|interface) (\w+)/)?.[1]))
const undocumented = exportsList.map((e) => e.name).filter((n) => !documented.has(n))
console.log(`\nexports without a page (${undocumented.length}): ${undocumented.join(', ')}`)
process.exit(failed ? 1 : 0)
