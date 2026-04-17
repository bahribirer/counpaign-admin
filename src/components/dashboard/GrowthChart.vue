<script setup lang="ts">
import { computed } from 'vue';
import Chart from 'primevue/chart';

const props = defineProps<{ series: any[] }>();

const chartData = computed(() => {
    if (!props.series?.length) return null;
    return {
        labels: props.series.map((s) => s.label),
        datasets: [
            {
                label: 'İşlem',
                data: props.series.map((s) => s.transactions),
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                tension: 0.35,
                fill: true,
                pointRadius: 2
            },
            {
                label: 'Yeni Kullanıcı',
                data: props.series.map((s) => s.users),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.35,
                fill: false,
                pointRadius: 2
            },
            {
                label: 'Yeni Firma',
                data: props.series.map((s) => s.firms),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.35,
                fill: false,
                pointRadius: 2
            }
        ]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
    },
    scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false } }
    }
};
</script>

<template>
    <div class="card p-4 h-full">
        <h5 class="text-lg font-bold mb-3">Büyüme Trendi</h5>
        <div style="height:280px">
            <Chart v-if="chartData" type="line" :data="chartData" :options="chartOptions" class="h-full" />
            <div v-else class="text-500 text-center p-4">Veri yok</div>
        </div>
    </div>
</template>

<style scoped>
.card {
    border: 1px solid var(--surface-border);
    box-shadow: none !important;
}
</style>
