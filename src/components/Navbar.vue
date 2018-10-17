<template>
  <b-navbar type="dark" variant="info" class="navbar-expand-md">
    <b-navbar-brand href="#">
      Stranger Strings
      <a
        class="last-update"
        v-if="lastUpdate.updated"
        target="_blank"
      >
        Last update: <strong>{{ lastUpdate.updated.replace(/-/g,"/") }}</strong>
      </a>
    </b-navbar-brand>

    <b-navbar-nav is-nav>
        <b-link to="/items" style="color: #CCE2FC; margin-right: 15px; margin-left: 15px;" active-class="activeView">Items</b-link>
        <b-link to="/collections" style="color: #CCE2FC;" active-class="activeView">Collections</b-link>
    </b-navbar-nav>

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
  },
}
</script>

<style>
  /* Find out why scoped attr on <style> does not work */

  .navbar-dark {
    background: linear-gradient(to left, #28a5f5, #1e87f0);
  }

  .navbar-brand {
    font-family: 'Roboto Condensed', sans-serif;
    font-weight: 700;
    font-style: italic;
    position: relative;
    text-transform: uppercase;
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
