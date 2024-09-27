import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'

export default {
  input: 'src/index.js', // 打包入口
  output: [
    {
      file: 'dist/main.umd.js',
      format: 'umd',
      name: 'bundle-name'
    },
    {
      file: 'dist/main.cjs.js',
      format: 'cjs'
    },
    {
      file: 'dist/main.esm.js',
      format: 'es'
    }
  ],
  plugins: [
    // 打包插件
    resolve(), // 查找和打包node_modules中的第三方模块
    commonjs(), // 将 CommonJS 转换成 ES2015 模块供 Rollup 处理
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime'
    }),
    terser()
  ]
}
