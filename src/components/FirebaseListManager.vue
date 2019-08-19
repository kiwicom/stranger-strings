<template>
  <div class="wrapper" v-if="items">
    <div class="adding">
      <b-input-group>
        <b-input-group-prepend>
          <b-input-group-text v-if="itemPrefix">{{ itemPrefix }}</b-input-group-text>
        </b-input-group-prepend>

        <b-form-input
          type="text"
          :disabled="!allowChanges"
          :state="!isdDplicate && newItem !== ''"
          :placeholder="'e.g. ' + placeholderItem"
          aria-describedby="input-live-feedback"
          v-model="newItem"
        />


        <b-input-group-append>
          <b-input-group-text v-if="itemSuffix">{{ itemSuffix }}</b-input-group-text>
          <b-button
            variant="outline-success"
            :disabled="!allowChanges || isdDplicate || newItem === ''"
            @click="addItemToList(newItem)"
          >
            Add to {{ getListName }}
          </b-button>
        </b-input-group-append>

        <b-form-invalid-feedback id="input-live-feedback">
          <span v-if="isdDplicate">{{ `${getListName} aleady contains this ${getItemName}` }}</span>
          <span v-if="newItem === ''">{{ `${getItemName} must be at least 1 characeter long` }}</span>
        </b-form-invalid-feedback>
      </b-input-group>
    </div>
    <div class="list">
      <div class="list-name">
        {{ listName || "List" }}:
      </div>
      <b-list-group>
        <b-list-group-item
          class="d-flex justify-content-between align-items-center"
          v-for="item in items"
          :key="item['.key']"
        >
          <strong>{{ itemPrefix }}{{ item[".value"] }}{{itemSuffix}}</strong>
          <b-button
            size="sm"
            :disabled="!allowChanges"
            variant="outline-danger"
            @click="removeItemFromList(item['.key'])"
          >
            <DeleteIcon :size="48"/>
          </b-button>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>

<script>
import DeleteIcon from "vue-material-design-icons/CloseCircle"
import { FbDb } from "../modules/firebase"

export default {
  name: "FirebaseListManager",
  components: {
    DeleteIcon,
  },
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
      items: {
        source: FbDb.ref(this.dbPath),
      },
    }
  },
  computed: {
    isdDplicate() {
      return this.items.some(item => item[".value"] === this.newItem)
    },
    getListName() {
      return this.listName || "list"
    },
    getItemName() {
      return this.itemName || "item"
    },
  },
  methods: {
    addItemToList(item) {
      if (this.allowChanges) {
        FbDb.ref(this.dbPath).push(item)
      }
      this.newItem = ""
    },
    removeItemFromList(key) {
      if (this.allowChanges) {
        FbDb.ref(`${this.dbPath}/${key}`).remove()
      }
    },
  },
}
</script>

<style scoped>
  .wrapper {
    margin-top: 20px;
  }
.list-name {
  margin: 20px 0 10px 0;
  font-weight: bolder;
  font-size: 1rem;
}
</style>
