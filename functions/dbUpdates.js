/* eslint-disable no-param-reassign */
// LOCAL DEBUGGING SETTINGS //
const LOCALEXEC = /dbUpdates\.js$/g.test(__filename)

if (LOCALEXEC) {
  require("dotenv").config({ path: "./../.env" }) // eslint-disable-line global-require
}
// //////////////////////// //

const superagent = require("superagent")
const _ = require("lodash")
const moment = require("moment")

const dbMutex = require("./dbMutex")
const {
  validateHtml,
  determineCharType,
  grammarNazi,
  detectDynamicValues,
  hasInconsistentLength,
  getLangsWithDiffFirstCharCasing,
  writeGoodCheck,
  updateDictsExpansion,
} = require("./utils")
const { DEFAULT_SPELLCHECKING_DICT_SUPPORT, DEFAULT_WRITE_GOOD_SETTINGS } = require("../common/config") // TODO: configurable

function getGithubApi(repo, path) { // just a preventions for incorrect repo path
  // TODO: write tests
  return repo
    .replace(/^https:\/\/github\.com\//, "https://api.github.com/repos/")
    .replace(/.git$/, "")
    .replace(/\/$/, "")
    .concat(path || "")
}

function fetchCommitSha() {
  return new Promise((resolve, reject) => {
    superagent
      .get(getGithubApi(process.env.GITHUB_REPO, "/commits"))
      .auth(process.env.GITHUB_USER, process.env.GITHUB_PASSWORD)
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
      .get(getGithubApi(process.env.GITHUB_REPO, `/git/commits/${sha}`))
      .auth(process.env.GITHUB_USER, process.env.GITHUB_PASSWORD)
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
      .get(getGithubApi(process.env.GITHUB_REPO, `/git/trees/${sha}`))
      .auth(process.env.GITHUB_USER, process.env.GITHUB_PASSWORD)
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
        .auth(process.env.GITHUB_USER, process.env.GITHUB_PASSWORD)
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

function computeInconsistenciesOfTranslations(val, fbKey, writeGoodSettings) {
  const mappedTranslations = {}
  _.forEach(val, (_val, _key) => {
    let trimmed

    if (!_val) {
      trimmed = ""
    } else if (typeof _val !== "string") { // pluralized object
      trimmed = String(Object.values(_val))
    } else {
      trimmed = _val.trim()
    }

    const interpolated = trimmed.replace(/(__\w+__)/g, "XXX")
    _.set(mappedTranslations, [fbKey, _key], {
      content: _val,
      _placeholders: trimmed.match(/(__\w+__)/g) || [],
      _firstCharType: determineCharType(interpolated[0]),
      _lastCharType: determineCharType(interpolated[interpolated.length - 1]),
      _tags: validateHtml(_val),
      _dynamic: detectDynamicValues(_val),
      _writeGood: writeGoodCheck(_val, _key, writeGoodSettings),
    })
  })
  return mappedTranslations
}

function computeInconsistenciesOfKey(mappedTranslations, fbKey) {
  const val = {}

  // - thai lang doesn't have sentence ending punctation
  // - japan lang doesn't use question mark
  const lastCharTypeExceptions = mappedTranslations[fbKey]
  && mappedTranslations[fbKey]["en-GB"]
  && mappedTranslations[fbKey]["en-GB"]._lastCharType === "QUESTMARK" ? ["th-TH", "ja-JP"] : "th-TH"

  val._inconsistencies_placeholders = mappedTranslations[fbKey] // eslint-disable-line no-param-reassign
    && _.uniqWith(_.map(mappedTranslations[fbKey], x => x._placeholders.sort()), _.isEqual).length !== 1
  val._inconsistencies_firstCharType = mappedTranslations[fbKey] // eslint-disable-line no-param-reassign
    && _.uniq(_.map(mappedTranslations[fbKey], x => x._firstCharType)).length !== 1
  val._inconsistencies_lastCharType = mappedTranslations[fbKey] // eslint-disable-line no-param-reassign
    && _.uniq(_.map(_.omit(mappedTranslations[fbKey], lastCharTypeExceptions), x => x._lastCharType))
      .filter(x => !["UNCATEGORIZED", "DIGIT"].includes(x)).length > 1
  // UNCATEGORIZED and DIGIGT excluded due to syntax differences between languages
  val._inconsistencies_tags = mappedTranslations[fbKey] // eslint-disable-line no-param-reassign
    && _.includes(_.map(mappedTranslations[fbKey], x => x._tags), "NOT_ALLOWED")
  val._inconsistencies_length = mappedTranslations[fbKey] // eslint-disable-line no-param-reassign
    && hasInconsistentLength(mappedTranslations[fbKey], mappedTranslations[fbKey]["en-GB"] ? mappedTranslations[fbKey]["en-GB"].content.length : 0)
  val._inconsistencies_typos = mappedTranslations[fbKey] // eslint-disable-line no-param-reassign
    && Object.keys(mappedTranslations[fbKey])
      .filter(lang => Array.isArray(mappedTranslations[fbKey][lang]._typos) && mappedTranslations[fbKey][lang]._typos.length > 0)
  val._inconsistencies_writeGood = mappedTranslations[fbKey]
    && Object.keys(mappedTranslations[fbKey])
      .filter(lang => Array.isArray(mappedTranslations[fbKey][lang]._writeGood) && mappedTranslations[fbKey][lang]._writeGood.length > 0)
  val._inconsistencies_dynamic = mappedTranslations[fbKey]
    && Object.values(mappedTranslations[fbKey])
      .some(x => x._dynamic.length > 0)
  return val
}

function computeInconsistenciesOfCollection(collections, translations) {
  _.forEach(collections, (collection) => {
    const translationsOfCollection = _.reduce(collection.keys, (acc, key) => { // get translations from their keys
      acc.push(translations[key])
      return acc
    }, [])
    collection._inconsistencies_firstCharCasing = getLangsWithDiffFirstCharCasing(translationsOfCollection)
  })
  return collections
}

function assignCollectionKeys(collections, keys) {
  _.forEach(collections, (val) => {
    const regex = RegExp(val.regex, val.regexFlags)
    val.keys = keys.filter(x => regex.test(x.replace(/[-]/g, "."))) // keys are in format common-continents-aas instead of common.continents.aas
  })
  return collections || {}
}

function prepareItemsForExport(items) {
  // filter keys exported with linebreaks or other invalid characters
  return _.reduce(items, (acc, val, key) => {
    if (!key.includes("\n")) {
      acc[key] = val
    } else {
      console.error(`invalid key with unsupported characters (omitting): ${key}`)
    }
    return acc
  }, {})
}

function prepareTranslationsForExport(translations) {
  return _.reduce(translations, (acc, val, key) => {
    if (!key.includes("\n")) {
      acc[key] = val
    }
    return acc
  }, {})
}

async function githubToFirebase() {
  if (!(await dbMutex.tryLock("downloading recent translations from GitHub"))) {
    console.log("Update already in progress, stopping!")
    return
  }
  try {
    const commitSha = await fetchCommitSha()
    const repoTreeSha = await fetchCommit(commitSha)
    const nodes = await fetchNodes(repoTreeSha)
    const blobs = await fetchBlobs(nodes)
    const files = mapFiles(blobs)
    const translations = processTranslations(files)

    const items = _.reduce(translations, (acc, val, key) => {
      const _key = key.includes(".") ? key.split(".").join("-") : key

      if (!acc[_key]) {
        acc[_key] = {}
      }
      acc[_key].key = key
      acc[_key]["en-GB"] = val["en-GB"] || null
      acc[_key].count = Object.keys(val).length

      return acc
    }, {})

    let mappedTranslations = {}
    const writeGoodSettings = (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/writeGood.json`)).body
      || DEFAULT_WRITE_GOOD_SETTINGS

    _.forEach(translations, (val, key) => {
      const fbKey = key.includes(".") ? key.split(".").join("-") : key

      mappedTranslations = { ...mappedTranslations, ...computeInconsistenciesOfTranslations(val, fbKey, writeGoodSettings) }
    })

    const dictsExpansion = updateDictsExpansion(
      (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/dictsExpansion.json`)).body,
      DEFAULT_SPELLCHECKING_DICT_SUPPORT,
    )
    await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/dictsExpansion.json`).send(dictsExpansion)
    mappedTranslations = grammarNazi(mappedTranslations, dictsExpansion, DEFAULT_SPELLCHECKING_DICT_SUPPORT)

    _.forEach(items, (val, key) => {
      const fbKey = key.includes(".") ? key.split(".").join("-") : key

      items[key] = { ...val, ...computeInconsistenciesOfKey(mappedTranslations, fbKey) }
    })

    let collections = (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/collections.json`)).body
    collections = assignCollectionKeys(collections, Object.keys(mappedTranslations))
    collections = computeInconsistenciesOfCollection(collections, mappedTranslations)

    const finalItems = prepareItemsForExport(items)
    const finalTranslations = prepareTranslationsForExport(mappedTranslations)

    console.log("removing old data")
    await superagent.delete(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/lastUpdate.json`)
    await superagent.delete(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/items.json`)
    await superagent.delete(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/translations.json`)
    await superagent.delete(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/collections.json`)

    console.log("uploading new keys")
    await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/items.json`).send(finalItems)
    await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/translations.json`).send(finalTranslations)
    await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/collections.json`).send(collections)

    await superagent
      .put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/lastUpdate.json`)
      .send({
        updated: moment().format("DD-MM-YYYY HH:mm:ss"),
        locales: [...new Set(_.reduce(translations, (acc, translation) => acc.concat(Object.keys(translation)), []))],
        commitSha,
      })
    console.log("SUCCESS: updated all translations")
    // eslint-disable-next-line consistent-return
    return "SUCCESS: updated all translations"
  } finally {
    await dbMutex.unlock()
  }
}

