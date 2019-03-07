import fp from "lodash/fp"
import _ from "lodash"
import * as R from "ramda"

const mapWithoutCap = fp.map.convert({
  cap: false,
})

export const descriptions = {
  placeholders: "detects missing placeholders in translations",
  first: "compares types of characters in the beginning of translations",
  last: "compares types of characters in the end of translations",
  tags: "checks for prohibited HTML tags",
  length: "detects suspicious variations in length",
  typos: "performs spellchecking",
  "write-good": "detects stylistic issues in text",
  dynamic: "detects dynamic values e.g. numbers",
  "no english": "looks for missing english translation",
}

export const descriptions = {
  placeholders: "detects missing placeholders in translations",
  first: "compares types of characters in the beginning of translations",
  last: "compares types of characters in the end of translations",
  tags: "checks for prohibited HTML tags",
  length: "detects suspicious variations in length",
  typos: "performs spellchecking",
  "write-good": "detects stylistic issues in text",
  dynamic: "detects dynamic values e.g. numbers",
  "no english": "looks for missing english translation",
}

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
  const _inconsistencies = Object.keys(key).filter(x => /^_inconsistencies_/.test(x)).filter(x => key[x])
  if (!key["en-GB"] && key !== "items") {
    _inconsistencies.push("_inconsistencies_noEnglish")
  }
  return _inconsistencies
}

export function userifyInconsistency(inconsistency) {
  switch (inconsistency) {
  case "_inconsistencies_placeholders":
    return "placeholders"
  case "_inconsistencies_firstCharType":
    return "first"
  case "_inconsistencies_lastCharType":
    return "last"
  case "_inconsistencies_tags":
    return "tags"
  case "_inconsistencies_length":
    return "length"
  case "_inconsistencies_typos":
    return "typos"
  case "_inconsistencies_writeGood":
    return "write-good"
  case "_inconsistencies_dynamic":
    return "dynamic"
  case "_inconsistencies_noEnglish":
    return "no english"
  default:
    return inconsistency
  }
}
