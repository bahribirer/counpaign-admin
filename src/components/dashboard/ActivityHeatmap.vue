<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ data: { dayLabels: string[]; grid: number[][] } | null }>();
const emit = defineEmits<{ (e: 'cell-click', payload: { day: string; dayIndex: number; hour: number; count: number }): void }>();

const onCellClick = (di: number, hi: number, count: number) => {
    if (count === 0 || !props.data) return;
    const day = props.data.dayLabels[di] || 'Bilinmiyor';
    emit('cell-click', { day, dayIndex: di, hour: hi, count });
};
// Find max value for scaling
const maxValue = computed(() => {
    if (!props.data?.grid) return 0;
    let max = 0;
    for (const row of props.data.grid) {
        for (const v of row) {
            if (v > max) max = v;
        }
    }
    return max;
});

const cellColor = (v: number) => {
    if (!maxValue.value || v === 0) return 'rgba(99, 102, 241, 0.04)';
    const ratio = v / maxValue.value;
    // Indigo with opacity
    const opacity = 0.1 + ratio * 0.85;
    return `rgba(99, 102, 241, ${opacity})`;
};

const hourLabels = computed(() => {
    const arr = [];
    for (let h = 0; h < 24; h++) arr.push(h);
    return arr;
});
const peak = computed(() => {
    if (!props.data?.grid) return null;
    let best = { day: '', hour: 0, count: 0 };
    props.data.grid.forEach((row, di) => {
        row.forEach((v, hi) => {
            if (v > best.count) {
                const day = props.data?.dayLabels[di] || 'Bilinmiyor';
                best = { day, hour: hi, count: v };
            }
        });
    });
    return best.count > 0 ? best : null;
});
</script>

<template>
    <div class="card p-4 h-full">
        <div class="flex align-items-center justify-content-between mb-3">
            <div>
                <h5 class="text-lg font-bold m-0">Yoğunluk Haritası</h5>
                <span class="text-500 text-xs">Gün × Saat — işlem yoğunluğu</span>
            </div>
            <div v-if="peak" class="text-right">
                <div class="text-xs text-500">En yoğun</div>
                <div class="font-semibold text-sm">{{ peak.day }} {{ peak.hour }}:00</div>
            </div>
        </div>

        <div v-if="data" class="heatmap-wrapper">
            <div class="heatmap">
                <!-- Header: hour labels -->
                <div class="heatmap-row header">
                    <div class="day-label"></div>
                    <div v-for="h in hourLabels" :key="h" class="hour-label">
                        {{ h % 3 === 0 ? h : '' }}
                    </div>
                </div>
                <!-- Rows: per day -->
                <div v-for="(row, di) in data.grid" :key="di" class="heatmap-row">
                    <div class="day-label">{{ data.dayLabels[di] }}</div>
                    <div
                        v-for="(v, hi) in row"
                        :key="hi"
                        class="cell"
                        :class="{ clickable: v > 0 }"
                        :style="{ background: cellColor(v) }"
                        :title="`${data.dayLabels[di]} ${hi}:00 — ${v} işlem`"
                        @click="onCellClick(di, hi, v)"
                    >
                        <span v-if="v > 0 && v === maxValue" class="cell-value">{{ v }}</span>
                    </div>
                </div>
            </div>

            <!-- Legend -->
            <div class="flex align-items-center gap-2 mt-3 justify-content-end">
                <span class="text-xs text-500">Az</span>
                <div class="legend-gradient"></div>
                <span class="text-xs text-500">Çok</span>
            </div>
        </div>
        <div v-else class="text-500 text-center p-4">Yükleniyor...</div>
    </div>
</template>

<style scoped>
.card {
    border: 1px solid var(--surface-border);
    box-shadow: none !important;
}
.heatmap-wrapper {
    overflow-x: auto;
}
.heatmap {
    min-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.heatmap-row {
    display: grid;
    grid-template-columns: 32px repeat(24, 1fr);
    gap: 2px;
    align-items: center;
}
.day-label {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    text-align: right;
    padding-right: 4px;
}
.hour-label {
    font-size: 0.65rem;
    color: var(--text-color-secondary);
    text-align: center;
    height: 14px;
}
.cell {
    aspect-ratio: 1 / 1;
    border-radius: 3px;
    min-height: 18px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.1s ease, outline 0.1s ease;
}
.cell.clickable {
    cursor: pointer;
}
.cell.clickable:hover {
    transform: scale(1.15);
    outline: 2px solid rgba(99, 102, 241, 0.6);
    z-index: 2;
}
.cell-value {
    font-size: 0.55rem;
    color: white;
    font-weight: 700;
}
.legend-gradient {
    width: 120px;
    height: 10px;
    border-radius: 4px;
    background: linear-gradient(to right, rgba(99, 102, 241, 0.04), rgba(99, 102, 241, 0.95));
}
</style>
