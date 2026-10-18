/**
 * Turns `.source/typedoc.json` into `content/api/**`: one MDX page per public export, grouped into
 * components, hooks, hybrid objects, functions and types. Every page except a type's has Declarative
 * and Imperative usage.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ApiExample } from '../config/api-examples/types'

interface CommentPart {
  kind: 'text' | 'code' | 'inline-tag'
  text: string
  tag?: string
  target?: number | object
}

interface Comment {
  summary: CommentPart[]
  modifierTags?: string[]
  blockTags?: { tag: string; content: CommentPart[] }[]
}

interface TypeNode {
  type: string
  name?: string
  qualifiedName?: string
  value?: unknown
  target?: number | object
  typeArguments?: TypeNode[]
  types?: TypeNode[]
  elementType?: TypeNode
  elements?: TypeNode[]
  element?: TypeNode
  declaration?: Reflection
  queryType?: TypeNode
  operator?: string
  objectType?: TypeNode
  indexType?: TypeNode
  isOptional?: boolean
  head?: string
  tail?: [TypeNode, string][]
  checkType?: TypeNode
  extendsType?: TypeNode
  trueType?: TypeNode
  falseType?: TypeNode
  parameter?: string
  parameterType?: TypeNode
  templateType?: TypeNode
  asserts?: boolean
  targetType?: TypeNode
}

interface Reflection {
  defaultValue?: string
  default?: TypeNode
  id: number
  name: string
  kind: number
  flags: { isOptional?: boolean; isReadonly?: boolean; isRest?: boolean }
  comment?: Comment
  children?: Reflection[]
  signatures?: Reflection[]
  parameters?: Reflection[]
  type?: TypeNode
  typeParameters?: Reflection[]
  extendedTypes?: TypeNode[]
  inheritedFrom?: TypeNode
  indexSignatures?: Reflection[]
  getSignature?: Reflection
  target?: number
  sources?: { fileName: string }[]
}

const KIND = {
  module: 2,
  variable: 32,
  function: 64,
  interface: 256,
  property: 1024,
  method: 2048,
  accessor: 262144,
  typeAlias: 2097152,
  reference: 4194304,
} as const

type Category = 'components' | 'hooks' | 'hybrid-objects' | 'functions' | 'types'

const CATEGORY_TITLES: Record<Category, string> = {
  components: 'Components',
  hooks: 'Hooks',
  'hybrid-objects': 'Hybrid Objects',
  functions: 'Functions',
  types: 'Types',
}

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  components: 'React components that build a scene declaratively.',
  hooks: 'React hooks for engines, models, physics, threading and bindings.',
  'hybrid-objects': 'The native Nitro objects behind every component, for imperative use.',
  functions: 'The `Filament` entry point, `runOnRenderThread` and `bindSharedValue`, the bundled `defaultIndirectLightSource`, and math helpers that run in any runtime.',
  types: 'Option, value and result types.',
}

const root = join(import.meta.dirname, '..')
const project = JSON.parse(readFileSync(join(root, '.source/typedoc.json'), 'utf8')) as Reflection
const outDir = join(root, 'content/api')

async function loadExamples(): Promise<Record<string, ApiExample>> {
  const sources = await Promise.all([
    import('../config/api-examples/components-hooks').then(
      (module) => module.componentAndHookExamples as Record<string, ApiExample>,
      () => ({})
    ),
    import('../config/api-examples/objects-functions').then(
      (module) => module.objectAndFunctionExamples as Record<string, ApiExample>,
      () => ({})
    ),
  ])
  return Object.assign({}, ...sources)
}

const kebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()

interface Page {
  category: Category
  reflection: Reflection
  slug: string
}

const indexModule = project.children!.find((child) => child.name === 'index')!
const specModules = project.children!.filter((child) => child.name.endsWith('.nitro'))
const byId = new Map<number, Reflection>()
const parentById = new Map<number, Reflection>()
const visit = (reflection: Reflection) => {
  byId.set(reflection.id, reflection)
  reflection.children?.forEach((child) => parentById.set(child.id, reflection))
  reflection.children?.forEach(visit)
}
project.children!.forEach(visit)

const publicNames = new Set(indexModule.children!.map((child) => child.name))
const pages: Page[] = []
const urlById = new Map<number, string>()

function addPage(category: Category, reflection: Reflection) {
  const slug = kebab(reflection.name)
  pages.push({ category, reflection, slug })
  urlById.set(reflection.id, `/api/${category}/${slug}`)
}

for (const module of specModules) {
  for (const child of module.children ?? []) {
    const isHybridObject = child.extendedTypes?.some((type) => type.name === 'HybridObject') ?? false
    if (child.kind === KIND.interface && isHybridObject && publicNames.has(child.name)) addPage('hybrid-objects', child)
  }
}
const hybridByName = new Map(pages.filter((page) => page.category === 'hybrid-objects').map((page) => [page.reflection.name, page]))

function isInternal(reflection: Reflection): boolean {
  const comment = reflection.comment ?? reflection.signatures?.[0]?.comment
  const tagged = (comment?.modifierTags ?? []).some((tag) => tag === '@internal' || tag === '@hidden')
  return tagged || /^internal\b/i.test(partsToPlain(comment?.summary).trim())
}

/**
 * The index exports. A re-export TypeDoc emits as a reference (for example a renamed one, such as
 * `FilamentViewProps as NativeFilamentViewProps`) is resolved to its target under the exported name,
 * unless the target already has a page or is internal.
 */
