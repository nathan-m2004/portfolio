<script setup lang="ts">
type Project = {
    title: string;
    type: string;
    description: string;
    stack: string[]
    video?: string
    youtube?: string
    image?: string
    repo?: string
    live?: string
    colSpan: string
    rowSpan: string
}
const projects: Project[] = [
    {
        title: "GENETIC SNAKES",
        type: "Simulation / Neural Networks",
        description: "Neural Network evolution simulation using tournament selection.",
        stack: ["TypeScript", "Canvas API", "Neural Networks"],
        // Use a short mp4 loop for the visual punch
        video: "snake.mp4",
        repo: "https://github.com/nathan-m2004/genetic-snakes",
        live: "https://genetic-snakes.vercel.app/",
        colSpan: "md:col-span-3", // spans 2 columns
        rowSpan: "md:row-span-2"
    },
    {
        title: "DOCKER TESTING",
        type: "Fullstack",
        description: "Fullstack Login system for self hosting experimentation",
        stack: ["Docker", "VPS", "Nuxt", "Node", "Mongodb"],
        live: "https://docker-testing.aahnnt.com",
        repo: "https://github.com/nathan-m2004/docker-testing",
        image: "/docker-testing.png",
        colSpan: "md:col-span-1",
        rowSpan: "md:row-span-1",
    },
    {
        title: "TEXTOCSV",
        type: "CLI Tool",
        description: "Regex filtering and CSV export pipeline.",
        stack: ["Node.js", "RegEx"],
        repo: "https://github.com/nathan-m2004/textocsv",
        colSpan: "md:col-span-1",
        rowSpan: "md:row-span-1",
    },
    {
        title: "IFSC REDESIGN",
        type: "Visual Engineering",
        description: "Product redesign, visualization and motion graphics.\nNot your average Software Engineer UI/UX",
        stack: ["Blender", "After Effects", "Illustrator"],
        youtube: "odgTwU-RTkQ",
        live: "https://youtu.be/odgTwU-RTkQ",
        colSpan: "md:col-span-2",
        rowSpan: "md:row-span-1",
    },
    {
        title: "FLAPPY",
        type: "Simulation / Neural Networks",
        description: "Flappy bird but played by a Feedforwad Neural Network",
        stack: ["Javascript", "HTML Canvas", "Neural Networks"],
        repo: "https://github.com/nathan-m2004/Flappy",
        video: "/flappy.mp4",
        colSpan: "md:col-span-2",
        rowSpan: "md:row-span-1",
    },

]
</script>

<template>
    <section class="min-h-screen px-4 py-20 text-gray-200">
        <div class="flex justify-center max-w-6xl mx-auto mb-16">
            <div>
                <h2 class="tracking-wide text-xl md:text-2xl font-medium text-gray-100 mb-2">Projects</h2>
                <p class="text-gray-400 font-light text-xs md:text-sm tracking-widest uppercase opacity-70">
                    Selected Works & Experiments
                </p>
            </div>
        </div>

        <div class="max-w-6xl mx-auto grid grid-flow-dense p-10 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

            <div v-for="(project, index) in projects" :key="index"
                class="h-full w-full shadow-lg bg-old-neutral-900 group relative overflow-hidden rounded-lg transition-all duration-300"
                :class="[project.colSpan, project.rowSpan]">

                <div v-if="project.video || project.image || project.youtube"
                    class="aspect-video w-full overflow-hidden bg-old-neutral-900 relative">
                    <video v-if="project.video" :src="project.video"
                        class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500"
                        autoplay loop muted playsinline></video>
                    <iframe v-if="project.youtube"
                        class="w-full h-full opacity-60 group-hover:opacity-100 transition-all duration-500"
                        :src="`https://www.youtube.com/embed/${project.youtube}`" frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                    <img v-if="project.image"
                        class="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500"
                        :src="project.image">
                </div>

                <div class="p-6 relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 font-light text-xs mb-1 md:text-[12px] tracking-widest uppercase">{{
                                project.type.toUpperCase() }}</p>
                            <h3 class="text-xl md:text-2xl font-medium text-white tracking-wide">{{ project.title }}
                            </h3>
                        </div>
                        <div class="flex gap-3">
                            <a v-if="project.repo" :href="project.repo" target="_blank"
                                class="hover:text-green-400 transition-colors" title="View Code">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd"
                                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                        clip-rule="evenodd" />
                                </svg>
                            </a>
                            <a v-if="project.live" :href="project.live" target="_blank"
                                class="hover:text-green-400 transition-colors" title="View Live">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <p class="text-gray-400 text-sm mb-6 font-light leading-relaxed flex-grow whitespace-pre-line">
                        {{ project.description }}
                    </p>

                    <div class="flex flex-wrap gap-2">
                        <span v-for="tech in project.stack" :key="tech"
                            class="px-2 py-1 text-[12px] border border-gray-700 rounded text-gray-400 group-hover:text-white group-hover:border-gray-500 transition-colors">
                            {{ tech }}
                        </span>
                    </div>
                </div>

                <div
                    class="absolute inset-0 bg-neutral-500/3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                </div>
            </div>

        </div>
    </section>
</template>