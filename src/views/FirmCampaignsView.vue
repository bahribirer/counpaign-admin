<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import ToggleSwitch from 'primevue/toggleswitch';
import FileUpload from 'primevue/fileupload';
import MultiSelect from 'primevue/multiselect';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

import { useAuthStore } from '../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL;

interface MenuItem {
    productId: string;
    productName: string;
    price: number;
}

interface Campaign {
    _id?: string;
    businessId: string;
    title: string;
    shortDescription: string;
    content: string;
    icon: string;
    isPromoted: boolean;
    headerImage?: string;
    displayOrder: number;
    startDate: Date;
    endDate: Date;
    menuItems: MenuItem[];
    discountAmount: number;
    reflectToMenu: boolean;
    bundleName: string;
}

interface Firm {
    _id: string;
    companyName: string;
}

interface ProductOption {
    _id: string;
    name: string;
    price: number;
    category: string;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const businessId = ref<string | null>(null);

const resolveBusinessId = async (): Promise<string | null> => {
    const routeId = route.params.businessId as string;
    if (routeId && routeId !== 'undefined' && routeId !== 'null') return routeId;
    if (authStore.user?.businessId) return authStore.user.businessId;
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const res = await fetch(`${API_URL}/firms/my-business`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.businessId) {
                if (authStore.user) authStore.user.businessId = data.businessId;
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
const businessProducts = ref<ProductOption[]>([]);
const selectedProducts = ref<ProductOption[]>([]);

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
    icon: 'stars_rounded',
    isPromoted: false,
    displayOrder: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    menuItems: [],
    discountAmount: 0,
    reflectToMenu: false,
    bundleName: ''
};

const campaign = ref<Campaign>({ ...emptyCampaign });

// Computed: total price of selected menu items
const bundleTotalPrice = computed(() => {
    return selectedProducts.value.reduce((sum, p) => sum + p.price, 0);
});

// Computed: discounted price
const bundleDiscountedPrice = computed(() => {
    return Math.max(0, bundleTotalPrice.value - (campaign.value.discountAmount || 0));
});

// Auto-generate bundle name from selected products
const autoBundleName = computed(() => {
    return selectedProducts.value.map(p => p.name).join(' + ');
});

const fetchFirmData = async () => {
    if (!businessId.value) return;
    try {
        const response = await fetch(`${API_URL}/firms`);
        const firms = await response.json();
        firm.value = firms.find((f: any) => f._id === businessId.value) || null;
    } catch (error) {
        console.error('Error fetching firm:', error);
    }
};

const fetchBusinessProducts = async () => {
    if (!businessId.value) return;
    try {
        const response = await fetch(`${API_URL}/products/${businessId.value}`);
        if (response.ok) {
            const data = await response.json();
            // Filter out "Fırsatlar" category (those are auto-generated)
            businessProducts.value = data.filter((p: any) => p.category !== 'Fırsatlar');
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
};

const fetchCampaigns = async () => {
    if (!businessId.value) {
        const resolved = await resolveBusinessId();
        if (resolved) businessId.value = resolved;
        else { loading.value = false; return; }
    }
    loading.value = true;
    try {
        const response = await fetch(`${API_URL}/campaigns/business/${businessId.value}`);
        const data = await response.json();
        campaigns.value = data.map((c: any) => ({
            ...c,
            startDate: new Date(c.startDate),
            endDate: new Date(c.endDate),
            menuItems: c.menuItems || [],
            discountAmount: c.discountAmount || 0,
            reflectToMenu: c.reflectToMenu || false,
            bundleName: c.bundleName || ''
        }));
    } catch (error) {
        console.error('Error fetching campaigns:', error);
    } finally {
        loading.value = false;
    }
};

const openNew = async () => {
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
    selectedProducts.value = [];
    submitted.value = false;
    editing.value = false;
    campaignDialog.value = true;
};

const onFileSelect = async (event: any) => {
    const file = event.files[0];
    if (file) {
        try {
            const compressedFile = await compressImage(file);
            selectedFile.value = compressedFile;
            const reader = new FileReader();
            reader.onload = (e) => { previewUrl.value = e.target?.result as string; };
            reader.readAsDataURL(compressedFile);
        } catch (e) {
            console.error("Compression failed", e);
            toast.add({ severity: 'error', summary: 'Hata', detail: 'Resim işlenirken hata oluştu.', life: 3000 });
            selectedFile.value = null;
        }
    }
};

const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(newFile);
                    } else { reject(new Error('Canvas to Blob failed')); }
                }, 'image/jpeg', 0.7);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
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
        if (!businessId.value) {
             const resolved = await resolveBusinessId();
             if (resolved) businessId.value = resolved;
             else throw new Error('İşletme kimliği doğrulanamadı.');
        }