const publicNameById = new Map<number, string>()
const publicIds = new Set(indexModule.children!.map((child) => (child.kind === KIND.reference && typeof child.target === 'number' ? child.target : child.id)))
const aliases: [number, number][] = []
const exported: Reflection[] = []
for (const child of indexModule.children!) {
  if (child.kind !== KIND.reference) {
    exported.push(child)
    continue
  }
  const target = child.target == null ? undefined : byId.get(child.target)
  if (target == null) continue
  if (target.name !== child.name && !publicNames.has(target.name)) publicNameById.set(target.id, child.name)
  if (isInternal(target)) continue
  if (urlById.has(target.id) || indexModule.children!.includes(target)) {
    aliases.push([child.id, target.id])
    continue
  }
  if (target.name !== child.name) publicNameById.set(target.id, child.name)
  exported.push({ ...target, name: child.name })
}

for (const child of exported) {
  const isComponent = (child.kind === KIND.function && /^[A-Z]/.test(child.name)) || child.name === 'NativeFilamentView'
  if (isComponent) addPage('components', child)
  else if (child.kind === KIND.function && child.name.startsWith('use')) addPage('hooks', child)
  else if (child.kind === KIND.function || child.kind === KIND.variable) addPage('functions', child)
}
for (const child of exported) {
  const hybrid = hybridByName.get(child.name)
  if (child.kind === KIND.typeAlias && hybrid != null) {
    urlById.set(child.id, urlById.get(hybrid.reflection.id)!)
    continue
  }
  if (child.kind === KIND.interface || child.kind === KIND.typeAlias) addPage('types', child)
}
for (const [alias, target] of aliases) {
  const url = urlById.get(target)
  if (url != null) urlById.set(alias, url)
}

/** Components whose native objects are not just the hybrid object of the same name. `{Name}` links a hybrid object. */
const COMPONENT_NATIVE_OBJECTS: Record<string, string> = {
  Animator: 'The native objects behind this component are {Animator} and the {AnimationPlayer} it creates.',
}

/** The exported name of a reference, which differs from its declared name for a renamed re-export. */
function referenceName(type: TypeNode): string {
  return (typeof type.target === 'number' ? publicNameById.get(type.target) : undefined) ?? type.name!
}

