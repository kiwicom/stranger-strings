<template>
  <div id="particles-js" style="text-align: center">
    <div class="banner">
      <h1>Stranger Strings</h1>
      <h2>All your translations in one place.</h2>
      <b-btn href="#" variant="primary"><a @click="onSignIn">Sign in with Google</a></b-btn>
    </div>
  </div>
</template>

<script type="text/javascript">
import "particles.js"

export default {
  props: {
    onSignIn: { type: Function, required: true },
  },
  mounted() {
    this.initParticles()
  },
  methods: {
    initParticles() {
      window.particlesJS("particles-js", {
        particles: {
          number: {
            value: 200,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: "#007bff",
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: "#000000",
            },
            polygon: {
              nb_sides: 5,
            },
            image: {
              src: "img/github.svg",
              width: 100,
              height: 100,
            },
          },
          opacity: {
            value: 0.5,
            random: false,
            anim: {
              enable: false,
              speed: 1,
              opacity_min: 0.1,
              sync: false,
            },
          },
          size: {
            value: 0,
            random: true,
            anim: {
              enable: false,
              speed: 40,
              size_min: 0.1,
              sync: false,
            },
          },
          line_linked: {
            enable: true,
            distance: 126.26362266116361,
            color: "#007bff",
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1.603412060865523,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 1200,
            },
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "bubble",
            },
            onclick: {
              enable: true,
              mode: "push",
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 400,
              line_linked: {
                opacity: 1,
              },
            },
            bubble: {
              distance: 146.17389821424212,
              size: 3,
              duration: 0.5594405594405595,
              opacity: 1,
              speed: 3,
            },
            repulse: {
              distance: 87.91208791208791,
              duration: 0.4,
            },
            push: {
              particles_nb: 4,
            },
            remove: {
              particles_nb: 2,
            },
          },
        },
        retina_detect: true,
      })
    },
  },
}
</script>

<style scoped>
  @import url('https://fonts.googleapis.com/css?family=Megrim');
  .banner {
    position: absolute;
    width: max-content;
    left: 50%;
    transform: translate(-50%, 0);
    top: 30%;
  }
  .banner h1 {
    margin-top: 10px;
    font-size: 9vw;
    font-family: 'Megrim', cursive;
  }
  .banner h2 {
    margin-top:15px;
    margin-bottom: 20px;
    font-size: 2vw;
    font-weight: 300;
  }
</style>
