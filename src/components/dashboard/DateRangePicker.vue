<script setup lang="ts">
import { ref, watch } from 'vue';
import SelectButton from 'primevue/selectbutton';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const value = ref(props.modelValue);
const options = [
    { label: '7 Gün', value: '7d' },
    { label: '30 Gün', value: '30d' },
    { label: '90 Gün', value: '90d' }
];

watch(value, (v) => emit('update:modelValue', v));
watch(() => props.modelValue, (v) => { value.value = v; });
</script>

<template>
    <div class="date-range-picker">
        <SelectButton v-model="value" :options="options" option-label="label" option-value="value" :allow-empty="false" />
    </div>
</template>

<style scoped>
.date-range-picker :deep(.p-selectbutton .p-button) {
    padding: 0.4rem 0.9rem;
    font-size: 0.85rem;
}
</style>