/** Nitro's `Sync<T>` is `T & { __syncTag?: never }`, which TypeDoc emits as an intersection with an empty object; it is printed as `Sync<T>`. */
function isEmptyObject(type: TypeNode): boolean {
  const declaration = type.type === 'reflection' ? type.declaration : undefined
  return declaration != null && !declaration.children?.length && !declaration.signatures?.length && !declaration.indexSignatures?.length
}

function escapeMdx(text: string): string {
  return text.replace(/[{}<>]/g, (character) => ({ '{': '\\{', '}': '\\}', '<': '&lt;', '>': '&gt;' })[character]!)
}

function linkFor(target: number | object | undefined, name: string): string | undefined {
  if (typeof target === 'number') {
    const url = urlById.get(target)
    if (url != null) return url
    const reflection = byId.get(target)
    if (reflection != null && hybridByName.has(reflection.name)) return urlById.get(hybridByName.get(reflection.name)!.reflection.id)
  }
  const hybrid = hybridByName.get(name)
  return hybrid == null ? undefined : urlById.get(hybrid.reflection.id)
}

function partsToMd(parts: CommentPart[] | undefined): string {
  return (parts ?? [])
    .map((part) => {
      if (part.kind === 'code') return part.text
      if (part.kind === 'inline-tag') {
        const label = part.text.replace(/^.*\|/, '').trim()
        const url = linkFor(part.target, label)
        return url == null ? `\`${label}\`` : `[\`${label}\`](${url})`
      }
      return escapeMdx(part.text)
    })
    .join('')
}

