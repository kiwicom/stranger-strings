const superagent = require("superagent")

function getGithubApi(repo, path) { // just a preventions for incorrect repo path
  // TODO: write tests
  return repo
    .replace(/^https:\/\/github\.com\//, "https://api.github.com/repos/")
    .replace(/.git$/, "")
    .replace(/\/$/, "")
    .concat(path || "")
}

function mapFiles(files) {
  return files.map(file => ({
    locale: file.name.replace(".json", ""),
    sha: file.blob.sha,
    data: JSON.parse(new Buffer(file.blob.content, file.blob.encoding).toString("utf8")), // eslint-disable-line no-buffer-constructor
  }))
}

function processTranslations(translations) {
  // take only english translated keys
  const enTranslations = translations.filter(x => x.locale === "en-GB")[0].data // TODO: configurable default locale
  const allTKeys = Object.keys(enTranslations)
  // problem is there can be keys translated only in czech or some other locale and these should also be added
  translations.forEach((trans) => {
    Object.keys(trans.data).forEach((key) => {
      if (allTKeys.indexOf(key) < 0) {
        allTKeys.push(key)
      }
    })
  })

  return allTKeys.reduce((acc, key) => {
    translations.forEach((trans) => {
      if (trans.data[key]) {
        if (!acc[key]) {
          acc[key] = {}
        }
        acc[key][trans.locale] = trans.data[key]
      }
    })
    return acc
  }, {})
}


module.exports = function GithubLoader(repo, user, password) {

  function fetchCommitSha() {
    return new Promise((resolve, reject) => {
      const api = getGithubApi(repo, "/commits")
      superagent
        .get(api)
        .auth(user, password)
        .end((err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res.body[0].sha)
          }
        })
    })
  }

  function fetchCommit(sha) {
    console.log("fetchCommit")
    console.log(sha)

    return new Promise((resolve, reject) => {
      superagent
        .get(getGithubApi(repo, `/git/commits/${sha}`))
        .auth(user, password)
        .end((err, res) => {
          if (err) {
            console.log(err, "error")
            reject(err)
          } else {
            console.log("resolving fetchCommit")
            resolve(res.body.tree.sha)
          }
        })
    })
  }

  function fetchNodes(sha) {
    return new Promise((resolve, reject) => {
      superagent
        .get(getGithubApi(repo, `/git/trees/${sha}`))
        .auth(user, password)
        .end((err, res) => {
          if (err) {
            reject(err)
          } else { // TODO: refactor ignored files
            const nodes = res.body.tree.filter(node => node.type === "blob"
              && node.path.includes(".json")
              && node.path !== "package.json"
              && node.path !== ".releaserc.json")
            resolve(nodes)
          }
        })
    })
  }

  function fetchBlobs(nodes) {
    return Promise.all(nodes.map((node) => { // eslint-disable-line
      return new Promise((resolve, reject) => {
        superagent
          .get(node.url)
          .auth(user, password)
          .end((err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve({ name: node.path, blob: res.body })
            }
          })
      })
    }))
  }


  return {
    version: async () => {
      const githubApi = getGithubApi(repo, "/commits")
      const lastCommitFetch = await fetch(githubApi, {
        headers: {
          Authorization: `Basic ${Buffer.from((`${user}:${password}`)).toString("base64")}`,
        },
      })
      const lastCommitJson = await lastCommitFetch.json()
      // TODO: Return timestamp instead
      const lastCommit = lastCommitJson[0].sha
      return lastCommit
    },

    fetch: async () => {
      const commitSha = await fetchCommitSha()
      const repoTreeSha = await fetchCommit(commitSha)
      const nodes = await fetchNodes(repoTreeSha)
      const blobs = await fetchBlobs(nodes)
      const files = mapFiles(blobs)
      const translations = processTranslations(files)
      return {
        version: commitSha, // TODO: Check if cannot be done differently
        translations,
      }
    },
  }
}
