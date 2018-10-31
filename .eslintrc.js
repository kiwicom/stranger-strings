module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    "jest/globals": true,
  },
  extends: [
    "plugin:vue/essential",
    "@vue/airbnb",
  ],
  rules: {
    quotes: ["error", "double"],
    indent: ["error", 2],
    "max-len": ["warn", 150],
    semi: ["warn", "never"],
    "no-underscore-dangle": ["off"],
    "no-console": ["off"],
    "no-unused-vars": ["warn"],
    "no-redeclare": ["warn"],
    "no-param-reassign": ["warn"],
    "no-var": ["warn"],
    "comma-dangle": ["warn"],
    "import/extensions": ["error", "always", {
      js: "never",
      vue: "never",
    }],
  },
  parserOptions: {
    parser: "babel-eslint",
  },
  plugins: [
    "vue",
    "jest",
    "import",
  ],
}