function partsToPlain(parts: CommentPart[] | undefined): string {
  return (parts ?? []).map((part) => part.text.replace(/`/g, '')).join('')
}

function blockTag(comment: Comment | undefined, tag: string): CommentPart[] | undefined {
  return comment?.blockTags?.find((block) => block.tag === tag)?.content
}

function firstSentence(comment: Comment | undefined): string {
  const text = partsToPlain(comment?.summary).replace(/\s+/g, ' ').trim()
  const match = /^(.+?[.!?])(\s|$)/.exec(text)
  return (match?.[1] ?? text).slice(0, 220)
}

function typeText(type: TypeNode | undefined, nested = false): string {
  if (type == null) return 'void'
  switch (type.type) {
    case 'intrinsic':
      return type.name!
    case 'literal':
      return typeof type.value === 'string' ? `'${type.value}'` : String(type.value)
    case 'reference': {
      if (type.name === 'Element' && type.typeArguments == null) return 'JSX.Element'
      const target = typeof type.target === 'number' ? byId.get(type.target) : undefined
      if (target != null && target.kind === KIND.typeAlias && !publicIds.has(target.id) && !publicNameById.has(target.id) && !urlById.has(target.id)) return typeText(target.type, nested)
      const args = type.typeArguments?.length ? `<${type.typeArguments.map((arg) => typeText(arg)).join(', ')}>` : ''
      return `${referenceName(type)}${args}`
    }
    case 'union': {
      const text = type.types!.map((member) => typeText(member, true)).join(' | ')
      return nested ? `(${text})` : text
    }
    case 'intersection': {
      const members = type.types!.filter((member) => !isEmptyObject(member))
      if (members.length === 1 && type.types!.length === 2) return `Sync<${typeText(members[0])}>`
      return (members.length > 0 ? members : type.types!).map((member) => typeText(member, true)).join(' & ')
    }
    case 'array':
      return `${typeText(type.elementType, true)}[]`
    case 'tuple':
      return `[${(type.elements ?? []).map((element) => typeText(element)).join(', ')}]`
    case 'namedTupleMember':
      return `${type.name}${type.isOptional ? '?' : ''}: ${typeText(type.element)}`
    case 'optional':
      return `${typeText(type.elementType)}?`
    case 'rest':
      return `...${typeText(type.elementType)}`
    case 'query':
      return `typeof ${typeText(type.queryType)}`
    case 'typeOperator':
      return `${type.operator} ${typeText(type.target as TypeNode, true)}`
    case 'indexedAccess':
      return `${typeText(type.objectType, true)}[${typeText(type.indexType)}]`
    case 'templateLiteral':
      return `\`${type.head}${(type.tail ?? []).map(([part, text]) => `\${${typeText(part)}}${text}`).join('')}\``
    case 'conditional':
      return `${typeText(type.checkType)} extends ${typeText(type.extendsType)} ? ${typeText(type.trueType)} : ${typeText(type.falseType)}`
    case 'predicate':
      return `${type.asserts ? 'asserts ' : ''}${type.name} is ${typeText(type.targetType)}`
    case 'reflection': {
      const declaration = type.declaration!
      if (declaration.signatures?.length) {
        const text = declaration.signatures.map((signature) => `(${paramsText(signature)}) => ${typeText(signature.type)}`).join(' | ')
        return nested ? `(${text})` : text
      }
      const members = (declaration.children ?? []).flatMap((child) => {
        const name = `${child.flags.isReadonly ? 'readonly ' : ''}${child.name}${child.flags.isOptional ? '?' : ''}`
        if (child.type == null && child.signatures?.length) return child.signatures.map((signature) => `${name}(${paramsText(signature)}): ${typeText(signature.type)}`)
        return [`${name}: ${typeText(child.type)}`]
      })
      return members.length === 0 ? '{}' : `{ ${members.join('; ')} }`
    }
    default:
      return type.name ?? 'unknown'
  }
}

function parameterName(parameter: Reflection, destructured: string): string {
  return parameter.name === '__namedParameters' ? destructured : parameter.name
}

function parameterText(parameter: Reflection, destructured = 'props'): string {
  const optional = parameter.flags.isOptional || parameter.defaultValue != null
  return `${parameter.flags.isRest ? '...' : ''}${parameterName(parameter, destructured)}${optional ? '?' : ''}: ${typeText(parameter.type)}`
}

function paramsText(signature: Reflection, destructured = 'props'): string {
  return (signature.parameters ?? []).map((parameter) => parameterText(parameter, destructured)).join(', ')
}

function linkedTypes(type: TypeNode | undefined, found = new Map<string, string>()): Map<string, string> {
  if (type == null) return found
  if (type.type === 'reference') {
    const name = referenceName(type)
    const url = linkFor(type.target, name)
    if (url != null) found.set(name, url)
  }
  for (const child of [...(type.types ?? []), ...(type.typeArguments ?? []), ...(type.elements ?? [])]) linkedTypes(child, found)
  for (const child of [type.elementType, type.element, type.objectType, type.indexType, type.queryType]) linkedTypes(child, found)
  type.declaration?.signatures?.forEach((signature) => {
    signature.parameters?.forEach((parameter) => linkedTypes(parameter.type, found))
    linkedTypes(signature.type, found)
  })
  type.declaration?.children?.forEach((child) => linkedTypes(child.type, found))
  return found
}

function seeAlso(types: (TypeNode | undefined)[], self: string): string {
  const found = new Map<string, string>()
  types.forEach((type) => linkedTypes(type, found))
  found.delete(self)
  if (found.size === 0) return ''
  return `Types: ${[...found].map(([name, url]) => `[\`${name}\`](${url})`).join(', ')}\n\n`
}

function defaultMd(parts: CommentPart[]): string {
  const text = parts
    .map((part) => part.text)
    .join('')
    .replace(/^```\w*\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
  return /^[\w.'"[\]{}(), -]+$/.test(text) && !/\s\w+\s\w+/.test(text) ? `\`${text}\`` : escapeMdx(text)
}

function tagsMd(comment: Comment | undefined): string {
  const lines: string[] = []
  const thread = blockTag(comment, '@thread')
  if (thread != null) lines.push(`**Thread:** ${partsToPlain(thread).trim()}`)
  const fallback = blockTag(comment, '@default') ?? blockTag(comment, '@defaultValue')
  if (fallback != null) lines.push(`**Default:** ${defaultMd(fallback)}`)
  const platform = blockTag(comment, '@platform')
  if (platform != null) lines.push(`**Platform:** ${partsToPlain(platform).trim()}`)
  const deprecated = blockTag(comment, '@deprecated')
  if (deprecated != null) lines.push(`**Deprecated:** ${partsToMd(deprecated).trim()}`)
  const returns = blockTag(comment, '@returns')
  if (returns != null) lines.push(`**Returns:** ${partsToMd(returns).trim()}`)
  const remarks = blockTag(comment, '@remarks') ?? blockTag(comment, '@note')
  if (remarks != null) lines.push(partsToMd(remarks).trim())
  const examples = comment?.blockTags?.filter((block) => block.tag === '@example') ?? []
  const exampleText = examples.map((block) => partsToMd(block.content).trim()).join('\n\n')
  return [...lines.map((line) => `${line}\n`), exampleText].filter(Boolean).join('\n')
}

function memberSection(members: Reflection[], self: string): string {
  const properties = members.filter((member) => member.kind === KIND.property || member.kind === KIND.accessor)
  const methods = members.filter((member) => member.kind === KIND.method)
  let out = ''
  if (properties.length > 0) {
    out += `## Properties\n\n`
    for (const property of properties) {
      const type = property.type ?? property.getSignature?.type
      const comment = property.comment ?? property.getSignature?.comment
      const only = onlyIn.get(property)
      out += `### ${property.name}\n\n\`\`\`ts\n${property.flags.isReadonly ? 'readonly ' : ''}${property.name}${property.flags.isOptional ? '?' : ''}: ${typeText(type)}\n\`\`\`\n\n`
      out += `${partsToMd(comment?.summary).trim()}\n\n${tagsMd(comment)}\n\n${only == null ? '' : `${only}\n\n`}${seeAlso([type], self)}${inheritedMd(property)}`
    }
  }
  if (methods.length > 0) {
    out += `## Methods\n\n`
    for (const method of methods) {
      const signatures = method.signatures ?? []
      out += `### ${method.name}()\n\n\`\`\`ts\n${signatures.map((signature) => `${method.name}${typeParamsText(signature)}(${paramsText(signature)}): ${typeText(signature.type)}`).join('\n')}\n\`\`\`\n\n`
      for (const signature of signatures) {
        out += `${partsToMd(signature.comment?.summary).trim()}\n\n${tagsMd(signature.comment)}\n\n`
        const documented = (signature.parameters ?? []).filter((parameter) => parameter.comment != null)
        if (documented.length > 0) out += `${documented.map((parameter) => `- \`${parameter.name}\`: ${partsToMd(parameter.comment?.summary).trim()}`).join('\n')}\n\n`
      }
      out += seeAlso(signatures.flatMap((signature) => [signature.type, ...(signature.parameters ?? []).map((parameter) => parameter.type)]), self)
    }
  }
  return out
}

/** Where a member is inherited from, linked; nothing when that type has no page. */
function inheritedMd(member: Reflection): string {
  const from = member.inheritedFrom
  const owner = typeof from?.target === 'number' ? parentById.get(from.target) : undefined
  const url = owner == null ? undefined : urlById.get(owner.id)
  return owner == null || url == null ? '' : `Inherited from [\`${publicNameById.get(owner.id) ?? owner.name}\`](${url}).\n\n`
}

function membersOf(type: TypeNode | undefined): Reflection[] {
  if (type == null) return []
  if (type.type === 'reference' && typeof type.target === 'number') {
    const target = byId.get(type.target)
    if (target == null) return []
    if (target.kind === KIND.interface) return target.children ?? []
    if (target.kind === KIND.typeAlias) return membersOf(target.type)
  }
  if (type.type === 'intersection') return type.types!.flatMap(membersOf)
  if (type.type === 'union') {
    const variants = type.types!.filter((member) => !(member.type === 'intrinsic' && (member.name === 'undefined' || member.name === 'null')))
    const groups = variants.map((variant) => ({ members: membersOf(variant), label: variantLabel(variant) }))
    if (groups.length === 0 || groups.some((group) => group.members.length === 0)) return []
    if (groups.every((group) => group.label != null)) return mergeVariants(groups, (labels) => `Only in ${listMd(labels, 'and')}.`)
    const key = discriminant(groups.map((group) => group.members))
    if (key == null) {
      // Variants such as `{ byName: string } | { byIndex: number }`: each requires a member the others lack.
      const names = (members: Reflection[]) => members.filter((member) => !member.flags.isOptional && groups.every((group) => group.members === members || !group.members.some((other) => other.name === member.name)))
      const exclusive = groups.map(({ members }) => names(members))
      const pass = exclusive.every((list) => list.length === 1) ? `Pass one of ${listMd(exclusive.map((list) => `\`${list[0]!.name}\``), 'or')}.` : undefined
      return mergeVariants(groups.map(({ members }) => ({ members, label: pass })), () => pass ?? '')
    }
    const values = (members: Reflection[]) => literalsOf(members.find((member) => member.name === key)!.type).map((value) => `\`${typeText(value)}\``)
    return mergeVariants(
      groups.map(({ members }) => ({ members, label: listMd(values(members), 'or') })),
      (labels) => `Only when \`${key}\` is ${listMd(labels, 'or')}.`
    )
  }
  if (type.type === 'reflection') return type.declaration?.children ?? []
  return []
}

