<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    title: string;
    value: number;
    delta: number;
    previous?: number;
    icon?: string;
    color?: string; // tailwind color key: indigo, green, blue, orange, pink, teal, red, yellow
}>();

const color = computed(() => props.color || 'indigo');
const direction = computed(() => {
    if (props.delta > 0) return 'up';
    if (props.delta < 0) return 'down';
    return 'flat';
});
const arrow = computed(() => {
    if (direction.value === 'up') return 'pi pi-arrow-up';
    if (direction.value === 'down') return 'pi pi-arrow-down';
    return 'pi pi-minus';
});
const deltaClass = computed(() => {
    if (direction.value === 'up') return 'text-green-500';
    if (direction.value === 'down') return 'text-red-500';
    return 'text-500';
});
</script>

<template>
    <div class="card p-4 h-full kpi-delta-card">
        <div class="flex justify-content-between mb-3">
            <div>
                <span class="block text-500 font-medium mb-2 text-sm">{{ title }}</span>
                <div class="text-900 font-bold text-3xl">{{ value.toLocaleString('tr-TR') }}</div>
            </div>
            <div v-if="icon" class="flex align-items-center justify-content-center border-round" :class="`bg-${color}-50`" style="width:2.75rem;height:2.75rem">
                <i :class="[icon, `text-${color}-500`, 'text-xl']"></i>
            </div>
        </div>
        <div class="flex align-items-center gap-2 text-sm">
            <span :class="deltaClass" class="font-semibold flex align-items-center gap-1">
                <i :class="arrow" style="font-size:0.75rem"></i>
                {{ Math.abs(delta) }}%
            </span>
            <span class="text-500">önceki döneme göre</span>
        </div>
    </div>
</template>

<style scoped>
.card {
    border: 1px solid var(--surface-border);
    box-shadow: none !important;
}
.kpi-delta-card {
    transition: transform 0.15s ease;
}
.kpi-delta-card:hover {
    transform: translateY(-2px);
}
</style>
