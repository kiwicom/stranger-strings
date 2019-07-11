<template>
  <div>
    <v-popover
      trigger="hover"
      v-if="token.content !== ''"
      v-for="token in parseContent(content)"
      :key="token.order"
      :disabled="!token.type"
      style="display: inline-block"
      placement="top"
    >
      <span
        :class="['text', token.type && getCheckData(token.type).level + '-highlight']"
        v-html="escape(token.content)"
      >
     </span>
      <template slot="popover">
        <div v-if="token.type">
          <div
            :class="['popover-header' , getCheckData(token.type).level]"
          >
            <div class="check-icon">
              <component
                :is="getIcon(token.type)"
              />
            </div>
            <div class="check-title">
              {{ getCheckData(token.type).title }} {{ getCheckData(token.type).level }}
            </div>
          </div>
          <div
            v-if="token.type === '_inconsistencies_writeGood'"
            class="popover-content"
          >
            {{ getWriteGoodReason(token.content) }}
          </div>
        </div>
      </template>
    </v-popover>
  </div>
</template>

<script>
import _ from "lodash"
import { mapGetters } from "vuex"

export default {
  name: "Highlighting",
  props: {
    content: { type: String },
    placeholders: { type: Array },
    tags: { type: Array },
    restrictedTags: { type: Array },
    dynamics: { type: Array },
    typos: { type: Array },
    firstCharType: { type: Boolean },
    lastCharType: { type: Boolean },
    writeGood: { type: Array },
    insensitiveness: { type: Array },
  },
  computed: {
    ...mapGetters([
      "getCheckData",
    ]),
    writeGoodHighlights() {
      return this.writeGood.map(wg => wg.reason.match(/".+(?=")/m) && wg.reason.match(/".+(?=")/m)[0].slice(1))
    },
  },
  methods: {
    getWriteGoodReason(word) {
      return this.writeGood.find(wg => new RegExp(`"${word}(?=")`, "m").test(wg.reason)).reason
    },
    removeDuplicates(array) {
      return [...new Set(array)]
    },
    escape(content) {
      return _.replace(content)
    },
    parseContent(content) {
      let parsedContent = [{
        order: "a",
        typelessOrder: null,
        content,
        type: null,
      }]
      if (this.writeGood) {
        parsedContent = this.parseTokens(parsedContent, this.writeGoodHighlights, "_inconsistencies_writeGood")
      }
      if (this.typos) {
        parsedContent = this.parseTokens(parsedContent, this.typos, "_inconsistencies_typos")
      }
      parsedContent.filter(t => !t.type && t.content.split(" ").length).forEach((token) => {
        // parse remaining typeless tokens to smaller blocks to avoid messing UI
        const splitten = token.content.split(" ")
        const newTokens = []
        let counter = 0
        splitten.forEach((word) => {
          newTokens.push({
            order: token.order,
            typelessOrder: counter,
            content: `${word} `,
            type: null,
          })
          counter += 1
        })
        parsedContent = parsedContent.filter(tkn => tkn.order !== token.order).concat(newTokens)
      })

      return parsedContent.sort((a, b) => {
        if (a.order < b.order) {
          return -1
        }
        if (a.order > b.order) {
          return 1
        }
        return a.typelessOrder - b.typelessOrder
      })
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
              typelessOrder: null,
              content: token.content.slice(0, token.content.search(regex)),
              type: null,
            })
            parsedContent.push({
              order: `${token.order}b`,
              typelessOrder: null,
              content: highlight,
              type,
            })
            parsedContent.push({
              order: `${token.order}c`,
              typelessOrder: null,
              content: token.content.slice(token.content.search(regex) + highlight.length),
              type: null,
            })
            parsedContent = parsedContent.filter(tkn => tkn.order !== token.order)
          })
      })
      return parsedContent
    },
    getIcon(checkKey) {
      return `${checkKey.replace(/.*_/g, "")}Icon`
    },
  },
}
</script>

<style scoped>
  .error-highlight {
    background-color: rgba(255, 0, 0, 0.24);
  }
  .warning-highlight {
    background-color: rgba(255, 165, 0, 0.4);
  }
  .suggestion-highlight {
    background-color: rgba(0, 123, 255, 0.16);
  }
  .text {
    display: inline-block;
    white-space: pre;
  }
  .strikethrough {
    text-decoration: line-through;
  }
  .style-popover {
    text-align: center;
    width: fit-content;
  }
  .error {
    background-color: rgba(239, 0, 0, 0.32);
  }
  .warning {
    background-color: rgba(255, 180, 9, 0.62);
  }
  .suggestion {
    background-color: rgba(0, 123, 255, 0.16);
  }
  .popover-header {
    padding-top: 0px;
    padding-left: 0px;
    border-right: 5px;
    height: 40px;
  }
  .popover-content {
    display: inline-block;
    width: 300px;
  }
  .check-icon {
    margin-right: 15px;
    display: inline-block;
    border-radius: 5px 0px 0px;
    width: 40px;
    height: 40px;
    background-color: #2E5496;
    text-align: center;
  }
  .check-icon .material-design-icon {
    color: white;
    font-size: 30px;
  }
  .check-title {
    display: inline-block;
    font-size: larger;
    vertical-align: text-bottom;
    color: #1f3a68;
  }

</style>
