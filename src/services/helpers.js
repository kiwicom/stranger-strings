/* eslint-disable global-require */
import _ from "lodash"
import * as R from "ramda"

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

// sort by property either "asc" or "desc"
export function sortTranslationKeys(translations, sortProperty, ascOrDesc) {
  return _.orderBy(translations, sortProperty, ascOrDesc)
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
