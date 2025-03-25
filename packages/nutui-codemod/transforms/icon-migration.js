let findComponentImports = require('./utils/find-component-imports')

module.exports = (file, api, options) => {
  let componentRules = {
    Icon: {
      action: 'rename',
      replacer: 'IconFont',
      importSource: options.pkgInfo.icon,
    },
  }
  let components = Object.keys(componentRules)

  let j = api.jscodeshift
  let root = j(file.source)

  // 移除旧版本的引用
  let imports = findComponentImports(j, root, components, options.pkgInfo)
  imports.forEach((path) => {
    let importedComponentName = path.node.imported.name
    let importDeclaration = path.parent.node
    let localComponentName = path.node.local.name
    let rule = componentRules[importedComponentName]
    let [parentComponentName] = rule.replacer.split('.')

    importDeclaration.specifiers = importDeclaration.specifiers.filter(
      (specifier) =>
        !specifier.imported || specifier.imported.name !== importedComponentName
    )

    path.parent.insertBefore(
      j.importDeclaration(
        [
          j.importSpecifier(
            j.identifier(parentComponentName),
            j.identifier(localComponentName)
          ),
        ],
        j.literal(rule.importSource)
      )
    )

    if (importDeclaration.specifiers.length === 0) {
      // 因为删除了组件，所以删除此条 import
      j(path.parent).replaceWith()
    }
  })
  return root.toSource()
}
