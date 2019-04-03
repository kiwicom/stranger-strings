<template>
  <div>
    <VueApexCharts width="270" type="donut" :options="options" :series="[missingPrimary, missingSecondary, translated]"></VueApexCharts>
  </div>
</template>

<script>
import VueApexCharts from "vue-apexcharts"

export default {
  name: "LocalizationProgressChart",
  components: {
    VueApexCharts,
  },
  props: {
    translated: { type: Number, required: true },
    missingPrimary: { type: Number, required: true },
    missingSecondary: { type: Number, required: true },
  },
  data() {
    return {
      nothing: {},
      options: {
        plotOptions: {
          pie: {
            donut: {
              size: "65%",
              background: "transparent",
              labels: {
                // These are the inner labels appearing inside donut
                show: true,
                name: {
                  show: true,
                  fontSize: "14px",
                  fontFamily: undefined,
                  color: undefined,
                  offsetY: -10,
                },
                value: {
                  show: true,
                  fontSize: "24px",
                  fontFamily: undefined,
                  color: undefined,
                  offsetY: 10,
                  formatter(val) {
                    return val
                  },
                },
                total: {
                  show: true,
                  label: "Total",
                  color: "#373d3f",
                  formatter(w) {
                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                  },
                },
              },
            },
          },
        },
        colors: ["#d5011b", "#ffb508", "#42b3d5"],
        dataLabels: {
          enabled: false,
          formatter(val) {
            return val
          },
          textAnchor: "middle",
          offsetX: 0,
          offsetY: 0,
          style: {
            fontSize: "12px",
            fontFamily: undefined,
            colors: undefined,
          },
        },
        labels: ["Missing primary", "Missing secondary", "Translated"],
        legend: {
          show: false,
          markers: {
            size: 6,
            strokeWidth: 0,
            strokeColor: "#fff",
            offsetX: 0,
            offsetY: 0,
            shape: "circle",
            radius: 2,
          },
          itemMargin: {
            horizontal: 20,
            vertical: 5,
          },
          containerMargin: {
            left: 10,
            top: 4,
            right: 10,
            bottom: 0,
          },
          onItemClick: {
            toggleDataSeries: true,
          },
          onItemHover: {
            highlightDataSeries: true,
          },
        },
        responsive: [], // breakpoints should follow ascending order 400, then 700, then 1000
        series: undefined,
        states: {
          normal: {
            filter: {
              type: "none",
              value: 0,
            },
          },
          hover: {
            filter: {
              type: "lighten",
              value: 0.15,
            },
          },
          active: {
            allowMultipleDataPointsSelection: false,
            filter: {
              type: "darken",
              value: 0.35,
            },
          },
        },
        subtitle: {
          text: undefined,
          align: "left",
          margin: 10,
          offsetX: 0,
          offsetY: 30,
          floating: false,
          style: {
            fontSize: "12px",
            fontFamily: undefined,
            color: undefined,
          },
        },
        tooltip: {
          enabled: false,
        },
      },
    }
  },
}
</script>

<style scoped>

</style>
