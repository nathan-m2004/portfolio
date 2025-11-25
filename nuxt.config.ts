// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: ["@nuxt/eslint", "@nuxt/hints", "@nuxt/ui"],
    css: ["~/assets/css/main.css"],

    fonts: {
        families: [
            {
                name: "Montserrat",
                provider: "google",
                // Force these weights to be downloaded
                weights: ["300", "400", "500", "700"],
                // distinct styles
                styles: ["normal", "italic"],
            },
        ],
    },
});
