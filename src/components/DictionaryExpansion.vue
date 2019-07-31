<template>
  <b-modal
    id="dictsExpansionModal"
    v-model="show"
    :title="'Custom spellchecking dictionary expansion'"
    size="lg"
    ok-title="Update"
    ok-only
    @ok="updateDictsExpansion"
    @hide="$emit('close')"
  >
    <div class="description">
      Here you can add/remove words that are not initially part of dictionary used for spellchecking.
    </div>
    <div
      v-for="dict in dicts"
      :key="dict"
    >
      <div class="dict-caption">{{ dict }}</div>
      <FirebaseListManager
        :db-path="`dictsExpansion/${dict}`"
        item-name="word"
        :list-name="`${dict} dictionary`"
        allow-changes
      />
    </div>
    <div class="message" v-if="!dicts && !loaded">Loading...</div>
    <div class="message" v-if="!dicts && loaded">This Stranger Strings instance doesn't use dictionaries for spellchecking</div>
  </b-modal>
</template>

<script>
import { FbDb } from "../modules/firebase"
import * as gcFunctions from "../modules/functionsApi"
import FirebaseListManager from "./FirebaseListManager"

export default {
  name: "DictionaryExpansion",
  props: {
    show: { type: Boolean, required: true },
  },
  components: {
    FirebaseListManager,
  },
  data() {
    return {
      dicts: [],
      loaded: false,
    }
  },
  created() {
    FbDb.ref("dictsExpansion/").once("value", (snapshot) => {
      if (snapshot.val()) {
        this.dicts = Object.keys(snapshot.val()).sort((a, b) => {
          if (a === "global") {
            return -1
          }
          return b === "global" ? 1 : 0
        })
      }
      this.loaded = true
    })
  },
  methods: {
    updateDictsExpansion() {
      gcFunctions.inconsistenciesUpdate()
    },
  },
}
</script>

<style scoped>
  .description {
    text-align: center;
    margin: 20px 0 40px 0;
    font-style: italic;
  }
  .dict-caption {
    text-align: center;
    font-weight: bold;
    font-size: 24px;
    padding: 20px 0 0 0;
    margin: 20px;
    border-top: 1px solid rgb(195, 195, 195);
  }
.message {
  text-align: center;
  margin: 30px;
  color: rgb(138, 138, 138);
}
</style>
