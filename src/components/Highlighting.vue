<template>
  <div>
    <span v-if="token.content !== ''" v-for="token in parseContent(content)" :key="token.order">{{ token.content }}</span>
  </div>
</template>

<script>
import _ from "lodash"

export default {
  name: "Highlighting",
  props: {
    content: { type: String },
    placeholders: { type: Array },
    tags: { type: Array },
    restrictedTags: { type: Array },
    dynamics: { type: Array },
    firstCharType: { type: Boolean },
    lastCharType: { type: Boolean },
    writeGood: { type: Array },
    insensitiveness: { type: Array },
  },
  computed: {
    writeGoodHighlights() {
      return this.writeGood.map(wg => wg.reason.match(/".+(?=")/m) && wg.reason.match(/".+(?=")/m)[0].slice(1))
    },
  },
  methods: {
    parseContent(content) {
      let parsedContent = [{
        order: "a",
        content,
        type: null,
      }]
      if (this.writeGood) {
        parsedContent = this.parseTokens(parsedContent, this.writeGoodHighlights, "_inconsistencies_writeGood")
      }
      return parsedContent
    },
    parseTokens(chunks, highlights, type) {
      let parsedContent = chunks
      highlights.forEach((highlight) => {
        let regex = {}
        switch (type) {
        case "_inconsistencies_writeGood":
          regex = new RegExp(`${highlight}(?=[^\\w]|$)`, "g")
          break
        case "_inconsistencies_dynamic":
          regex = new RegExp(highlight, "gm")
          break
        case "_inconsistencies_typos":
          regex = new RegExp(`${_.escapeRegExp(highlight)}(?=[^\\w]|$)`, "g")
          break
        default:
          regex = new RegExp(highlight, "g")
          break
        }
        parsedContent.filter(token => regex.test(token.content) && !token.type)
          .forEach((token) => {
            parsedContent.push({
              order: `${token.order}a`,
              content: token.content.slice(0, token.content.search(regex)),
              type: null,
            })
            parsedContent.push({
              order: `${token.order}b`,
              content: highlight,
              type,
            })
            parsedContent.push({
              order: `${token.order}c`,
              content: token.content.slice(token.content.search(regex) + highlight.length),
              type: null,
            })
            parsedContent = parsedContent.filter(tkn => tkn.order !== token.order)
          })
      })
      return parsedContent.sort((a, b) => (a.order < b.order ? -1 : 1))
    },
  },
}
</script>

<style scoped>

</style>
