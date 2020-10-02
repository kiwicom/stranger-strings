/* eslint-disable no-param-reassign */
// LOCAL DEBUGGING SETTINGS //
const LOCALEXEC = /dbUpdates\.js$/g.test(__filename)

if (LOCALEXEC) {
  require("dotenv").config({ path: "./../.env" }) // eslint-disable-line global-require
}
// //////////////////////// //

const alex = require("alex")
const _ = require("lodash")
const moment = require("moment")
const sanitizeHtml = require("sanitize-html")

const dbMutex = require("./dbMutex")
const database = require("./database")
const { DISALLOW_INCONSISTENCY_COMPUTATION_FOR_NON_EN_LOCALES } = require("../common/config")
const { loader, loaderType } = require("./loaderManager")

const {
  getHTMLtags,
  determineCharType,
  grammarNazi,
  detectDynamicValues,
  hasInconsistentLength,
  getLangsWithDiffFirstCharCasing,
  writeGoodCheck,
  updateDictsExpansion,
  hasMissingEntities,
} = require("./utils")

const {
  DEFAULT_SPELLCHECKING_DICT_SUPPORT,
  DEFAULT_WRITE_GOOD_SETTINGS,
  DEFAULT_PLACEHOLDER_REGEX,
  DEFAULT_INSENSITIVENESS_CONFIG,
  DEFAULT_ALLOWED_TAGS,
} = require("../common/config")

function computeTranslationInconsistencies(
  translation,
  locale,
  fbKey,
  writeGoodSettings,
  placeholderRegex,
  insensitivenessConfig,
  allowedTags,
  cache,
) {
  // eslint-disable-next-line no-nested-ternary
  const content = translation ?
    typeof translation !== "string" ?
      String(Object.values(translation)) : translation
    : ""
  const placeholderless = content.replace(RegExp(placeholderRegex, "g"), "XXX")
  const sanitized = sanitizeHtml(placeholderless, { allowedTags: [], allowedAttributes: [] }) || ""
  if (cache && content === cache.content) { // cache contains same content (no new computations needed)
    return {
      content: cache.content,
      _placeholders: cache._placeholders,
      _firstCharType: cache._firstCharType,
      _lastCharType: cache._lastCharType,
      _tags: cache._tags,
      _disallowedTags: cache._disallowedTags,
      _dynamic: cache._dynamic,
      _writeGood: writeGoodCheck(sanitized, locale, writeGoodSettings),
      _insensitiveness: locale.toString().substring(0, 2) === "en" ? cache._insensitiveness : {},
    }
  }

  const tags = getHTMLtags(content)

  return {
    content: translation,
    _placeholders: content.match(RegExp(placeholderRegex, "g")) || [],
    _firstCharType: determineCharType(sanitized[0]),
    _lastCharType: determineCharType(sanitized[sanitized.length - 1]),
    _tags: tags,
    _disallowedTags: tags.filter((tag) => {
      const matches = tag.match(/(?<=<|<\/)\w+/gm)
      return !allowedTags.includes(matches && matches[0])
    }),
    _dynamic: detectDynamicValues(sanitized),
    _writeGood: writeGoodCheck(sanitized, locale, writeGoodSettings),
    _insensitiveness: locale.toString().substring(0, 2) === "en" ?
      alex.text(sanitizeHtml(content, { allowedTags: [], allowedAttributes: [] }), insensitivenessConfig).messages.map(out => out.message) : {},
  }
}

function computeInconsistenciesOfTranslations(val, fbKey, writeGoodSettings, placeholderRegex, insensitivenessConfig, allowedTags) {
  // THE HIGHEST PERFORMANCE DEMANDING BLOCK
  // needs to be optimized therefore no lodash and uses caching for en languages because they are usually repeated in other locales
  const mappedTranslations = {}
  mappedTranslations[fbKey] = {}
  const mappedEnTranslations = {}
  mappedEnTranslations[fbKey] = {}
  const enLoc = Object.keys(val).find(l => l === "en-GB") || Object.keys(val).find(l => l === "en-US")
  const cache = enLoc
    ? computeTranslationInconsistencies(val[enLoc], enLoc, fbKey, writeGoodSettings, placeholderRegex, insensitivenessConfig, allowedTags, null)
    : null
  if (cache) {
    mappedEnTranslations[fbKey][enLoc] = cache
  }
  Object.keys(val)
    .filter(locale => locale !== enLoc)
    .forEach((_key) => {
      if (!DISALLOW_INCONSISTENCY_COMPUTATION_FOR_NON_EN_LOCALES) {
        mappedEnTranslations[fbKey][_key] = computeTranslationInconsistencies(
          val[_key],
          _key,
          fbKey,
          writeGoodSettings,
          placeholderRegex,
          insensitivenessConfig,
          allowedTags,
          cache,
        )
      } else {
        mappedEnTranslations[fbKey][_key].content = val[_key]
      }
    })
  return { ...mappedTranslations, ...mappedEnTranslations }
}

