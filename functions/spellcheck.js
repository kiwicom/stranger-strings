/* eslint-disable no-param-reassign */
const XRegExp = require("xregexp")

function trimWord(word) {
  const LTrim = XRegExp("^[^\\p{Letter}\\p{Number}]*", "ig")
  const lettersOnly = XRegExp("^(\\p{Letter}*[.'’@-]*\\p{Number}*)*", "ig")
  word = XRegExp.replace(word, LTrim, "")
  word = XRegExp.match(word, lettersOnly, "one")
  word = word || ""
  return word.replace(/[.]*$/, "").replace(/^\d+$/, "")
}

function splitWord(word) {
  return word.replace(/\//g, " ")
}

function spellcheck(dict, text) {
  const words = Array.from(new Set(text
    .toString()
    .split(/\s+/)
    .map(trimWord)
    .map(splitWord)
    .filter(i => i && i.length > 1)
    .filter(i => !/[-’]/.test(i)) // nspell has problems with "-" and "'" therefore ignoring
    .filter(i => !/[@]/.test(i)))) // filter emails

  return words.filter(word => !dict.correct(word) && !dict.correct(`${word}.`)) // fix for words ending with dot... example: "etc."
}


module.exports = {
  spellcheck,
  trimWord,
}
