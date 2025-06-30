// .babelrc 或 babel.config.js
export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['last 2 versions', 'ie >= 9']
        },
        useBuiltIns: 'entry',
        corejs: 3
      }
    ]
  ],

  plugins: ['@babel/plugin-transform-runtime']
}
