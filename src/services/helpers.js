/* eslint-disable global-require */
import fp from "lodash/fp"
import _ from "lodash"
import * as R from "ramda"

const mapWithoutCap = fp.map.convert({
  cap: false,
})

// exact match for en translations
export function strictSearch(items, query) {
  const regex = new RegExp(`.*${_.escapeRegExp(query)}.*`, "i")
  const matchContent = _.reduce(items, (acc, val, key) => {
    if (val["en-GB"] && typeof val["en-GB"] === "string" && val["en-GB"].match(regex)) { // type string because of plurals object
      acc[key] = val
    }
    return acc
  }, {})
  return _.reduce(items, (acc, val, key) => {
    if (val.key && typeof val.key === "string" && val.key.match(regex)) {
      acc[key] = val
    }
    return acc
  }, matchContent)
}

// get all tags used across translations
export function getAvailableTags(translations) {
  return R.reduce((acc, key) => {
    if (!translations[key].tags) {
      return acc
    }
    translations[key].tags.forEach((tag) => {
      if (!acc.includes(tag)) {
        acc.push(tag)
      }
    })
    return acc
  }, [], R.keys(translations)).sort()
}

// sort by property either "asc" or "desc"
export function sortTranslationKeys(translations, sortProperty, ascOrDesc) {
  const preserveOriginalKeyFunc = mapWithoutCap((x, key) => Object.assign({}, x, { _key: key }))
  const orderByFunc = fp.orderBy([sortProperty], [ascOrDesc])
  const addOriginalKeyFunc = fp.reduce((acc, val) => {
    const key = val._key
    acc[key] = fp.omit(["_key"])(val)
    return acc
  }, {})

  const orderObjectFunc = fp.compose(
    addOriginalKeyFunc,
    orderByFunc,
    preserveOriginalKeyFunc,
  )

  return orderObjectFunc(translations)
}

export function getPlaceholders(s) {
  return R.compose(
    R.join(", "),
    R.map(R.compose(
      R.join(""),
      R.without("_"),
    )),
  )(s)
}

export function getItemInconsistencies(key) {
  const _inconsistencies = Object.keys(key).filter(x => x.indexOf("_inconsistencies_") === 0).filter(x => key[x])
  if (!key["en-GB"] && key !== "items") {
    _inconsistencies.push("_inconsistencies_noEnglish")
  }
  return _inconsistencies
}

export const inconsistencies = {
  _inconsistencies_placeholders: {
    title: "Placeholders",
    description: "Detect missing/excess/inconsistent placeholders",
    icon: require("vue-material-design-icons/CodeBraces"),
    level: "high",
    default: true,
  },
  _inconsistencies_firstCharType: {
    title: "First character",
    description: "Detect inconsistencies of first character",
    icon: require("vue-material-design-icons/PageFirst"),
    level: "low",
    default: false,
  },
  _inconsistencies_lastCharType: {
    title: "Last character",
    description: "Detect inconsistencies of last character",
    icon: require("vue-material-design-icons/PageLast"),
    level: "low",
    default: false,
  },
  _inconsistencies_tags: {
    title: "HTML",
    description: "Detect invalid HTML and prohibited HTML tags",
    icon: require("vue-material-design-icons/CodeTags"),
    level: "high",
    default: true,
  },
  _inconsistencies_length: {
    title: "Length",
    description: "Detects suspicious variations in length",
    icon: require("vue-material-design-icons/ArrowExpandHorizontal"),
    level: "high",
    default: true,
  },
  _inconsistencies_typos: {
    title: "Spelling",
    description: "Detect spelling mistakes",
    icon: require("vue-material-design-icons/Spellcheck"),
    level: "high",
    default: true,
  },
  _inconsistencies_writeGood: {
    title: "Style",
    description: "Detect stylistic issues – passive voice, weasel words, overuse of adverbs, cliches and similar",
    icon: require("vue-material-design-icons/FileWordBox"),
    level: "low",
    default: false,
  },
  _inconsistencies_insensitiveness: {
    title: "Insensitiveness",
    description: "Detect gender favouring, polarising, race related, religion inconsiderate, or other unequal phrasing",
    icon: require("vue-material-design-icons/EmoticonCryOutline"),
    level: "low",
    default: false,
  },
  _inconsistencies_dynamic: {
    title: "Values",
    description: "Detects values, that should/could be replaced by placeholders to make text more customizable",
    icon: require("vue-material-design-icons/Resistor"),
    level: "low",
    default: false,
  },
  _inconsistencies_noEnglish: {
    title: "Missing default translation",
    description: "Detect missing translation for default locale",
    icon: require("vue-material-design-icons/EarthOff"),
    level: "high",
    default: true,
  },
}
