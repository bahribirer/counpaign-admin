<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import InputSwitch from 'primevue/inputswitch';
import FileUpload from 'primevue/fileupload';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

import { useAuthStore } from '../stores/auth.store';

interface Campaign {
    _id?: string;
    businessId: string;
    title: string;
    shortDescription: string;
    content: string;
    rewardType: 'points' | 'stamp';
    rewardValue: number;
    rewardValidityDays: number;
    icon: string;
    isPromoted: boolean;
    displayOrder: number;
    startDate: Date;
    endDate: Date;
}

interface Firm {
    _id: string;
    companyName: string;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

// Reactive business ID
const businessId = ref<string | null>(null);

const resolveBusinessId = async (): Promise<string | null> => {
    // 1. Try Route Param (check if valid string)
    const routeId = route.params.businessId as string;
    if (routeId && routeId !== 'undefined' && routeId !== 'null') {
        return routeId;
    }
    
    // 2. Try Store
    if (authStore.user?.businessId) {
        return authStore.user.businessId;
    }

    // 3. Try Remote Recovery
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const res = await fetch('http://localhost:5001/api/firms/my-business', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.businessId) {
                // Determine if we should update store
                if (authStore.user) {
                    authStore.user.businessId = data.businessId;
                }
                return data.businessId;
            }
        }
    } catch (e) {
        console.error('Failed to resolve business ID', e);
    }
    
    return null;
};

const campaigns = ref<Campaign[]>([]);
const firm = ref<Firm | null>(null);
const loading = ref(true);
const campaignDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const editing = ref(false);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);

const rewardTypes = [
    { label: 'Puan', value: 'points' },
    { label: 'Damga', value: 'stamp' }
];

const icons = [
    { label: 'Yıldız', value: 'stars_rounded' },
    { label: 'Kahve', value: 'local_cafe_rounded' },
    { label: 'Dondurma', value: 'icecream_rounded' },
    { label: 'Etiket', value: 'local_offer_rounded' },
    { label: 'Hediye', value: 'card_giftcard' }
];

const emptyCampaign: Campaign = {
    businessId: '',
    title: '',
    shortDescription: '',
    content: '',
    rewardType: 'stamp',
    rewardValue: 1,
    rewardValidityDays: 30,
    icon: 'stars_rounded',
    isPromoted: false,
    displayOrder: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
};

const campaign = ref<Campaign>({ ...emptyCampaign });

const fetchFirmData = async () => {
    if (!businessId.value) return;
    try {
        const response = await fetch(`http://localhost:5001/api/firms`);
        const firms = await response.json();
        firm.value = firms.find((f: any) => f._id === businessId.value) || null;
    } catch (error) {
        console.error('Error fetching firm:', error);
    }
};

const fetchCampaigns = async () => {
    if (!businessId.value) {
        // Attempt to resolve if missing
        const resolved = await resolveBusinessId();
        if (resolved) businessId.value = resolved;
        else {
            loading.value = false;
            return;
        }
    }
    
    loading.value = true;
    try {
        const response = await fetch(`http://localhost:5001/api/campaigns/business/${businessId.value}`);
        const data = await response.json();
        campaigns.value = data.map((c: any) => ({
            ...c,
            startDate: new Date(c.startDate),
            endDate: new Date(c.endDate)
        }));
    } catch (error) {
        console.error('Error fetching campaigns:', error);
    } finally {
        loading.value = false;
    }
};

const openNew = async () => {
    // Ensure ID is ready before opening
    if (!businessId.value) {
        const resolved = await resolveBusinessId();
        if (resolved) businessId.value = resolved;
        else {
            toast.add({ severity: 'error', summary: 'Hata', detail: 'İşletme kimliği bulunamadı.', life: 3000 });
            return;
        }
    }
    
    campaign.value = { ...emptyCampaign, businessId: businessId.value! };
    selectedFile.value = null;
    previewUrl.value = null;
    submitted.value = false;
    editing.value = false;
    campaignDialog.value = true;
};

const onFileSelect = (event: any) => {
    const file = event.files[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            toast.add({ severity: 'error', summary: 'Hata', detail: 'Dosya boyutu 10MB\'dan büyük olamaz.', life: 3000 });
            selectedFile.value = null;
            return;
        }
        selectedFile.value = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewUrl.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
};

const hideDialog = () => {
    campaignDialog.value = false;
    submitted.value = false;
    previewUrl.value = null;
    selectedFile.value = null;
};

