<template>
  <div>
    <div class="header">
      <div class="icon">
        <component :is="getIcon(checkKey)" />
      </div>
      <div class="wrapper">
        <div class="title">{{ getCheckData(checkKey).title }}</div>
        <div class="controls">
          <b-form-checkbox
            v-model="toggleCheck"
            class="toggle"
            inline
            switch
            :value="true"
            :unchecked-value="false"
          />
          <small v-if="isActive(checkKey)">Check enabled</small>
          <small v-else>Check disabled</small>

          <!-- TODO -->
          <!--
          <a
            href=""
            class="config"
          >Configure</a>
          -->
        </div>
      </div>
    </div>
    <div class="body">
      <p>{{ getCheckData(checkKey).description }}</p>
      <div class="example">
        <div class="line" v-for="(translation, loc) in examples" :key="loc">
          <div class="loc">{{ loc }}</div>
          <div class="flag-icon"></div>
          <div class="translation">{{ translation.text }}</div>
        </div>
      </div>
      <div class="levels">
        <div class="label">
          <p>Check severity level:</p>
        </div>
        <div
          v-for="level in ['suggestion', 'warning', 'error']"
          :key="level"
          class="radios"
        >
          <b-form-radio
            v-model="getCheckData(checkKey).level"
            :value="level"
            @change.native="setCheckLevel({ check: checkKey, level })"
            class="radio"
          >
          </b-form-radio>
          <div class="radio-label">
            {{ level.charAt(0).toUpperCase() + level.slice(1) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from "vuex"

export default {
  name: "Check",
  inheritAttrs: false,
  props: {
    checkKey: { type: String, required: true },
  },
  data() {
    return {
      examples: {
        "es-ES": {
          text: "Podemos proporcionar <b>__availableOfficers__</b> oficiales para asegurar su evento. " +
                "También cubriremos todos los daños causados por ladrones durante su evento.",
          lastCharType: ["dot", "dot"],
          firstCharType: ["letter", "letter"],
          placeholders: ["__availableOfficers__"],
          tags: ["<b>", "</b>"],
        },
        "en-GB": {
          text: "We are able to to secure yuor event with <b>__availableOfficers__</b> policemen.",
          style: [{ index: 15, offset: 2, reason: "\"to\" is repeated" }],
          insensitiveness: ["`policemen` may be insensitive, use `officers`, `police officers` instead"],
          typos: ["yuor"],
          lastCharType: ["dot", "dot"],
          firstCharType: ["letter", "letter"],
          placeholders: ["__availableOfficers__"],
          tags: ["<b>", "</b>"],
        },
        "fr-FR": {
          text: "- Nous sommes en mesure de sécuriser votre événement avec <u>4</u> policiers",
          lastCharType: ["letter", "dot"],
          firstCharType: ["dash", "letter"],
          disallowedTags: ["<u>", "</u>"],
        },
        "zh-CN": {
          text: "我们能够通过__availableOfficers__名警察确保您的活动安全。",
          lastCharType: ["dot", "dot"],
          firstCharType: ["letter", "letter"],
          placeholders: ["__availableOfficers__"],
        },
      },
    }
  },
  computed: {
    ...mapGetters([
      "isActive",
      "getCheckData",
    ]),
    toggleCheck: {
      get() {
        return this.isActive(this.checkKey)
      },
      set(value) {
        this.setCheckActiveness({ check: this.checkKey, newValue: value })
      },
    },
  },
  methods: {
    ...mapMutations([
      "setCheckActiveness",
      "setCheckLevel",
    ]),
    getIcon(checkKey) {
      return `${checkKey.replace(/.*_/g, "")}Icon`
    },
  },
}
</script>

<style scoped>
  .header {

  }

  .header .icon {
    float: left;
    margin-right: 10px;
    display: inline-block;
    width: 48px; height: 48px;
    line-height: 48px;
    background-color: #2E5496;
    border-radius: 5px;
    text-align: center;
  }

  .header .icon .material-design-icon {
    color: white;
    font-size: 28px;
    margin: 0; padding: 0;
    position: relative; top: 0.125em; /* hack to center */
  }

  .header .wrapper {
    line-height: 24px;
    white-space: nowrap;
  }

  .header .title {

  }

  .header .controls {
    position: relative; top: -4px;

  }

  .header .controls .config {
    font-size: 12px;
  }

  .header .custom-switch {
    display: inline-block;
    position: relative; top: 2px;
    margin-right: 0;
  }

  .header strong {
    font-size: 14px;
    vertical-align: middle;
  }

  .body {
    clear: both;
    margin-top: 10px;
    width: 400px;
    color: hsl(0, 0%, 30%);
    font-size: 80%;
  }

  .body .example {
    padding: 10px;
    border: 1px solid lightgray;
    border-radius: 5px;
  }
  .levels {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  .levels .label {
    vertical-align: center;
  }
  .levels .label p {
    margin: 0 !important;
  }
  .levels .radios {
    flex-grow: 2;
    text-align: center;
    justify-content: center;
  }
  .radio-label {
    font-size: 9px;
  }
  .levels .custom-control {
    padding-left: 1.85rem
  }
</style>