function computeInconsistenciesOfKey(mappedTranslations, fbKey) {
  const val = {}

  // - thai lang doesn't have sentence ending punctation
  // - japan lang doesn't use question mark
  const lastCharTypeExceptions = mappedTranslations[fbKey]
  && mappedTranslations[fbKey]["en-GB"]
  && mappedTranslations[fbKey]["en-GB"]._lastCharType === "question mark" ? ["th-TH", "ja-JP"] : "th-TH"

  val._inconsistencies_placeholders = hasMissingEntities(mappedTranslations[fbKey], "_placeholders") || null
  val._inconsistencies_firstCharType = (mappedTranslations[fbKey] || null) // eslint-disable-line no-param-reassign
    && _.uniq(_.map(mappedTranslations[fbKey], x => x._firstCharType))
      .filter(x => !["uncategorized", "digit", "bracket"].includes(x)).length > 1
  // uncategorized, digit and bracket excluded due to syntax differences between languages
  val._inconsistencies_lastCharType = (mappedTranslations[fbKey] || null) // eslint-disable-line no-param-reassign
    && _.uniq(_.map(_.omit(mappedTranslations[fbKey], lastCharTypeExceptions), x => x._lastCharType))
      .filter(x => !["uncategorized", "digit", "bracket"].includes(x)).length > 1
  // uncategorized, digit and bracket excluded due to syntax differences between languages
  val._inconsistencies_tags = (mappedTranslations[fbKey] || null)
    && (Object.values(mappedTranslations[fbKey]).some(o => o._disallowedTags.length > 0) || hasMissingEntities(mappedTranslations[fbKey], "_tags"))
  val._inconsistencies_length = (mappedTranslations[fbKey] || null) // eslint-disable-line no-param-reassign
    && hasInconsistentLength(mappedTranslations[fbKey], mappedTranslations[fbKey]["en-GB"] ? mappedTranslations[fbKey]["en-GB"].content.length : 0)
  val._inconsistencies_typos = (mappedTranslations[fbKey] || null) // eslint-disable-line no-param-reassign
    && Object.keys(mappedTranslations[fbKey])
      .filter(lang => Array.isArray(mappedTranslations[fbKey][lang]._typos) && mappedTranslations[fbKey][lang]._typos.length > 0)
  val._inconsistencies_writeGood = (mappedTranslations[fbKey] || null)
    && Object.keys(mappedTranslations[fbKey])
      .filter(lang => Array.isArray(mappedTranslations[fbKey][lang]._writeGood) && mappedTranslations[fbKey][lang]._writeGood.length > 0)
  val._inconsistencies_dynamic = (mappedTranslations[fbKey] || null)
    && Object.values(mappedTranslations[fbKey])
      .some(x => x._dynamic.length > 0)
  val._inconsistencies_insensitiveness = (mappedTranslations[fbKey] || null)
    && Object.keys(mappedTranslations[fbKey])
      .filter(lang => Array.isArray(mappedTranslations[fbKey][lang]._insensitiveness) && mappedTranslations[fbKey][lang]._insensitiveness.length > 0)
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
    } else {
      console.error(`invalid key with unsupported characters (omitting): ${key}`)
    }
    return acc
  }, {})
}

async function uploadDataToFirebase(path, data) { // split to chunks for big data uploads
  const uploads = _.chunk(Object.keys(data), 100).map(chunk =>
    chunk.reduce((acc, key) => {
      acc[key] = data[key]
      return acc
    }, {}))
  // if (path === "/items") {
  //   uploads = uploads.slice(0, 5) // restrict number of keys to 500
  // }

  return Promise.all(uploads.map(upload => database.ref(path).update(upload)))
}

