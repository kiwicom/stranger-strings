<template>
  <b-navbar type="dark" variant="info" class="navbar-expand-md">
    <b-navbar-brand href="#" v-b-popover.hover.bottom="lastUpdate.updated && 'Last update: ' + lastUpdate.updated.replace(/-/g,'/')">
      Stranger Strings
    </b-navbar-brand>
    <b-navbar-nav is-nav>
        <b-link to="/items" style="color: rgba(255, 255, 255, 0.5); margin-right: 15px; margin-left: 15px;" active-class="activeView">Items</b-link>
        <b-link to="/collections" style="color: rgba(255, 255, 255, 0.5);" active-class="activeView">Collections</b-link>
    </b-navbar-nav>

    <div class="updating" v-if="updateInProgress.info">Update in progress ({{ updateInProgress.info.state }}...)</div>

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
  }

  .navbar-brand {
    font-family: 'Megrim', cursive;
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 2px;
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

  .updating {
    right: 0;
    left: 0;
    margin-left: auto;
    margin-right: auto;
    position: absolute;
    margin-top: 45px;
    z-index: 4;
    color: grey;
    font-size: 12px;
    text-align: center;
    font-weight: lighter;
    width: max-content;
  }
</style>
