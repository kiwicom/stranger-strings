<template>
  <b-navbar type="dark" variant="info" class="navbar-expand-md">
    <b-navbar-brand href="#" v-b-popover.hover.bottom="lastUpdate.updated && 'Last update: ' + lastUpdate.updated.replace(/-/g,'/')">
      Stranger Strings
    </b-navbar-brand>
    <b-navbar-nav is-nav>
        <b-link
          to="/items"
          style="color: rgba(255, 255, 255, 0.5); display: none;"
          active-class="activeView"
        >
          Items
        </b-link>
        <b-link to="/collections" style="color: rgba(255, 255, 255, 0.5); display: none;" active-class="activeView">Collections</b-link>
    </b-navbar-nav>

    <b-toast
      title="Updating"
      variant="primary"
      :visible="updateInProgress.info"
      toaster="b-toaster-top-right"
      no-auto-hide
    >
      {{ updateInProgress.info && updateInProgress.info.state }}
    </b-toast>

    <!-- Right aligned nav items -->
    <b-navbar-nav is-nav class="ml-auto">
      <b-nav-item-dropdown right v-if="user.email">
        <template slot="button-content">
          {{ user.email }}
        </template>
        <b-dropdown-item href="#" @click="onSignOut()"><octicon name="sign-out"/>&nbsp; Sign out</b-dropdown-item>
      </b-nav-item-dropdown>
    </b-navbar-nav>

  </b-navbar>
</template>

<script type="text/javascript">
import "vue-octicon/icons"
import { FbDb } from "../modules/firebase"

export default {
  props: {
    onSignOut: { type: Function, required: true },
    user: { type: Object, required: true },
  },
  firebase: {
    lastUpdate: {
      source: FbDb.ref("lastUpdate"),
      asObject: true,
    },
    updateInProgress: {
      source: FbDb.ref("updateInProgress"),
      asObject: true,
    },
  },
}
</script>

<style scoped>
  @import url('https://fonts.googleapis.com/css?family=Megrim');

  .navbar-dark {
    background-color: #26539B !important;
    height: 50px;
  }

  .navbar-brand {
    font-family: 'Megrim', cursive;
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 2px;
  }
  @media screen and (max-width: 900px) {
    .navbar-brand {
      font-size: 3vw;
    }
  }

  .navbar-brand a.last-update {
    position: absolute;
    bottom: -2px; right: 0;
    text-align: right;
    color: inherit;
    font-size: 11px;
    font-weight: normal;
    text-transform: none;
    opacity: .5;
  }
  .activeView {
    color: white !important;
  }
</style>
