const GithubLoader = require("./loaders/GithubLoader")
const PhraseappLoader = require("./loaders/PhraseappLoader")

function getLoaderType() {
  if (process.env.GITHUB_REPO) {
    return "GitHub"
  }
  if (process.env.PHRASEAPP_PROJECT_ID) {
    return "PhraseApp"
  }
  console.log("cannot detect loader")
  return ""
}

function selectLoader(loaderType) {
  switch (loaderType) {
  case "GitHub":
    return GithubLoader(
      process.env.GITHUB_REPO,
      process.env.GITHUB_USER,
      process.env.GITHUB_PASSWORD,
    )
  case "PhraseApp":
    return PhraseappLoader(
      process.env.PHRASEAPP_PROJECT_ID,
      process.env.PHRASEAPP_TOKEN,
    )
  default:
    return null
  }
}

module.exports = {
  loader: selectLoader(getLoaderType()),
  loaderType: getLoaderType(),
}