/** Members of a union that only some of its variants have, mapped to a note naming those variants. */
const onlyIn = new Map<Reflection, string>()

function listMd(items: string[], conjunction: 'and' | 'or'): string {
  return items.length === 1 ? items[0]! : `${items.slice(0, -1).join(', ')} ${conjunction} ${items.at(-1)}`
}

/** The literal types a type allows, or none when it allows anything else. */
function literalsOf(type: TypeNode | undefined): TypeNode[] {
  if (type?.type === 'literal') return [type]
  if (type?.type !== 'union') return []
  const literals = type.types!.flatMap(literalsOf)
  return literals.length === type.types!.length ? literals : []
}

/** The member that tells the variants of a union apart: one every variant has, typed as literals. */
function discriminant(groups: Reflection[][]): string | undefined {
  return groups[0]!.find((member) => groups.every((group) => literalsOf(group.find((other) => other.name === member.name)?.type).length > 0))?.name
}

/** A union variant's name as Markdown, linked when it has a page; undefined for an inline object. */
function variantLabel(variant: TypeNode): string | undefined {
  if (variant.type !== 'reference') return undefined
  const name = referenceName(variant)
  const url = linkFor(variant.target, name)
  return url == null ? `\`${name}\`` : `[\`${name}\`](${url})`
}