async function updateInconsistencies() {
  if (!(await dbMutex.tryLock("updating inconsistencies"))) {
    console.log("Update already in progress, stopping!")
    return
  }
  try {
    let items = (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/items.json`)).body
    let translations = (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/translations.json`)).body
    const writeGoodSettings = (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/writeGood.json`)).body
      || DEFAULT_WRITE_GOOD_SETTINGS

    _.forEach(translations, (val, key) => {
      _.forEach(val, (x, locKey) => { val[locKey] = x.content }) // strip locale of everything except translation content
      translations = { ...translations, ...computeInconsistenciesOfTranslations(val, key, writeGoodSettings) }
    })

    const dictsExpansion = updateDictsExpansion(
      (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/dictsExpansion.json`)).body,
      DEFAULT_SPELLCHECKING_DICT_SUPPORT,
    )
    await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/dictsExpansion.json`).send(dictsExpansion)
    translations = grammarNazi(translations, dictsExpansion, DEFAULT_SPELLCHECKING_DICT_SUPPORT)

    _.forEach(items, (val, key) => {
      items[key] = { ...val, ...computeInconsistenciesOfKey(translations, key) }
    })

    items = prepareItemsForExport(items)
    translations = prepareTranslationsForExport(translations)

    console.log("removing old data")
    await superagent.delete(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/items.json`)
    await superagent.delete(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/translations.json`)

    console.log("uploading new keys")
    await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/items.json`).send(items)
    await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/translations.json`).send(translations)

    console.log("SUCCESS: updated all inconsistencies")
    // eslint-disable-next-line consistent-return
    return "SUCCESS: updated all inconsistencies"
  } finally {
    await dbMutex.unlock()
  }
}

async function updateCollections() {
  if (!(await dbMutex.tryLock("updating collections"))) {
    console.log("Update already in progress, stopping!")
    return
  }
  try {
    const translations = (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/translations.json`)).body
    let collections = (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/collections.json`)).body

    collections = assignCollectionKeys(collections, Object.keys(translations))
    collections = computeInconsistenciesOfCollection(collections, translations)

    console.log("removing old data")
    await superagent.delete(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/collections.json`)

    console.log("uploading new collections")
    await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/collections.json`).send(collections)

    console.log("SUCCESS: updated all collections")
    // eslint-disable-next-line consistent-return
    return "SUCCESS: updated all collections"
  } finally {
    await dbMutex.unlock()
  }
}

module.exports = {
  getGithubApi,
  githubToFirebase,
  updateInconsistencies,
  updateCollections,
}

// LOCAL DEBUGGING SETTINGS //
if (LOCALEXEC) githubToFirebase()
// //////////////////////// //
