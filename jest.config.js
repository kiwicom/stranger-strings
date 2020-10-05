module.exports = {
  transformIgnorePatterns: [
    "node_modules/(?!(babel-jest|jest-vue-preprocessor)/)",
  ],
  moduleFileExtensions: [
    "js",
    "vue",
  ],
  transform: {
    "^.+\\.js$": "babel-jest",
    ".*\\.(vue)$": "vue-jest",
  },
  verbose: true,
  testURL: "http://localhost/",
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/functions/tests/spellcheck", // TODO: solve circleci pipeline failing
    "/functions/tests/utils", // TODO: solve fs directory problem
    "/functions/loaders/PhraseappLoader", // TODO
    "/src/tests/highlighting",
  ],
}

process.env = Object.assign(process.env, { VUE_APP_FIREBASE_DATABASE_URL: "https://stranger-strings-showcase.firebaseio.com" })
