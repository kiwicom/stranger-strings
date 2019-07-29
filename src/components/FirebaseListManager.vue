<template>
  <div class="wrapper">
    <div class="adding">
      Add new {{ itemName || "item" }} to {{ listName || "list" }}:
    </div>
    <div class="list">
      <div class="list-name">
        {{ listName || "List" }}:
      </div>
    </div>
  </div>
</template>

<script>
import { FbDb } from "../modules/firebase"

export default {
  name: "FirebaseListManager",
  props: {
    dbPath: { type: String, required: true },
    allowChanges: { type: Boolean },
    itemName: { type: String },
    listName: { type: String },
    itemPrefix: { type: String },
    itemSuffix: { type: String },
    placeholderItem: { type: String },
    allowDuplicates: { type: Boolean },
  },
  data() {
    return {
      newItem: "",
    }
  },
  firebase() {
    return {
      list: {
        source: FbDb.ref(this.dbPath),
        asObject: true,
      },
    }
  },
  computed: {
    isdDplicate() {
      return Object.values(this.list).some(item => item === this.newItem)
    },
  },
  methods: {
    addItemToList(item) {
      if (this.allowChanges) {
        FbDb.ref(this.dbPath).push(item)
      }
    },
  },
}
</script>

<style scoped>

</style>
