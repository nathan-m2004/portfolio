<script setup lang="ts">
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useScrollAnimation } from "~/composables/useScrollAnimation"

// 1. Get helpers
const { mapRange, easeInOutCubic } = useScrollAnimation()
const { width } = useWindowSize()

const startWord = "AAHNNT"
const endWord = "NATHAN"

// 2. Define Dynamic Scroll Distance
// This is reactive: if you resize the window, this value updates.
const scrollDistance = computed(() => width.value < 768 ? 500 : 900)

// 3. Use mapRange directly with the reactive scrollDistance
// We pass the Ref variable 'scrollDistance', not scrollDistance.value
const progress = mapRange(0, scrollDistance, 0, 1, easeInOutCubic)
const topPosition = mapRange(0, scrollDistance, 50, 5, easeInOutCubic)
const opacity = mapRange(0, scrollDistance, 100, 0, easeInOutCubic)

const currentText = computed(() => {
    const p = progress.value
    const lettersToFlip = Math.floor(p * endWord.length)
    return endWord.slice(0, lettersToFlip) + startWord.slice(lettersToFlip)
})
</script>

<template>
    <div class="h-screen w-full relative">
        <ClientOnly>

            <!-- MAIN TEXT CONTAINER -->
            <div class="fixed w-full left-0 px-4 text-center z-10" :style="{ top: `${topPosition}vh` }">
                <h1 class="text-3xl md:text-5xl font-medium tracking-widest wrap-break-word">
                    {{ currentText }}
                </h1>

                <div class="flex justify-center mt-12 md:mt-24">
                    <UIcon name="ic:baseline-arrow-downward" class="w-6 h-6 md:w-8 md:h-8"
                        :style="{ opacity: `${opacity}%` }" />
                </div>
            </div>

            <!-- FOOTER TEXT -->
            <p class="fixed bottom-10 w-full left-0 text-center px-4 text-xs md:text-base leading-relaxed"
                :style="{ opacity: `${opacity}%` }">
                Software Engineer <span class="hidden sm:inline">|</span>
                <span class="block sm:inline">Full Stack Developer</span>
                <span class="hidden sm:inline">|</span>
                <span class="block sm:inline">Linux Enthusiast</span>
            </p>

            <template #fallback>
                <div class="fixed w-full left-0 px-4 text-center z-10" style="top: 50vh;">
                    <h1 class="text-3xl md:text-5xl font-medium tracking-widest">AAHNNT</h1>
                    <div class="flex justify-center mt-12 md:mt-24">
                        <UIcon name="svg-spinners:ring-resize" class="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                </div>
                <p class="fixed bottom-10 w-full left-0 text-center px-4 text-xs md:text-base">
                    Software Engineer | Full Stack Developer | Linux Enthusiast
                </p>
            </template>
        </ClientOnly>
    </div>
</template>

<style scoped>
body {
    overflow-x: hidden;
}
</style>