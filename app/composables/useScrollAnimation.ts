import { computed, unref, type Ref } from "vue";
import { useWindowScroll } from "@vueuse/core";

export const useScrollAnimation = () => {
    const { y } = useWindowScroll();

    // 1. Easing Logic
    const easeInOutCubic = (x: number): number => {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    };

    // 2. Map Range (Now supports Reactive Refs for start/end)
    const mapRange = (
        scrollStart: number | Ref<number>, // Changed to allow Refs
        scrollEnd: number | Ref<number>, // Changed to allow Refs
        outputStart: number = 0,
        outputEnd: number = 1,
        easingFn: (t: number) => number = (t) => t
    ) => {
        return computed(() => {
            // unref() handles both plain numbers and refs automatically
            const sStart = unref(scrollStart);
            const sEnd = unref(scrollEnd);

            // Guard against division by zero
            if (sEnd === sStart) return outputStart;

            const scrollPercent = (y.value - sStart) / (sEnd - sStart);
            const clamped = Math.min(Math.max(scrollPercent, 0), 1);

            // Apply the easing function
            const eased = easingFn(clamped);

            return outputStart + (outputEnd - outputStart) * eased;
        });
    };

    return { y, mapRange, easeInOutCubic };
};
