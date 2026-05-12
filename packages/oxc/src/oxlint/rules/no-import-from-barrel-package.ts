import * as fs from "node:fs"
import * as path from "node:path"
import type { CreateRule, ESTree, Visitor } from "oxlint"

interface RuleOptions {
  packageNames?: Array<string>
  checkPatterns?: Array<string>
  checkRelativeIndexImports?: boolean
}

const extensions = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]

function getModuleName(specifier: ESTree.ImportSpecifier): string {
  return specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : specifier.imported.value
}

function isRelativeImport(source: string): boolean {
  return source.startsWith("./") || source.startsWith("../")
}

function hasIndexFile(dirPath: string): boolean {
  for (const ext of extensions) {
    if (fs.existsSync(path.join(dirPath, `index${ext}`))) {
      return true
    }
  }
  return false
}

function isIndexImport(importPath: string): boolean {
  const basename = path.basename(importPath)
  return basename === "index" || /^index\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/.test(basename)
}

function resolvesToBarrel(importSource: string, currentFile: string): boolean {
  const dir = path.dirname(currentFile)
  const resolved = path.resolve(dir, importSource)

  if (isIndexImport(importSource)) return true
  if (hasIndexFile(resolved)) return true
  return false
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function createBarrelMatcher(options: RuleOptions): (source: string, currentFile: string) => boolean {
  const patterns = [
    ...(options.packageNames ?? []).map((name) => new RegExp(`^${escapeRegex(name)}$`)),
    ...(options.checkPatterns ?? []).map((p) => new RegExp(p))
  ]
  const checkRelative = options.checkRelativeIndexImports === true

  return (source: string, currentFile: string): boolean => {
    if (isRelativeImport(source)) {
      return checkRelative && resolvesToBarrel(source, currentFile)
    }

    for (const pattern of patterns) {
      if (pattern.test(source)) return true
    }
    return false
  }
}

const rule: CreateRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow importing from barrel packages; import from specific submodules instead"
    },
    schema: [
      {
        type: "object",
        properties: {
          packageNames: {
            type: "array",
            items: { type: "string" },
            description: "Exact package names whose barrel entry is disallowed"
          },
          checkPatterns: {
            type: "array",
            items: { type: "string" },
            description: "Regex patterns matching barrel import sources"
          },
          checkRelativeIndexImports: {
            type: "boolean",
            description: "Whether to check relative imports that resolve to index files"
          }
        },
        additionalProperties: false
      }
    ]
  },
  create(context) {
    const currentFile = context.filename
    const options: RuleOptions = (context.options[0] as RuleOptions) ?? {}
    const isBarrelImport = createBarrelMatcher(options)

    return {
      ImportDeclaration(node: ESTree.ImportDeclaration) {
        if (node.importKind === "type") return

        const importSource = node.source.value
        if (!isBarrelImport(importSource, currentFile)) return

        const namespaceSpecifiers: Array<ESTree.ImportNamespaceSpecifier> = []
        const namedValueSpecifiers: Array<ESTree.ImportSpecifier> = []

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier") {
            namespaceSpecifiers.push(specifier)
          } else if (specifier.type === "ImportSpecifier") {
            if (specifier.importKind !== "type") {
              namedValueSpecifiers.push(specifier)
            }
          }
        }

        for (const specifier of namespaceSpecifiers) {
          context.report({
            node: specifier,
            message:
              `Do not use namespace import from barrel package "${importSource}"; import from a specific submodule instead`
          })
        }

        for (const specifier of namedValueSpecifiers) {
          const moduleName = getModuleName(specifier)
          const localName = specifier.local.name
          const message = isRelativeImport(importSource)
            ? `Do not import "${moduleName}" from barrel file "${importSource}"; import from specific module instead`
            : `Use import * as ${localName} from "${importSource}/${moduleName}" instead`
          context.report({
            node: specifier,
            message
          })
        }
      }
    } as Visitor
  }
}

export default rule
