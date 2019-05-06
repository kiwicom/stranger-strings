module.exports = {
  transformIgnorePatterns: [
    "node_modules/(?!(babel-jest|jest-vue-preprocessor)/)",
  ],
  verbose: false,
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/functions/tests/spellcheck", // TODO: solve circleci pipeline failing
    "/functions/tests/utils", // TODO: solve fs directory problem
    "/functions/loaders/Phraseapploader", // TODO
  ],
}
