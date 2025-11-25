<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { InfrastructureScene, type NodesType, type NodeType } from './Scene'; // Import your main class

const InteractableNodes: NodesType = [
    {
        name: "VPS",
        description: "Private Linux server self-hosting my production environment.",
        size: 1,
        color: "hsl(150, 60%, 45%)", // Arch/Linux Green
        attach: []
    },
    {
        name: "Arch Linux",
        description: "Personal workstation: Minimalist, rolling-release OS.",
        size: 1,
        color: "hsl(150, 60%, 45%)", // Matching Green
        attach: []
    },

    // --- CONNECTIVITY & SECURITY (The Gateways) ---
    {
        name: "SSH",
        description: "Encrypted protocol for remote server administration.",
        size: 0.6,
        color: "hsl(15, 80%, 55%)", // Security Orange
        attach: ["Arch Linux", "VPS"] // VISUAL BRIDGE
    },
    {
        name: "Cloudflare",
        description: "Edge network handling DNS, SSL termination, and DDoS protection.",
        size: 0.8,
        color: "hsl(15, 80%, 55%)", // Matching Orange
        attach: ["Nginx"]
    },
    {
        name: "Nginx",
        description: "Reverse proxy handling internal routing and load balancing.",
        size: 0.7,
        color: "hsl(15, 80%, 55%)", // Matching Orange
        attach: ["VPS"]
    },

    // --- CONTAINERIZATION (The Engine) ---
    {
        name: "Docker",
        description: "Container engine ensuring consistent, isolated deployments.",
        size: 0.9,
        color: "hsl(210, 85%, 60%)", // Docker Blue
        attach: ["VPS"]
    },
    {
        name: "Docker Registry",
        description: "Private self-hosted repository for container images.",
        size: 0.7,
        color: "hsl(260, 60%, 65%)", // Storage Purple
        attach: ["Docker", "Arch Linux"]
    },

    // --- APPLICATION LAYER (The Code) ---
    {
        name: "Nuxt",
        description: "Vue-based meta-framework for server-side rendered UIs.",
        size: 0.6,
        color: "hsl(45, 90%, 60%)", // JS Yellow
        attach: ["Docker"]
    },
    {
        name: "Node.js",
        description: "Asynchronous runtime for scalable backend services.",
        size: 0.6,
        color: "hsl(45, 90%, 60%)", // JS Yellow
        attach: ["Docker"]
    },
    {
        name: "MongoDB",
        description: "NoSQL document database for flexible data schemas.",
        size: 0.6,
        color: "hsl(260, 60%, 65%)", // Storage Purple
        attach: ["Docker"]
    },

    // --- TOOLS (The Workflow) ---
    {
        name: "Git/GitHub",
        description: "Distributed version control and CI/CD pipelines.",
        size: 0.6,
        color: "hsl(200, 20%, 40%)", // Utility Grey/Blue
        attach: ["Arch Linux", "VPS"] // VISUAL BRIDGE
    },
    {
        name: "Hyprland",
        description: "Dynamic tiling compositor for high-efficiency workflow.",
        size: 0.7,
        color: "hsl(180, 50%, 50%)", // Cyan
        attach: ["Arch Linux"]
    },
    {
        name: "VS Code",
        description: "IDE configured for TypeScript development.",
        size: 0.7,
        color: "hsl(210, 85%, 60%)", // Blue
        attach: ["Arch Linux"]
    },
]

const canvasRef = ref<HTMLCanvasElement | null>(null);
let sceneInstance: InfrastructureScene | null = null;

// 1. Create a reactive variable to hold the selected node data
const selectedNodeInfo = ref<NodeType | null>(null);

// 2. Define the callback function
const handleNodeSelection = (data: any) => {
    // Update the reactive variable
    // This automatically triggers the UI to re-render
    selectedNodeInfo.value = data;
};

onMounted(() => {
    if (canvasRef.value) {
        // 3. Pass the callback into your Scene Constructor
        sceneInstance = new InfrastructureScene(canvasRef.value, InteractableNodes, handleNodeSelection);
    }
});

onBeforeUnmount(() => {
    // Cleanup logic if your class has a dispose method
    if (sceneInstance && sceneInstance.dispose) {
        sceneInstance.dispose();
    }
});
</script>

<template>
    <div class="absolute top-0 left-0 w-full h-screen overflow-hidden">
        <canvas ref="canvasRef" class="absolute top-0 left-0"></canvas>

        <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">

            <!-- 
                 Added responsive utility classes:
                 1. w-full max-w-md px-6: Ensures width is controlled on desktop but doesn't touch edges on mobile.
                 2. bottom-8 md:bottom-12: Adjusts vertical position slightly for smaller screens.
            -->
            <div v-if="selectedNodeInfo"
                class="fixed bottom-12 md:bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 w-full max-w-md px-6">
                <div class="text-gray-200">
                    <!-- Responsive font size: text-lg on mobile, text-xl on desktop -->
                    <h3 class="text-lg md:text-xl text-white mb-1 md:mb-2 tracking-wider">
                        {{ selectedNodeInfo.name.toUpperCase() }}
                    </h3>
                    <!-- Responsive font size: text-sm on mobile, text-base on desktop -->
                    <p class="text-sm md:text-base font-light font-sans opacity-90 leading-relaxed">
                        {{ selectedNodeInfo.description }}
                    </p>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* Optional: Ensure canvas is visible */
canvas {
    width: 100%;
    height: 100vh;
    display: block;
    z-index: 0;
}
</style>