async function originToFirebase() {
  if (!(await dbMutex.tryLock(`New translations detected in ${loaderType}. Updating may take a few minutes.`))) {
    console.log("Update already in progress, stopping!")
    return
  }
  try {
    const { version, translations } = await loader.fetch()

    const items = _.reduce(translations, (acc, val, key) => {
      const _key = key.replace(/[.#$/[\]]/gmi, "-")

      if (!acc[_key]) {
        acc[_key] = {}
      }
      acc[_key].key = key
      acc[_key]["en-GB"] = val["en-GB"] || null
      acc[_key].count = Object.keys(val).length
      acc[_key].translated = Object.keys(val)

      return acc
    }, {})

    let mappedTranslations = {}
    const writeGoodSettings = (await database.ref("/writeGood").once("value")).val()
      || DEFAULT_WRITE_GOOD_SETTINGS
    const placeholderRegex = (await database.ref("/placeholders/regex").once("value")).val()
      || DEFAULT_PLACEHOLDER_REGEX
    const insensitivenessConfig = (await database.ref("/insensitivenessConfig").once("value")).val()
      || DEFAULT_INSENSITIVENESS_CONFIG
    let allowedTags = (await database.ref("/tags").once("value")).val()
    allowedTags = allowedTags ? Object.values(allowedTags) : DEFAULT_ALLOWED_TAGS

    _.forEach(translations, (val, key) => {
      const fbKey = key.replace(/[.#$/[\]]/gmi, "-")

      mappedTranslations = {
        ...mappedTranslations,
        ...computeInconsistenciesOfTranslations(val, fbKey, writeGoodSettings, placeholderRegex, insensitivenessConfig, allowedTags),
      }
    })

    const dictsExpansion = updateDictsExpansion(
      (await database.ref("/dictsExpansion").once("value")).val(),
      DEFAULT_SPELLCHECKING_DICT_SUPPORT,
    )
    await database.ref("/dictsExpansion").set(dictsExpansion)
    mappedTranslations = grammarNazi(mappedTranslations, dictsExpansion, DEFAULT_SPELLCHECKING_DICT_SUPPORT, placeholderRegex)

    _.forEach(items, (val, key) => {
      const fbKey = key.replace(/[.#$/[\]]/gmi, "-")

      items[key] = { ...val, ...computeInconsistenciesOfKey(mappedTranslations, fbKey) }
    })

    let collections = (await database.ref("/collections").once("value")).val()
    collections = assignCollectionKeys(collections, Object.keys(mappedTranslations))
    collections = computeInconsistenciesOfCollection(collections, mappedTranslations)

    const finalItems = prepareItemsForExport(items)
    const finalTranslations = prepareTranslationsForExport(mappedTranslations)


    console.log("removing old data")
    await database.ref("/lastUpdate").remove()
    await database.ref("/items").remove()
    await database.ref("/translations").remove()
    await database.ref("/collections").remove()
    await database.ref("/locales").remove()
    console.log("uploading new keys")
    await uploadDataToFirebase("/items", finalItems)
    await uploadDataToFirebase("/translations", finalTranslations)
    await uploadDataToFirebase("/collections", collections)

    await database.ref("/locales").set({
      list: [...new Set(_.reduce(translations, (acc, translation) => acc.concat(Object.keys(translation)), []))],
    })

    await database.ref("/lastUpdate").set({
      updated: moment().format("DD-MM-YYYY HH:mm:ss"),
      version,
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
    let items = (await database.ref("/items").once("value")).val()
    let translations = (await database.ref("/translations").once("value")).val()
    const writeGoodSettings = (await database.ref("/writeGood").once("value")).val()
      || DEFAULT_WRITE_GOOD_SETTINGS
    const placeholderRegex = (await database.ref("/placeholders/regex").once("value")).val()
      || DEFAULT_PLACEHOLDER_REGEX
    const insensitivenessConfig = (await database.ref("/insensitivenessConfig").once("value")).val()
      || DEFAULT_INSENSITIVENESS_CONFIG
    let allowedTags = (await database.ref("/tags").once("value")).val()
    allowedTags = allowedTags ? Object.values(allowedTags) : DEFAULT_ALLOWED_TAGS

    _.forEach(translations, (val, key) => {
      _.forEach(val, (x, locKey) => { val[locKey] = x.content }) // strip locale of everything except translation content
      translations = {
        ...translations,
        ...computeInconsistenciesOfTranslations(val, key, writeGoodSettings, placeholderRegex, insensitivenessConfig, allowedTags),
      }
    })

    const dictsExpansion = updateDictsExpansion(
      (await database.ref("/dictsExpansion").once("value")).val(),
      DEFAULT_SPELLCHECKING_DICT_SUPPORT,
    )
    await database.ref("/dictsExpansion").set(dictsExpansion)
    translations = grammarNazi(translations, dictsExpansion, DEFAULT_SPELLCHECKING_DICT_SUPPORT, placeholderRegex)

    _.forEach(items, (val, key) => {
      items[key] = { ...val, ...computeInconsistenciesOfKey(translations, key) }
    })

    items = prepareItemsForExport(items)
    translations = prepareTranslationsForExport(translations)

    console.log("removing old data")
    await database.ref("/items").remove()
    await database.ref("/translations").remove()
    console.log("uploading new keys")
    await uploadDataToFirebase("/items", items)
    await uploadDataToFirebase("/translations", translations)

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
    const translations = (await database.ref("/translations").once("value")).val()
    let collections = (await database.ref("/collections").once("value")).val()

    collections = assignCollectionKeys(collections, Object.keys(translations))
    collections = computeInconsistenciesOfCollection(collections, translations)

    console.log("removing old data")
    await database.ref("/collections").remove()
    console.log("uploading new collections")
    await uploadDataToFirebase("/collections", collections)

    console.log("SUCCESS: updated all collections")
    // eslint-disable-next-line consistent-return
    return "SUCCESS: updated all collections"
  } finally {
    await dbMutex.unlock()
  }
}

module.exports = {
  originToFirebase,
  updateInconsistencies,
  updateCollections,
}

// LOCAL DEBUGGING SETTINGS //
if (LOCALEXEC) originToFirebase()
// //////////////////////// //
