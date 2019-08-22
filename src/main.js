import Vue from "vue"
import VueFire from "vuefire"
import BootstrapVue from "bootstrap-vue"
import Octicon from "vue-octicon/components/Octicon"
import CountryFlag from "vue-country-flag"
import VueClipboard from "vue-clipboard2"

import VTooltip from "v-tooltip"
import "../styles/tooltip.css"

import App from "./App"
import router from "./router"
import store from "./store"

VueClipboard.config.autoSetContainer = true

Vue.use(VueFire)
Vue.use(BootstrapVue)
Vue.use(VueClipboard)

Vue.use(VTooltip, {
  defaultArrowSelector: ".tooltiper-arrow, .tooltiper__arrow",
  defaultInnerSelector: ".tooltiper-inner, .tooltiper__inner",
  defaultLoadingClass: "tooltiper-loading",
  popover: {
    defaultBaseClass: "tooltiper popoverer",
    defaultInnerClass: "tooltiper-inner popoverer-inner",
    defaultArrowClass: "tooltiper-arrow popoverer-arrow",
    defaultAutoHide: false,
  },
})

Vue.component("octicon", Octicon)
Vue.component("vue-country-flag", CountryFlag)

/* ICONS
* template for naming icon components for checks:
* -----------------------------------------------
* example:
* _inconsistencies_placeholders => placeholdersIcon
* -----------------------------------------------
* regex:
* "_inconsistencies_placeholders".replace(/.*_/g, "") + "Icon"
* _______________________________________________
* */
Vue.component("placeholdersIcon", require("vue-material-design-icons/CodeBraces").default)
Vue.component("firstCharTypeIcon", require("vue-material-design-icons/PageFirst").default)
Vue.component("lastCharTypeIcon", require("vue-material-design-icons/PageLast").default)
Vue.component("tagsIcon", require("vue-material-design-icons/CodeTags").default)
Vue.component("lengthIcon", require("vue-material-design-icons/ArrowExpandHorizontal").default)
Vue.component("typosIcon", require("vue-material-design-icons/Spellcheck").default)
Vue.component("writeGoodIcon", require("vue-material-design-icons/CommentAlertOutline").default)
Vue.component("insensitivenessIcon", require("vue-material-design-icons/EmoticonCryOutline").default)
Vue.component("dynamicIcon", require("vue-material-design-icons/Resistor").default)
Vue.component("noEnglishIcon", require("vue-material-design-icons/EarthOff").default)

Vue.config.productionTip = false
Vue.config.devtools = true
Vue.config.performance = true

new Vue({
  router,
  render: h => h(App),
  store,
}).$mount("#app")
