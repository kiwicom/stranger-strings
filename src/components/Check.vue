<template>
  <div>
    <div class="header">
      <div class="icon">
        <component :is="check.icon.default" />
      </div>
      <div class="wrapper">
        <div class="title">{{ check.title }}</div>
        <div class="controls">
          <b-form-checkbox
            v-on="$listeners"
            class="toggle"
            inline
            switch
            :checked="checked"
          />
          <small v-if="checked">Check enabled</small>
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
      <p>{{ check.description }}</p>
      <p v-if="check.exampleImage">
        <img
          class="example"
          :src="'/examples/' + check.exampleImage  + '.png'"
        />
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "Check",
  inheritAttrs: false,
  props: {
    checkKey: { type: String, required: true },
    check: { type: Object, required: true },
    checked: { type: Boolean, required: true },
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
    color: hsl(0, 0%, 30%);
    font-size: 80%;
  }

  .body .example {
    padding: 10px;
    border: 1px solid lightgray;
    border-radius: 5px;
  }
</style>