        const formData = new FormData();
        campaign.value.businessId = businessId.value;

        // Build menuItems from selected products
        const menuItems = selectedProducts.value.map(p => ({
            productId: p._id,
            productName: p.name,
            price: p.price
        }));

        // Auto-set bundle name if empty
        if (!campaign.value.bundleName && menuItems.length > 0) {
            campaign.value.bundleName = autoBundleName.value;
        }

        // Append all fields
        formData.append('businessId', campaign.value.businessId);
        formData.append('title', campaign.value.title);
        formData.append('shortDescription', campaign.value.shortDescription);
        formData.append('content', campaign.value.content);
        formData.append('icon', campaign.value.icon);
        formData.append('isPromoted', String(campaign.value.isPromoted));
        formData.append('displayOrder', String(campaign.value.displayOrder));
        formData.append('startDate', campaign.value.startDate instanceof Date ? campaign.value.startDate.toISOString() : String(campaign.value.startDate));
        formData.append('endDate', campaign.value.endDate instanceof Date ? campaign.value.endDate.toISOString() : String(campaign.value.endDate));
        formData.append('menuItems', JSON.stringify(menuItems));
        formData.append('discountAmount', String(campaign.value.discountAmount || 0));
        formData.append('reflectToMenu', String(campaign.value.reflectToMenu));
        formData.append('bundleName', campaign.value.bundleName || '');

        if (selectedFile.value) {
            formData.append('headerImage', selectedFile.value);
        }

        const method = editing.value ? 'PATCH' : 'POST';
        const url = editing.value 
            ? `${API_URL}/campaigns/${campaign.value._id}` 
            : `${API_URL}/campaigns`;

        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url, { method, headers, body: formData });
        const result = await response.json();

        if (!response.ok) throw new Error(result.message || result.error || 'Failed to save campaign');

        toast.add({ severity: 'success', summary: 'Başarılı', detail: editing.value ? 'Kampanya güncellendi' : 'Kampanya oluşturuldu', life: 3000 });
        campaignDialog.value = false;
        fetchCampaigns();
    } catch (error: any) {
        console.error('Error saving campaign:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message || 'Kaydedilirken bir sorun oluştu', life: 5000 });
    }
};

const editCampaign = (c: Campaign) => {
    campaign.value = { ...c, businessId: businessId.value! };
    editing.value = true;
    previewUrl.value = c.headerImage ? `${API_URL.replace('/api', '')}${c.headerImage}` : null;
    selectedFile.value = null;
    
    // Restore selected products from menuItems
    selectedProducts.value = (c.menuItems || []).map(item => ({
        _id: item.productId,
        name: item.productName,
        price: item.price,
        category: ''
    }));
    
    campaignDialog.value = true;
};

const confirmDeleteCampaign = (c: Campaign) => {
    campaign.value = c;
    deleteDialog.value = true;
};

