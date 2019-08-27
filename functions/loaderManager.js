const GithubLoader = require("./loaders/GithubLoader")
const PhraseappLoader = require("./loaders/PhraseappLoader")

function getLoaderType() {
  if (process.env.VUE_APP_GITHUB_REPO) {
    return "GitHub"
  }
  if (process.env.VUE_APP_PHRASEAPP_PROJECT_ID) {
    return "PhraseApp"
  }
  console.log("cannot detect loader")
  return ""
}

function selectLoader(loaderType) {
  switch (loaderType) {
  case "GitHub":
    return GithubLoader(
      process.env.VUE_APP_GITHUB_REPO,
      process.env.VUE_APP_GITHUB_USER,
      process.env.VUE_APP_GITHUB_PASSWORD,
    )
  case "PhraseApp":
    return PhraseappLoader(
      process.env.VUE_APP_PHRASEAPP_PROJECT_ID,
      process.env.VUE_APP_PHRASEAPP_TOKEN,
    )
  default:
    return null
  }
}

module.exports = {
  loader: selectLoader(getLoaderType()),
  loaderType: getLoaderType(),
}
