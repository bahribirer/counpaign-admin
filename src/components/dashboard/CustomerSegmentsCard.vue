<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{ segments: { total: number; vip: number; active: number; risk: number; lost: number } | null }>();
const router = useRouter();

const total = computed(() => props.segments?.total || 0);
const pct = (v: number) => (total.value ? Math.round((v / total.value) * 100) : 0);

const items = computed(() => {
    if (!props.segments) return [];
    return [
        { key: 'vip', label: 'VIP', hint: '30 günde 5+ ziyaret', color: 'purple', icon: 'pi pi-crown', value: props.segments.vip },
        { key: 'active', label: 'Aktif', hint: '30 günde 1-4 ziyaret', color: 'green', icon: 'pi pi-check-circle', value: props.segments.active },
        { key: 'risk', label: 'Risk', hint: '30-60 gün sessiz', color: 'orange', icon: 'pi pi-exclamation-triangle', value: props.segments.risk },
        { key: 'lost', label: 'Kayıp', hint: '60G+ yok / hiç gelmedi', color: 'red', icon: 'pi pi-user-minus', value: props.segments.lost }
    ];
});
</script>

<template>
    <div class="card p-4 h-full">
        <div class="flex align-items-center justify-content-between mb-3">
            <h5 class="text-lg font-bold m-0">Müşteri Segmentleri</h5>
            <span class="text-500 text-sm">Toplam {{ total }}</span>
        </div>

        <div v-if="segments" class="grid">
            <div v-for="it in items" :key="it.key" class="col-12 md:col-6">
                <div 
                    class="segment-card p-3 cursor-pointer" 
                    :class="`segment-${it.color}`"
                    @click="router.push(`/segment-users/${it.key}`)"
                >
                    <div class="flex align-items-center gap-3">
                        <div class="icon-wrap" :class="`bg-${it.color}-100`">
                            <i :class="[it.icon, `text-${it.color}-500`]"></i>
                        </div>
                        <div class="flex-1">
                            <div class="text-500 text-xs">{{ it.hint }}</div>
                            <div class="font-bold text-lg">{{ it.label }}</div>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <div class="text-right">
                                <div class="text-2xl font-bold" :class="`text-${it.color}-500`">{{ it.value }}</div>
                                <div class="text-500 text-xs">{{ pct(it.value) }}%</div>
                            </div>
                            <i class="pi pi-chevron-right text-400 text-xs ml-1"></i>
                        </div>
                    </div>
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
.segment-card {
    border: 1px solid var(--surface-border);
    border-radius: 10px;
    transition: transform 0.15s ease, border-color 0.15s ease;
}
.segment-card:hover {
    transform: translateY(-2px);
}
.icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
}
</style>
