import babel from '@babel/core'
import { describe, expect, it } from 'vitest'
import { replaceIcons } from '../src/replace-icons'

let plugin = replaceIcons({
  sourceLibrary: ['@nutui/icons-react', '@nutui/icons-react-taro'],
  targetLibrary: '@test/aa',
})

let babelOptions = {
  presets: ['@babel/preset-react'],
  plugins: [plugin],
}
let caseIns = `
import '@nutui/icons-react/dist/test.css'
import '@nutui/icons-react-taro/dist/test.css'
import '@nutui/taro/dist/test.css'
`
describe('', () => {
  it('replace Loading icons with Star', () => {
    let ast = babel.transformSync(caseIns, babelOptions)
    // @ts-ignore
    expect(ast.code).toMatchSnapshot()
  })
})
