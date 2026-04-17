<script setup lang="ts">
// Lightweight skeleton placeholder for KPI cards while data is loading.
</script>

<template>
    <div class="card p-4 h-full">
        <div class="flex justify-content-between mb-3">
            <div class="flex-1">
                <div class="skel skel-line w-50 mb-3"></div>
                <div class="skel skel-line lg w-30"></div>
            </div>
            <div class="skel skel-block"></div>
        </div>
        <div class="skel skel-line w-70 mt-3"></div>
    </div>
</template>

<style scoped>
.card {
    border: 1px solid var(--surface-border);
    box-shadow: none !important;
}
.skel {
    background: linear-gradient(90deg, var(--surface-200) 25%, var(--surface-100) 50%, var(--surface-200) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 6px;
}
.skel-line {
    height: 12px;
}
.skel-line.lg {
    height: 28px;
}
.skel-block {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 8px;
}
.w-30 { width: 30%; }
.w-50 { width: 50%; }
.w-70 { width: 70%; }

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
</style>
