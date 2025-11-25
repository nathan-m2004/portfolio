<script setup lang="ts">
import { onMounted } from 'vue'

// 1. Apply the lock class during SSR (Server Side)
useHead({
  bodyAttrs: {
    class: 'overflow-hidden'
  }
})

onMounted(() => {
  // 2. CRITICAL FIX: Disable browser scroll restoration
  // This prevents the browser from jumping down to the previous position on reload
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }

  // 3. Force scroll to top immediately
  window.scrollTo(0, 0)

  // 4. Remove the class once Vue is ready (Client Side)
  setTimeout(() => {
    document.body.classList.remove('overflow-hidden')
  }, 50)
})
</script>

<template>
  <title>Nathan</title>
  <div class="fixed inset-0 pointer-events-none z-100 mix-blend-overlay opacity-7 grayscale bg-noise"></div>
  <NuxtPage />
</template>

<style>
/* Global Styles 
  This class prevents scrolling while active on the body tag 
*/
body.overflow-hidden {
  overflow: hidden;
  height: 100vh;
  /* Locks height to viewport */
  touch-action: none;
  /* Disables touch scrolling on some mobile devices */
}
</style>