const isUndefined = (type: TypeNode | undefined) => type?.type === 'intrinsic' && type.name === 'undefined'

/**
 * Merges the members of union variants by name. A member is optional unless every variant requires it,
 * and its type is the union of its variants' types. Its description is the one of a variant that takes
 * a value, followed by the one of a variant that only allows `undefined` (such as "leave unset to ...").
 */
function mergeVariants(groups: { members: Reflection[]; label?: string }[], note: (labels: string[]) => string): Reflection[] {
  if (groups.length === 1) return groups[0]!.members
  const byName = new Map<string, { member: Reflection; label?: string }[]>()
  for (const { members, label } of groups) for (const member of members) byName.set(member.name, [...(byName.get(member.name) ?? []), { member, label }])
  return [...byName.values()].map((entries) => {
    const variants = entries.map((entry) => entry.member)
    const optional = variants.length < groups.length || variants.some((variant) => variant.flags.isOptional)
    const types = new Map<string, TypeNode>()
    for (const variant of variants) {
      const type = variant.type ?? variant.getSignature?.type
      for (const member of type?.type === 'union' ? type.types! : type == null ? [] : [type]) {
        if (!(optional && isUndefined(member))) types.set(typeText(member, true), member)
      }
    }
    const documented = variants.filter((variant) => variant.comment != null)
    const valued = documented.find((variant) => !isUndefined(variant.type))
    const unset = documented.find((variant) => isUndefined(variant.type))
    const base = valued ?? unset ?? variants[0]!
    const merged: Reflection = { ...base, flags: { ...base.flags, isOptional: optional } }
    if (valued != null && unset != null) merged.comment = { ...valued.comment!, summary: [...valued.comment!.summary, { kind: 'text', text: ' ' }, ...unset.comment!.summary] }
    if (types.size > 0) merged.type = types.size === 1 ? [...types.values()][0] : { type: 'union', types: [...types.values()] }
    const origin = (variant: Reflection) => variant.inheritedFrom?.qualifiedName ?? variant.inheritedFrom?.name
    if (!variants.every((variant) => origin(variant) === origin(variants[0]!))) delete merged.inheritedFrom
    const labels = entries.map((entry) => entry.label)
    if (variants.length < groups.length && labels.every((label) => label != null)) onlyIn.set(merged, note(labels as string[]))
    return merged
  })
}