const deleteCampaign = async () => {
    try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/campaigns/${campaign.value._id}`, {
            method: 'DELETE', headers
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

const formatDate = (date: Date) => date.toLocaleDateString('tr-TR');



onMounted(async () => {
    const resolved = await resolveBusinessId();
    if (resolved) {
        businessId.value = resolved;
        fetchFirmData();
        fetchCampaigns();
        fetchBusinessProducts();
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
                <Button icon="pi pi-arrow-left" severity="secondary" rounded @click="router.push(authStore.user?.role === 'super_admin' ? '/manage-campaigns' : '/dashboard')" />
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
                        <img v-if="data.headerImage" :src="`${API_URL.replace('/api', '')}${data.headerImage}`" class="w-4rem h-3rem border-round object-cover" />
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
                <Column header="Menü" style="width: 120px">
                    <template #body="{ data }">
                        <span v-if="data.reflectToMenu" class="text-green-500 font-bold">
                            <i class="pi pi-check-circle mr-1"></i>Aktif
                        </span>
                        <span v-else class="text-500">—</span>
                    </template>
                </Column>
                <Column header="İndirim" style="width: 120px">
                    <template #body="{ data }">
                        <span v-if="data.discountAmount > 0" class="text-orange-500 font-bold">₺{{ data.discountAmount }}</span>
                        <span v-else class="text-500">—</span>
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
        <Dialog v-model:visible="campaignDialog" :style="{width: '700px'}" :header="editing ? 'Kampanya Düzenle' : 'Yeni Kampanya'" :modal="true" class="p-fluid">
            <div class="grid">
                <!-- Photo Upload -->
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

                <!-- Title -->
                <div class="col-12 field mb-4">
                    <label for="title" class="block font-bold mb-2">Başlık</label>
                    <InputText id="title" v-model="campaign.title" required autofocus :class="{'p-invalid': submitted && !campaign.title}" placeholder="Örn: Tatlı Alana Çay Hediye" />
                    <small class="p-error" v-if="submitted && !campaign.title">Başlık zorunludur.</small>
                </div>

                <!-- Short Description -->
                <div class="col-12 field mb-4">
                    <label for="shortDescription" class="block font-bold mb-2">Kısa Açıklama</label>
                    <InputText id="shortDescription" v-model="campaign.shortDescription" placeholder="Kart üzerinde görünecek kısa metin" />
                </div>

                <!-- Content -->
                <div class="col-12 field mb-4">
                    <label for="content" class="block font-bold mb-2">Detaylı İçerik</label>
                    <Textarea id="content" v-model="campaign.content" required rows="3" placeholder="Kampanya koşulları ve detayları..." />
                </div>

                <!-- Menu Integration Section -->
                <div class="col-12">
                    <div class="border-round border-1 surface-border p-4 mb-4" style="background: var(--surface-50);">
                        <h3 class="mt-0 mb-3 text-primary">
                            <i class="pi pi-shopping-cart mr-2"></i>Menü Entegrasyonu
                        </h3>

                        <!-- Product Multi-Select -->
                        <div class="field mb-4">
                            <label class="block font-bold mb-2">Menü Ürünleri Seç</label>
                            <MultiSelect 
                                v-model="selectedProducts" 
                                :options="businessProducts" 
                                optionLabel="name"
                                dataKey="_id"
                                placeholder="Kampanyaya dahil ürünleri seçin"
                                :filter="true"
                                filterPlaceholder="Ürün ara..."
                                display="chip"
                                class="w-full"
                            >
                                <template #option="slotProps">
                                    <div class="flex justify-content-between align-items-center w-full">
                                        <span>{{ slotProps.option.name }}</span>
                                        <span class="text-500 ml-2">₺{{ slotProps.option.price }}</span>
                                    </div>
                                </template>
                            </MultiSelect>
                        </div>

                        <!-- Bundle Name -->
                        <div class="field mb-4" v-if="selectedProducts.length > 0">
                            <label class="block font-bold mb-2">Paket Adı</label>
                            <InputText v-model="campaign.bundleName" :placeholder="autoBundleName" />
                            <small class="text-500">Boş bırakırsanız otomatik oluşturulur: {{ autoBundleName }}</small>
                        </div>

                        <!-- Discount Amount -->
                        <div class="field mb-4" v-if="selectedProducts.length > 0">
                            <label class="block font-bold mb-2">İndirim Tutarı (₺)</label>
                            <InputNumber v-model="campaign.discountAmount" :min="0" :max="bundleTotalPrice" suffix=" ₺" />
                        </div>

                        <!-- Price Preview -->
                        <div class="field mb-4" v-if="selectedProducts.length > 0">
                            <div class="border-round p-3 flex align-items-center gap-3" style="background: var(--surface-0);">
                                <div>
                                    <span class="text-500 text-sm block mb-1">Menüde Görünüm:</span>
                                    <div class="flex align-items-center gap-2">
                                        <span class="font-bold text-xl text-primary">₺{{ bundleDiscountedPrice }}</span>
                                        <span v-if="campaign.discountAmount > 0" class="line-through text-500">₺{{ bundleTotalPrice }}</span>
                                        <span v-if="campaign.discountAmount > 0 && bundleTotalPrice > 0" class="text-orange-500 font-bold text-sm">
                                            %{{ Math.round((campaign.discountAmount / bundleTotalPrice) * 100) }} İNDİRİM
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Reflect to Menu Toggle -->
                        <div class="flex align-items-center gap-3" v-if="selectedProducts.length > 0">
                            <ToggleSwitch v-model="campaign.reflectToMenu" />
                            <div>
                                <span class="font-bold">Menüye Yansıt</span>
                                <small class="block text-500">Aktif olursa menünün "Fırsatlar" bölümünde görünür</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Icon -->
                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">İkon</label>
                    <Select v-model="campaign.icon" :options="icons" optionLabel="label" optionValue="value" />
                </div>

                <!-- End Date -->
                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">Bitiş Tarihi</label>
                    <DatePicker v-model="campaign.endDate" dateFormat="dd.mm.yy" :minDate="new Date()" />
                </div>

                <!-- Display Order -->
                <div class="col-12 md:col-6 field mb-4">
                    <label class="block font-bold mb-2">Sıralama</label>
                    <InputNumber v-model="campaign.displayOrder" />
                </div>

                <!-- Promoted Toggle -->
                <div class="col-12 md:col-6 flex align-items-center gap-3 mt-2">
                    <ToggleSwitch v-model="campaign.isPromoted" />
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
