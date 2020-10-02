// IMPORTANT:
// whatever sign-in method is selected make sure it's also allowed in firebase console
// in section Develop/Authentication/Sign-in method
// note: for none sign-in method you need to anable anonymous sign-in provider
const SIGN_IN_METHOD = "none" // "email link" | "google" | "none"
//-----------------------------------------------------------------

// insert whole emails of administrators
const ADMIN = [""] // e.g. ["translationmanager@amazingstartup.com"]

// add emails that can login to your Stranger Strings app e.g. ["bob@company.com", jake@company.com]
// also works for whitelisting certain domains ["gmail.com"]
// if you want to allow everyone enter [""]
const WHITELIST = [""] // e.g ["translator@externalcompany.com", "amazingstartup.com"]


// default user setting for new users
const IMPORTANT_LOCALES = [
  "en-GB",
  "cs-CZ",
  "da-DK",
  "de-DE",
  "es-ES",
  "fr-FR",
  "it-IT",
  "pl-PL",
  "pt-PT",
  "ru-RU",
  "sv-SE",
  "uk-UA",
  "he-IL",
  "ja-JP",
  "ko-KR",
  "nb-NO",
  "zh-CN-Hans",
  "nl-NL",
]

// set true for languages you want to activate spellchecking
// to set custom dictionaries see ./functions/dicts
const DEFAULT_SPELLCHECKING_DICT_SUPPORT = {
  "bg-BG": false,
  "cs-CZ": true,
  "da-DK": false,
  "de-DE": false,
  "el-GR": false,
  "en-GB": true,
  "es-ES": false,
  "fr-FR": false,
  "he-IL": false,
  "hu-HU": false,
  "it-IT": false,
  "lt-LT": false,
  "nb-NO": false,
  "nl-NL": false,
  "pl-PL": false,
  "pt-PT": false,
  "ro-RO": false,
  "ru-RU": false,
  "sk-SK": true,
  "sr-RS": false,
  "sv-SE": false,
  "tr-TR": false,
  "uk-UA": false,
  "vi-VN": false,
}

// default user setting for new users
const DEFAULT_DISABLED_CHECKS = []

// default user setting for new users
const DEFAULT_IMPORTANT_CHECKS = [
  "_inconsistencies_placeholders",
  "_inconsistencies_typos",
  "_inconsistencies_tags",
]

// default user setting for new users
const DEFAULT_UNIMPORTANT_CHECKS = [
  "_inconsistencies_writeGood",
  "_inconsistencies_insensitiveness",
  "_inconsistencies_dynamic",
]

// default admin setting for new users
const DEFAULT_WRITE_GOOD_SETTINGS = {
  "de-DE": {
    tooWordy: true,
    weasel: true,
  },
  "en-GB": {
    adverb: true,
    cliches: true,
    eprime: false,
    illusion: true,
    passive: true,
    so: true,
    thereIs: true,
    tooWordy: true,
    weasel: true,
  },
}

// default admin setting for new users
const DEFAULT_INSENSITIVENESS_CONFIG = {
  profanitySureness: 2,
  allow: [],
}

// default user setting for new users
const DEFAULT_VIEW = {
  hardWrap: false,
}

// default admin setting for new users
const DEFAULT_PLACEHOLDER_REGEX = "(__\\w+__)"

// default admin setting for new users
const DEFAULT_ALLOWED_TAGS = ["br", "a", "strong", "em", "span", "i"]

// default admin setting for new users
const DISALLOW_INCONSISTENCY_COMPUTATION_FOR_NON_EN_LOCALES = false

// DO NOT CHANGE
const baseUrl = `https://us-central1-${process.env.VUE_APP_FIREBASE_PROJECT_ID}.cloudfunctions.net`

module.exports = {
  SIGN_IN_METHOD,
  ADMIN,
  WHITELIST,
  IMPORTANT_LOCALES,
  DEFAULT_SPELLCHECKING_DICT_SUPPORT,
  DEFAULT_WRITE_GOOD_SETTINGS,
  DEFAULT_INSENSITIVENESS_CONFIG,
  DEFAULT_DISABLED_CHECKS,
  DEFAULT_IMPORTANT_CHECKS,
  DEFAULT_UNIMPORTANT_CHECKS,
  DEFAULT_VIEW,
  DEFAULT_PLACEHOLDER_REGEX,
  DEFAULT_ALLOWED_TAGS,
  DISALLOW_INCONSISTENCY_COMPUTATION_FOR_NON_EN_LOCALES,
  UPDATE_FUNCTION_ENDPOINT: `${baseUrl}/update`,
  INCONSISTENCIES_UPDATE_FUNCTION_ENDPOINT: `${baseUrl}/inconsistenciesUpdate`,
  COLLECTIONS_UPDATE_FUNCTION_ENDPOINT: `${baseUrl}/collectionsUpdate`,
}