function usageMd(page: Page, examples: Record<string, ApiExample>): string {
  const example = examples[`${page.category}/${page.reflection.name}`]
  if (example == null) return ''
  const fence = (code: string) => `\`\`\`tsx\n${code.trim()}\n\`\`\``
  return `## Usage\n\n<ApiTabs>\n<Declarative>\n\n${fence(example.declarative)}\n\n</Declarative>\n<Imperative>\n\n${fence(example.imperative)}\n\n</Imperative>\n</ApiTabs>\n\n`
}

function typeParamsText(signature: Reflection): string {
  const params = signature.typeParameters ?? []
  if (params.length === 0) return ''
  const text = params.map((param) => `${param.name}${param.type ? ` extends ${typeText(param.type)}` : ''}${param.default ? ` = ${typeText(param.default)}` : ''}`)
  return `<${text.join(', ')}>`
}

function signatureMd(reflection: Reflection, destructured: string): string {
  if (reflection.kind === KIND.function) {
    const lines = (reflection.signatures ?? []).map((signature) => `function ${reflection.name}${typeParamsText(signature)}(${paramsText(signature, destructured)}): ${typeText(signature.type)}`)
    return `\`\`\`ts\n${lines.join('\n')}\n\`\`\`\n\n`
  }
  if (reflection.kind === KIND.variable) return `\`\`\`ts\nconst ${reflection.name}: ${typeText(reflection.type)}\n\`\`\`\n\n`
  if (reflection.kind === KIND.interface) {
    const extended = reflection.extendedTypes?.length ? ` extends ${reflection.extendedTypes.map((type) => (type.name === 'HybridObject' ? type.name : typeText(type))).join(', ')}` : ''
    return `\`\`\`ts\ninterface ${reflection.name}${typeParamsText(reflection)}${extended}\n\`\`\`\n\n`
  }
  return `\`\`\`ts\ntype ${reflection.name} = ${typeText(reflection.type)}\n\`\`\`\n\n`
}