const saveCampaign = async () => {
    submitted.value = true;

    if (!campaign.value.title.trim() || !campaign.value.shortDescription.trim() || !campaign.value.content.trim() || !campaign.value.endDate) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Lütfen tüm zorunlu alanları doldurun.', life: 3000 });
        return;
    }

    if (!editing.value && !selectedFile.value) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Kampanya fotoğrafı zorunludur', life: 3000 });
        return;
    }

    try {
        if (!campaign.value) {
            throw new Error('Kampanya verisi bulunamadı.');
        }

        // Validate businessId RE-CHECK
        if (!businessId.value) {
             const resolved = await resolveBusinessId();
             if (resolved) businessId.value = resolved;
             else {
                 throw new Error('İşletme kimliği doğrulanamadı. Sayfayı yenileyip tekrar deneyin.');
             }
        }

        const formData = new FormData();
        
        // Ensure businessId is set in campaign data
        campaign.value.businessId = businessId.value;
        
        // Append JSON data as fields (Multipart compatibility)
        const currentCampaign = campaign.value;
        console.log('Sending campaign data...', currentCampaign);
        
        Object.keys(currentCampaign).forEach(key => {
            const val = (currentCampaign as any)[key];
            if (val !== undefined && val !== null) {
                if (val instanceof Date) {
                    formData.append(key, val.toISOString());
                } else {
                    formData.append(key, val.toString());
                }
            }
        });

        if (selectedFile.value) {
            formData.append('headerImage', selectedFile.value);
        }

        const method = editing.value ? 'PATCH' : 'POST';
        const url = editing.value 
            ? `http://localhost:5001/api/campaigns/${campaign.value._id}` 
            : 'http://localhost:5001/api/campaigns';

        const response = await fetch(url, {
            method,
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to save campaign');
        }

        toast.add({ severity: 'success', summary: 'Başarılı', detail: editing.value ? 'Kampanya güncellendi' : 'Kampanya oluşturuldu', life: 3000 });
        campaignDialog.value = false;
        fetchCampaigns();
    } catch (error: any) {
        console.error('Error saving campaign:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message || 'Kaydedilirken bir sorun oluştu', life: 5000 });
    }
};

const editCampaign = (c: Campaign) => {
    campaign.value = { ...c, businessId: businessId.value! }; // Ensure ID is present
    editing.value = true;
    previewUrl.value = c.headerImage ? `http://localhost:5001${c.headerImage}` : null;
    selectedFile.value = null;
    campaignDialog.value = true;
};

const confirmDeleteCampaign = (c: Campaign) => {
    campaign.value = c;
    deleteDialog.value = true;
};

const deleteCampaign = async () => {
    try {
        const response = await fetch(`http://localhost:5001/api/campaigns/${campaign.value._id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete campaign');

        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Kampanya silindi', life: 3000 });
        deleteDialog.value = false;
        fetchCampaigns();
    } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Silinirken bir sorun oluştu', life: 3000 });
    }
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR');
};

onMounted(async () => {
    const resolved = await resolveBusinessId();
    if (resolved) {
        businessId.value = resolved;
        fetchFirmData();
        fetchCampaigns();
    } else {
        console.error('Failed to resolve business ID on mount');
        toast.add({ severity: 'warn', summary: 'Uyarı', detail: 'Kullanıcı bilgileri eksik, lütfen tekrar giriş yapın', life: 5000 });
        loading.value = false;
    }
});
</script>

<template>
    <div class="firm-campaigns">
        <Toast />
        
        <div class="page-header mb-5">
            <div class="flex align-items-center gap-4 mb-3">
                <Button icon="pi pi-arrow-left" severity="secondary" rounded @click="router.push('/manage-campaigns')" />
                <h1 class="text-900 font-bold m-0">{{ firm?.companyName || 'İşletme' }}</h1>
            </div>
            <p class="text-secondary">Bu işletmeye ait kampanyaları buradan yönetebilirsiniz</p>
        </div>

        <div class="flex justify-content-end mb-4">
            <Button label="Yeni Kampanya Ekle" icon="pi pi-plus" severity="primary" @click="openNew" />
        </div>

        <div class="card p-0 overflow-hidden">
            <DataTable :value="campaigns" :loading="loading" responsiveLayout="scroll">
                <template #empty>
                    <div class="p-5 text-center text-secondary">Bu işletmeye ait henüz bir kampanya bulunmuyor.</div>
                </template>

                <Column header="Görsel" style="width: 100px">
                    <template #body="{ data }">
                        <img v-if="data.headerImage" :src="`http://localhost:5001${data.headerImage}`" class="w-4rem h-3rem border-round object-cover" />
                        <div v-else class="w-4rem h-3rem bg-gray-200 border-round flex align-items-center justify-content-center">
                            <i class="pi pi-image text-gray-400"></i>
                        </div>
                    </template>
                </Column>
                <Column field="title" header="Kampanya Başlığı" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <span class="font-bold text-900">{{ data.title }}</span>
                    </template>
                </Column>
                <Column field="rewardType" header="Ödül" sortable>
                    <template #body="{ data }">
                        <span v-if="data.rewardType === 'stamp'" class="text-primary font-bold">{{ data.rewardValue }} Damga</span>
                        <span v-else class="text-indigo-400 font-bold">{{ data.rewardValue }} Puan</span>
                    </template>
                </Column>
                <Column field="endDate" header="Bitiş Tarihi" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.endDate) }}
                    </template>
                </Column>
                <Column field="isPromoted" header="Öne Çıkar" sortable>
                    <template #body="{ data }">
                        <i class="pi" :class="data.isPromoted ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-400'" style="font-size: 1.2rem"></i>
                    </template>
                </Column>
                <Column header="İşlemler" style="width: 150px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" text rounded @click="editCampaign(data)" />
                            <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteCampaign(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Campaign Dialog -->
        <Dialog v-model:visible="campaignDialog" :style="{width: '600px'}" :header="editing ? 'Kampanya Düzenle' : 'Yeni Kampanya'" :modal="true" class="p-fluid">
            <div class="grid">
                <div class="col-12 field mb-4">
                    <label class="block font-bold mb-2">Kampanya Fotoğrafı (Zorunlu)</label>
                    <div class="flex flex-column align-items-center border-round border-1 surface-border p-4 bg-gray-50">
                        <img v-if="previewUrl" :src="previewUrl" class="w-full h-12rem object-cover border-round mb-3" />
                        <div v-else class="w-full h-12rem bg-gray-200 border-round flex align-items-center justify-content-center mb-3">
                            <i class="pi pi-image text-gray-400 text-6xl"></i>
                        </div>
                        <FileUpload 
                            mode="basic" 
                            name="headerImage" 
                            accept="image/*" 
                            :auto="false" 
                            chooseLabel="Fotoğraf Seç" 
                            class="p-button-outlined w-full" 
                            @select="onFileSelect"
                        />
                    </div>
                </div>

                <div class="col-12 field mb-4">
                    <label for="title" class="block font-bold mb-2">Başlık</label>
                    <InputText id="title" v-model="campaign.title" required autofocus :class="{'p-invalid': submitted && !campaign.title}" placeholder="Örn: 5 Alana 1 Bedava" />
                    <small class="p-error" v-if="submitted && !campaign.title">Başlık zorunludur.</small>
                </div>

                <div class="col-12 field mb-4">
                    <label for="shortDescription" class="block font-bold mb-2">Kısa Açıklama</label>
                    <InputText id="shortDescription" v-model="campaign.shortDescription" placeholder="Kart üzerinde görünecek kısa metin" />
                </div>

                <div class="col-12 field mb-4">
                    <label for="content" class="block font-bold mb-2">Detaylı İçerik</label>
                    <Textarea id="content" v-model="campaign.content" required rows="3" placeholder="Kampanya koşulları ve detayları..." />
                </div>

                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">Ödül Türü</label>
                    <Dropdown v-model="campaign.rewardType" :options="rewardTypes" optionLabel="label" optionValue="value" />
                </div>

                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">Ödül Değeri</label>
                    <InputNumber v-model="campaign.rewardValue" :min="1" />
                </div>

                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">Geçerlilik (Gün)</label>
                    <InputNumber v-model="campaign.rewardValidityDays" :min="1" suffix=" gün" />
                </div>

                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">İkon</label>
                    <Dropdown v-model="campaign.icon" :options="icons" optionLabel="label" optionValue="value" />
                </div>

                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">Bitiş Tarihi</label>
                    <Calendar v-model="campaign.endDate" dateFormat="dd.mm.yy" :minDate="new Date()" />
                </div>

                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">Sıralama</label>
                    <InputNumber v-model="campaign.displayOrder" />
                </div>

                <div class="col-12 flex align-items-center gap-3 mt-2">
                    <InputSwitch v-model="campaign.isPromoted" />
                    <span class="font-bold">Ana sayfada öne çıkar</span>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-content-end gap-2 mt-4 pt-4 border-top-1 surface-border">
                    <Button label="İptal" icon="pi pi-times" text severity="danger" @click="hideDialog" />
                    <Button label="Kaydet" icon="pi pi-check" @click="saveCampaign" />
                </div>
            </template>
        </Dialog>

        <!-- Delete Dialog -->
        <Dialog v-model:visible="deleteDialog" :style="{width: '450px'}" header="Onay" :modal="true">
            <div class="confirmation-content flex align-items-center justify-content-center py-4">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem; color: var(--red-500)" />
                <span v-if="campaign" class="text-xl">Bu kampanyayı silmek istediğinizden emin misiniz? <br><b class="text-900">{{campaign.title}}</b></span>
            </div>
            <template #footer>
                <div class="flex justify-content-center gap-2">
                    <Button label="Hayır" icon="pi pi-times" text @click="deleteDialog = false" />
                    <Button label="Evet, Sil" icon="pi pi-check" severity="danger" @click="deleteCampaign" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.firm-campaigns {
    padding: 0;
}
</style>
