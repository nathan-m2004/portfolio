<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useScrollAnimation } from "~/composables/useScrollAnimation"
import InteractiveNode from "./InteractiveNode/InteractiveNode.client.vue"

// 1. Import width to make logic responsive
const { width } = useWindowSize()
const { mapRange, easeInOutCubic } = useScrollAnimation()

// --- Logic ---
const showInfo = ref(false)
const sectionRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
    observer = new IntersectionObserver((entries) => {
        const entry = entries[0]

        if (entry!.isIntersecting) {
            setTimeout(() => {
                showInfo.value = true
            }, 1500)

            observer?.disconnect()
        }
    }, {
        threshold: 0.4
    })

    if (sectionRef.value) {
        observer.observe(sectionRef.value)
    }
})

onUnmounted(() => {
    observer?.disconnect()
})

// --- Dynamic Animation Config ---

// 2. Sync start point with the previous section's end point
// Mobile: Starts at 500px, Desktop: Starts at 900px
const animationStart = computed(() => width.value < 768 ? 500 : 500)

// 3. Define the length of this animation
// We add ~600px of scroll distance for the effect to complete
const animationEnd = computed(() => width.value < 768 ? 700 : 900)

// 4. Pass the Computed Refs directly to mapRange
const progress = mapRange(animationStart, animationEnd, 0, 100, easeInOutCubic)

</script>

<template>
    <div ref="sectionRef"
        class="flex flex-col relative min-h-screen justify-center items-center overflow-hidden w-full">
        <ClientOnly>
            <!-- 
                InteractiveNode:
                We multiply opacity by 0.3 when showInfo is false so it starts dim 
                and then brightens up when the interaction triggers.
            -->
            <InteractiveNode class="transition-opacity duration-500 ease-in-out cursor-move"
                :style="{ opacity: `${progress * (showInfo ? 1 : 0.3)}%` }" />

            <!-- 
                Text Container:
                1. Added 'z-10' to ensure text is above the node if they overlap.
                2. Changed '-translate-y-76' to responsive '-translate-y-32 md:-translate-y-76'.
                   32 (8rem) is much safer for mobile screens than 76 (19rem).
                3. Added 'px-4' for horizontal safety on small phones.
            -->
            <div class="flex flex-col items-center transition-transform duration-1000 ease-in-out pointer-events-none z-10 px-4"
                :class="{ '-translate-y-66 md:-translate-y-76': showInfo }" :style="{ opacity: `${progress}%` }">

                <div class="flex items-center gap-4 mb-2 text-center">
                    <h1 class="tracking-wide text-xl md:text-2xl font-medium text-gray-100">
                        Infrastructure & Environment
                    </h1>
                </div>

                <div class="transition-all duration-500 ease-in-out max-w-lg text-center"
                    :class="showInfo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'">
                    <p class="text-gray-400 font-light text-xs md:text-sm tracking-widest uppercase">
                        Interactive Topology &middot; Click nodes to inspect
                    </p>
                </div>
            </div>

            <template #fallback>
                <h1 class="font-medium tracking-wide text-2xl">
                    Infrastructure & Environment
                </h1>
            </template>
        </ClientOnly>
    </div>
</template>