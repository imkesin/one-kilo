import noImportFromBarrelPackage from "./rules/no-import-from-barrel-package.ts"

export default {
  meta: {
    name: "one-kilo"
  },
  rules: {
    "no-import-from-barrel-package": noImportFromBarrelPackage
  }
}
