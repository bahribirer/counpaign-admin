<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const FilterMatchMode = {
    CONTAINS: 'contains'
};

interface Firm {
    _id: string;
    companyName: string;
    email: string;
    category: string;
    logo: string;
}

const router = useRouter();
const firms = ref<Firm[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const fetchFirms = async () => {
    loading.value = true;
    try {
        const response = await fetch('http://localhost:5001/api/firms');
        if (!response.ok) throw new Error('Failed to fetch firms');
        firms.value = await response.json();
    } catch (error) {
        console.error('Error fetching firms:', error);
    } finally {
        loading.value = false;
    }
};

const goToFirmCampaigns = (firm: Firm) => {
    router.push(`/manage-campaigns/${firm._id}`);
};

onMounted(fetchFirms);
</script>

<template>
    <div class="manage-campaigns">
        <div class="page-header mb-5">
            <h1 class="text-900 font-bold">Kampanya Yönetimi</h1>
            <p class="text-secondary">Kampanyalarını yönetmek istediğiniz işletmeyi seçin</p>
        </div>

        <div class="card p-0 overflow-hidden">
            <DataTable 
                v-model:filters="filters"
                :value="firms" 
                :loading="loading" 
                :paginator="true" 
                :rows="10"
                responsiveLayout="scroll"
                dataKey="_id"
                :globalFilterFields="['companyName', 'email', 'category']"
            >
                <template #header>
                    <div class="flex justify-content-end p-4">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText v-model="filters['global'].value" placeholder="İşletme Ara..." />
                        </span>
                    </div>
                </template>

                <template #empty>
                    <div class="p-4 text-center text-secondary">İşletme bulunamadı.</div>
                </template>

                <Column field="companyName" header="İşletme Adı" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="flex align-items-center gap-3">
                            <img v-if="data.logo" :src="`http://localhost:5001${data.logo}`" class="w-2rem h-2rem border-circle object-cover" />
                            <div v-else class="w-2rem h-2rem border-circle bg-primary-100 flex align-items-center justify-content-center text-primary font-bold">
                                {{ data.companyName.charAt(0) }}
                            </div>
                            <span class="font-bold">{{ data.companyName }}</span>
                        </div>
                    </template>
                </Column>
                <Column field="email" header="E-posta" sortable></Column>
                <Column field="category" header="Kategori" sortable></Column>
                <Column header="İşlemler" style="width: 200px">
                    <template #body="{ data }">
                        <Button 
                            label="Kampanyaları Yönet" 
                            icon="pi pi-ticket" 
                            text 
                            @click="goToFirmCampaigns(data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.manage-campaigns {
    padding: 0;
}
</style>