function pageMd(page: Page, examples: Record<string, ApiExample>): string {
  const { reflection } = page
  const signatures = reflection.signatures ?? []
  const comment = reflection.comment ?? signatures[0]?.comment
  const title = page.category === 'components' ? `<${reflection.name} />` : reflection.name
  const frontmatter = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(firstSentence(comment) || `${CATEGORY_TITLES[page.category]} reference.`)}\n---\n\n`
  const destructured = page.category === 'components' ? 'props' : 'options'
  let body = signatureMd(reflection, destructured)
  body += `${partsToMd(comment?.summary).trim()}\n\n${tagsMd(comment)}\n\n`
  body += usageMd(page, examples)

  if (page.category === 'components') {
    const props = membersOf(signatures[0]?.parameters?.[0]?.type)
    if (props.length > 0) body += memberSection(props, reflection.name).replace('## Properties', '## Props')
    body += seeAlso(signatures.length > 0 ? [signatures[0]?.parameters?.[0]?.type] : [reflection.type], reflection.name)
    const native = COMPONENT_NATIVE_OBJECTS[reflection.name] ?? (hybridByName.has(reflection.name) ? `The native object behind this component is {${reflection.name}}.` : undefined)
    if (native != null) {
      body += `${native.replace(/\{(\w+)\}/g, (_, name: string) => {
        const url = linkFor(undefined, name)
        return url == null ? `\`${name}\`` : `[\`${name}\`](${url})`
      })}\n`
    }
  } else if (reflection.kind === KIND.function) {
    const parameters = signatures.flatMap((signature) => signature.parameters ?? [])
    if (parameters.length > 0) {
      body += `## Parameters\n\n`
      for (const parameter of parameters) {
        body += `### ${parameterName(parameter, destructured)}\n\n\`\`\`ts\n${parameterText(parameter, destructured)}\n\`\`\`\n\n${partsToMd(parameter.comment?.summary).trim()}\n\n${seeAlso([parameter.type], reflection.name)}`
      }
    }
    const returnType = signatures[0]?.type
    if (returnType != null && typeText(returnType) !== 'void') {
      body += `## Returns\n\n\`\`\`ts\n${signatures.map((signature) => typeText(signature.type)).join(' | ')}\n\`\`\`\n\n${seeAlso(signatures.map((signature) => signature.type), reflection.name)}`
    }
  } else if (reflection.kind === KIND.interface) {
    body += memberSection(reflection.children ?? [], reflection.name)
  } else {
    body += seeAlso([reflection.type], reflection.name)
    body += memberSection(membersOf(reflection.type), reflection.name)
  }
  return frontmatter + body.replace(/\n{3,}/g, '\n\n')
}

function write(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

const examples = await loadExamples()
rmSync(outDir, { recursive: true, force: true })
const categories = Object.keys(CATEGORY_TITLES) as Category[]
for (const category of categories) {
  const inCategory = pages.filter((page) => page.category === category).sort((a, b) => a.reflection.name.localeCompare(b.reflection.name))
  for (const page of inCategory) write(join(outDir, category, `${page.slug}.mdx`), pageMd(page, examples))
  write(join(outDir, category, 'meta.json'), JSON.stringify({ title: CATEGORY_TITLES[category], pages: inCategory.map((page) => page.slug) }, null, 2))
}
write(join(outDir, 'meta.json'), JSON.stringify({ title: 'API Reference', root: true, pages: ['index', ...categories] }, null, 2))
const overview = categories
  .map((category) => {
    const names = pages.filter((page) => page.category === category).sort((a, b) => a.reflection.name.localeCompare(b.reflection.name))
    return `## ${CATEGORY_TITLES[category]}\n\n${CATEGORY_DESCRIPTIONS[category]}\n\n${names.map((page) => `- [\`${page.category === 'components' ? `<${page.reflection.name} />` : page.reflection.name}\`](/api/${category}/${page.slug})`).join('\n')}`
  })
  .join('\n\n')
write(
  join(outDir, 'index.mdx'),
  `---\ntitle: API Reference\ndescription: Every public export of react-native-filament, with Declarative and Imperative usage for components, hooks, hybrid objects and functions.\n---\n\nEvery component and hook has a native counterpart. Each component, hook, hybrid object and function page shows both: the **Declarative** tab uses React components and hooks, the **Imperative** tab uses the native Nitro objects directly.\n\n\`\`\`npm\nnpm i react-native-filament react-native-nitro-modules react-native-worklets\n\`\`\`\n\n${overview}\n`
)
const missing = pages.filter((page) => page.category !== 'types' && examples[`${page.category}/${page.reflection.name}`] == null).map((page) => `${page.category}/${page.reflection.name}`)
console.log(`Generated ${pages.length} API pages.${missing.length > 0 ? ` Missing usage examples: ${missing.join(', ')}` : ''}`)
