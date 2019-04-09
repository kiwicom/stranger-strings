const GithubLoader = require("./loaders/GithubLoader")
const PhraseappLoader = require("./loaders/PhraseappLoader")

module.exports = {
  // loader: new GithubLoader(
  //   process.env.GITHUB_REPO,
  //   process.env.GITHUB_USER,
  //   process.env.GITHUB_PASSWORD,
  // ),
  loader: new PhraseappLoader(
    process.env.PHRASEAPP_PROJECT_ID,
    process.env.PHRASEAPP_TOKEN,
  ),
}
