<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ health: { total: number; active: number; atRisk: number; dormant: number } | null }>();

const total = computed(() => props.health?.total || 0);
const pct = (v: number) => (total.value ? Math.round((v / total.value) * 100) : 0);
</script>

<template>
    <div class="card p-4 h-full">
        <div class="flex align-items-center justify-content-between mb-3">
            <h5 class="text-lg font-bold m-0">Firma Sağlığı</h5>
            <span class="text-500 text-sm">Toplam {{ total }}</span>
        </div>

        <div v-if="health" class="flex flex-column gap-3">
            <!-- Active -->
            <div>
                <div class="flex justify-content-between align-items-center mb-1">
                    <span class="text-sm font-medium">
                        <i class="pi pi-circle-fill text-green-500 mr-2" style="font-size:0.6rem"></i>
                        Aktif (7G)
                    </span>
                    <span class="font-bold">{{ health.active }} <span class="text-500 text-xs">({{ pct(health.active) }}%)</span></span>
                </div>
                <div class="progress">
                    <div class="progress-bar bg-green-500" :style="{ width: pct(health.active) + '%' }"></div>
                </div>
            </div>

            <!-- At Risk -->
            <div>
                <div class="flex justify-content-between align-items-center mb-1">
                    <span class="text-sm font-medium">
                        <i class="pi pi-circle-fill text-orange-400 mr-2" style="font-size:0.6rem"></i>
                        Risk altında (7-30G)
                    </span>
                    <span class="font-bold">{{ health.atRisk }} <span class="text-500 text-xs">({{ pct(health.atRisk) }}%)</span></span>
                </div>
                <div class="progress">
                    <div class="progress-bar bg-orange-400" :style="{ width: pct(health.atRisk) + '%' }"></div>
                </div>
            </div>

            <!-- Dormant -->
            <div>
                <div class="flex justify-content-between align-items-center mb-1">
                    <span class="text-sm font-medium">
                        <i class="pi pi-circle-fill text-red-500 mr-2" style="font-size:0.6rem"></i>
                        Pasif (30G+)
                    </span>
                    <span class="font-bold">{{ health.dormant }} <span class="text-500 text-xs">({{ pct(health.dormant) }}%)</span></span>
                </div>
                <div class="progress">
                    <div class="progress-bar bg-red-500" :style="{ width: pct(health.dormant) + '%' }"></div>
                </div>
            </div>
        </div>
        <div v-else class="text-500 text-center p-3">Yükleniyor...</div>
    </div>
</template>

<style scoped>
.card {
    border: 1px solid var(--surface-border);
    box-shadow: none !important;
}
.progress {
    height: 8px;
    background: var(--surface-200);
    border-radius: 6px;
    overflow: hidden;
}
.progress-bar {
    height: 100%;
    transition: width 0.3s ease;
}
</style>
