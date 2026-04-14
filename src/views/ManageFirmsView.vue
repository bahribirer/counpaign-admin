<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import QRCode from 'qrcode';
import { getDistrictNames, getNeighborhoods } from '../data/locations';

interface Firm {
    _id: string;
    companyName: string;
    email: string;
    category: string;
    cardColor: string;
    cardIcon: string;
    city: string;
    district: string;
    neighborhood: string;
    staticQR: string | null;
    createdAt: string;
    logo: string | null;
    settings?: {
        stampsTarget?: number;
        pointsPerVisit?: number;
        redemptionThreshold?: number;
        pointsPercentage?: number;
    };
}

const toast = useToast();
const firms = ref<Firm[]>([]);
const loading = ref(true);
const deleteDialog = ref(false);
const firmToDelete = ref<Firm | null>(null);
const deleting = ref(false);

// Super admin check
const isSuperAdmin = computed(() => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            return user.role === 'super_admin';
        }
    } catch {}
    return false;
});

// Edit State
const editDialog = ref(false);
const editingFirm = ref<Firm | null>(null);
const editForm = ref({
    companyName: '',
    email: '',
    password: '',
    category: '',
    cardColor: '',
    cardIcon: '',
    district: '',
    neighborhood: '',
    stampsTarget: 6,
    logo: null as File | null
});
const editDistricts = ref(getDistrictNames());
const editNeighborhoods = ref<string[]>([]);
const saving = ref(false);

// Notification State
const selectedFirms = ref<Firm[]>([]);
const notificationDialog = ref(false);
const notificationMessage = ref('');
const sendingNotification = ref(false);

const API_URL = import.meta.env.VITE_API_URL;

// QR State
const qrDialog = ref(false);
const qrDataUrl = ref('');
const qrFirmName = ref('');
const generatingQR = ref<string | null>(null);

const resolveImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    const base = API_URL.replace('/api', '').replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
};

const showQR = async (firm: Firm) => {
    if (!firm.staticQR) return;
    try {
        qrFirmName.value = firm.companyName;
        qrDataUrl.value = await QRCode.toDataURL(firm.staticQR, {
            width: 400,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
        });
        qrDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'QR oluşturulamadı', life: 3000 });
    }
};

const generateQR = async (firm: Firm) => {
    generatingQR.value = firm._id;
    try {
        const response = await fetch(`${API_URL}/firms/${firm._id}/generate-qr`, {
            method: 'POST'
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'QR oluşturulamadı');

        // Update local data
        const idx = firms.value.findIndex(f => f._id === firm._id);
        if (idx !== -1) firms.value[idx]!.staticQR = data.staticQR;

        toast.add({ severity: 'success', summary: 'Başarılı', detail: `${firm.companyName} için QR oluşturuldu`, life: 3000 });

        // Show the generated QR
        qrFirmName.value = firm.companyName;
        qrDataUrl.value = await QRCode.toDataURL(data.staticQR, {
            width: 400,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
        });
        qrDialog.value = true;
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
    } finally {
        generatingQR.value = null;
    }
};

const fetchFirms = async () => {
    loading.value = true;
    try {
        const response = await fetch(`${API_URL}/firms`);
        if (!response.ok) throw new Error('Failed to fetch firms');
        firms.value = await response.json();
    } catch (error) {
        console.error('Error fetching firms:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Firmalar yüklenemedi', life: 3000 });
    } finally {
        loading.value = false;
    }
};



const openNotificationDialog = () => {
    notificationMessage.value = '';
    notificationDialog.value = true;
};

const sendBulkNotification = async () => {
    if (!notificationMessage.value.trim()) {
        toast.add({ severity: 'warn', summary: 'Uyarı', detail: 'Lütfen bir mesaj giriniz.', life: 3000 });
        return;
    }

    sendingNotification.value = true;
    try {
        const token = localStorage.getItem('token');
        const businessIds = selectedFirms.value.map(f => f._id);

        const response = await fetch(`${API_URL}/notifications/send-business`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                businessIds,
                title: 'Sistem Bildirimi',
                body: notificationMessage.value
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Bildirim gönderilemedi.');
        
        toast.add({ severity: 'success', summary: 'Başarılı', detail: data.message, life: 3000 });
        notificationDialog.value = false;
        selectedFirms.value = []; // Clear selection
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message || 'Bildirim gönderilemedi.', life: 3000 });
    } finally {
        sendingNotification.value = false;
    }
};

// Edit Functions
const openEditDialog = (firm: Firm) => {
    editingFirm.value = firm;
    editForm.value = {
        companyName: firm.companyName,
        email: firm.email,
        password: '',
        category: firm.category || 'Kafe',
        cardColor: firm.cardColor || '#EE2C2C',
        cardIcon: firm.cardIcon || 'local_cafe_rounded',
        district: firm.district || '',
        neighborhood: firm.neighborhood || '',
        stampsTarget: firm.settings?.stampsTarget || 6,
        logo: null
    };
    editNeighborhoods.value = firm.district ? getNeighborhoods(firm.district) : [];
    editDialog.value = true;
};

const onEditDistrictChange = () => {
    editForm.value.neighborhood = '';
    editNeighborhoods.value = getNeighborhoods(editForm.value.district);
};

const handleEditFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        try {
            const compressedFile = await compressImage(target.files[0]);
            editForm.value.logo = compressedFile;
        } catch (e) {
            toast.add({ severity: 'error', summary: 'Hata', detail: 'Resim işlenirken hata oluştu', life: 3000 });
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
                const MAX = 800;
                let width = img.width, height = img.height;
                if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
                else { if (height > MAX) { width *= MAX / height; height = MAX; } }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
                    else reject(new Error('Blob failed'));
                }, 'image/jpeg', 0.7);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

const saveFirmEdit = async () => {
    if (!editingFirm.value) return;
    saving.value = true;
    try {
        const token = localStorage.getItem('token');
        let response: Response;

        const bodyData: Record<string, any> = {
            companyName: editForm.value.companyName,
            email: editForm.value.email,
            category: editForm.value.category,
            cardColor: editForm.value.cardColor,
            cardIcon: editForm.value.cardIcon,
            city: 'Ankara',
            district: editForm.value.district,
            neighborhood: editForm.value.neighborhood,
            settings: { stampsTarget: editForm.value.stampsTarget }
        };
        // Only send password if changed
        if (editForm.value.password.trim()) {
            bodyData.password = editForm.value.password;
        }

        // If logo is being changed, use FormData
        if (editForm.value.logo) {
            const submitData = new FormData();
            Object.entries(bodyData).forEach(([key, val]) => {
                submitData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
            });
            submitData.append('logo', editForm.value.logo);

            response = await fetch(`${API_URL}/firms/${editingFirm.value._id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: submitData
            });
        } else {
            // No logo change, send JSON
            response = await fetch(`${API_URL}/firms/${editingFirm.value._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });
        }

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Firma güncellenemedi');
        }

        toast.add({ severity: 'success', summary: 'Başarılı', detail: `${editForm.value.companyName} güncellendi`, life: 3000 });
        editDialog.value = false;
        await fetchFirms(); // Refresh list
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
    } finally {
        saving.value = false;
    }
};

const confirmDelete = (firm: Firm) => {
    firmToDelete.value = firm;
    deleteDialog.value = true;
};

const deleteFirm = async () => {
    if (!firmToDelete.value) return;

    deleting.value = true;
    try {
        const response = await fetch(`${API_URL}/firms/${firmToDelete.value._id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete firm');

        await response.json();
        toast.add({ severity: 'success', summary: 'Başarılı', detail: `${firmToDelete.value.companyName} silindi`, life: 3000 });
        
        // Remove from local list
        firms.value = firms.value.filter(f => f._id !== firmToDelete.value?._id);
        deleteDialog.value = false;
        firmToDelete.value = null;
    } catch (error) {
        console.error('Error deleting firm:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Firma silinemedi', life: 3000 });
    } finally {
        deleting.value = false;
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

onMounted(() => {
    fetchFirms();
});
</script>

<template>
    <div class="firms-management">
        <Toast />
        
        <div class="page-header">
            <h1>Firma Yönetimi</h1>
            <p class="text-secondary">Tüm firmaları görüntüle ve yönet</p>
        </div>

        <div class="card">

            <DataTable 
                v-model:selection="selectedFirms"
                :value="firms" 
                :loading="loading"
                :paginator="true" 
                :rows="10"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                dataKey="_id"
                filterDisplay="row"
                responsiveLayout="scroll"
                class="p-datatable-firms"
            >
                <template #header>
                    <div class="flex justify-content-between align-items-center">
                        <div class="flex align-items-center gap-2">
                             <Button 
                                v-if="selectedFirms.length > 0"
                                :label="`Bildirim Gönder (${selectedFirms.length})`" 
                                icon="pi pi-bell" 
                                severity="warning" 
                                @click="openNotificationDialog"
                            />
                        </div>
                    </div>
                </template>
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-building" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                        <p>Henüz firma bulunmuyor</p>
                    </div>
                </template>

                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                <Column field="companyName" header="Firma Adı" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="firm-name-cell">
                             <img v-if="data.logo" :src="resolveImageUrl(data.logo)" class="w-2rem h-2rem border-circle object-cover shadow-1" />
                             <div 
                                v-else
                                class="color-indicator" 
                                :style="{ backgroundColor: data.cardColor || '#EE2C2C' }"
                            ></div>
                            <span class="font-semibold">{{ data.companyName }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="email" header="E-posta" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <span class="text-secondary">{{ data.email }}</span>
                    </template>
                </Column>

                <Column field="category" header="Kategori" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <Tag :value="data.category || 'Cafe'" severity="info" />
                    </template>
                </Column>

                <Column field="district" header="Konum" sortable style="min-width: 180px">
                    <template #body="{ data }">
                        <span>{{ data.district }}, {{ data.neighborhood }}</span>
                    </template>
                </Column>

                <Column field="createdAt" header="Oluşturulma" sortable style="min-width: 150px">
                    <template #body="{ data }">
                        <span class="text-secondary">{{ formatDate(data.createdAt) }}</span>
                    </template>
                </Column>

                <Column header="QR" style="min-width: 120px">
                    <template #body="{ data }">
                        <Button 
                            v-if="data.staticQR"
                            icon="pi pi-qrcode" 
                            severity="success" 
                            text 
                            rounded 
                            @click="showQR(data)"
                            v-tooltip.top="'QR Göster'"
                        />
                        <Button 
                            v-else
                            icon="pi pi-plus-circle" 
                            severity="warning" 
                            text 
                            rounded 
                            @click="generateQR(data)"
                            :loading="generatingQR === data._id"
                            v-tooltip.top="'QR Oluştur'"
                        />
                    </template>
                </Column>

                <Column header="İşlemler" style="min-width: 140px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button
                                v-if="isSuperAdmin"
                                icon="pi pi-pencil"
                                severity="info"
                                text
                                rounded
                                @click="openEditDialog(data)"
                                v-tooltip.top="'Firmayı Düzenle'"
                            />
                            <Button
                                icon="pi pi-trash"
                                severity="danger"
                                text
                                rounded
                                @click="confirmDelete(data)"
                                v-tooltip.top="'Firmayı Sil'"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Delete Confirmation Dialog -->
        <Dialog 
            v-model:visible="deleteDialog" 
            :style="{ width: '450px' }" 
            header="Firma Silme Onayı" 
            :modal="true"
            class="delete-dialog"
        >
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--red-500);"></i>
                <div class="confirmation-text">
                    <p>Bu firmayı silmek istediğinizden emin misiniz?</p>
                    <p class="font-bold">{{ firmToDelete?.companyName }}</p>
                    <p class="text-secondary text-sm">Bu işlem geri alınamaz!</p>
                </div>
            </div>
            <template #footer>
                <Button 
                    label="İptal" 
                    icon="pi pi-times" 
                    @click="deleteDialog = false" 
                    text 
                    :disabled="deleting"
                />
                <Button 
                    label="Sil" 
                    icon="pi pi-trash" 
                    severity="danger" 
                    @click="deleteFirm" 
                    :loading="deleting"
                />
            </template>
        </Dialog>


        <!-- Notification Dialog -->
        <Dialog v-model:visible="notificationDialog" header="Firma Bildirimi Gönder" :style="{ width: '500px' }" modal>
            <div class="flex flex-column gap-3">
                <span class="text-secondary block">
                    Seçili <strong>{{ selectedFirms.length }}</strong> firmaya bildirim gönderilecek.
                </span>
                <div class="flex flex-column gap-2">
                    <label for="message" class="font-bold">Mesaj İçeriği</label>
                    <Textarea id="message" v-model="notificationMessage" rows="5" placeholder="Firma panellerine düşecek mesaj..." autoResize />
                </div>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="notificationDialog = false" :disabled="sendingNotification" />
                <Button label="Gönder" icon="pi pi-send" severity="warning" @click="sendBulkNotification" :loading="sendingNotification" />
            </template>
        </Dialog>

        <!-- Edit Firm Dialog (Super Admin Only) -->
        <Dialog
            v-model:visible="editDialog"
            :style="{ width: '600px' }"
            header="Firma Düzenle"
            :modal="true"
            class="edit-dialog"
        >
            <div class="flex flex-column gap-3 p-2">
                <!-- Temel Bilgiler -->
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">Temel Bilgiler</h3>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Firma İsmi *</label>
                    <InputText v-model="editForm.companyName" placeholder="Örn: Kahve Diyarı" />
                </div>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">E-posta *</label>
                    <InputText v-model="editForm.email" type="email" placeholder="info@firma.com" />
                </div>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Şifre</label>
                    <InputText v-model="editForm.password" type="password" placeholder="Değiştirmek için yeni şifre girin" />
                    <small class="text-secondary">Boş bırakırsanız mevcut şifre korunur</small>
                </div>

                <!-- Firma Ayarları -->
                <h3 style="margin: 0.5rem 0 0 0; font-size: 1.1rem; font-weight: 600; border-top: 1px solid var(--surface-border); padding-top: 1rem;">Firma Ayarları</h3>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Kategori</label>
                    <InputText v-model="editForm.category" disabled class="locked-field" />
                    <small class="text-secondary">Bu alan kilitlidir</small>
                </div>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Logo</label>
                    <input
                        type="file"
                        @change="handleEditFileChange"
                        accept="image/*"
                        class="file-input"
                    />
                    <small class="text-secondary">Değiştirmek istemiyorsanız boş bırakın (PNG, JPG)</small>
                </div>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Firma Rengi *</label>
                    <div class="flex align-items-center gap-2">
                        <input type="color" v-model="editForm.cardColor" style="width: 60px; height: 40px; border: 1px solid var(--surface-border); border-radius: 6px; cursor: pointer;" />
                        <InputText v-model="editForm.cardColor" placeholder="#FF5733" style="flex: 1;" />
                    </div>
                    <small class="text-secondary">Kartlarda kullanılacak renk</small>
                </div>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Kart İkonu</label>
                    <InputText v-model="editForm.cardIcon" disabled class="locked-field" />
                    <small class="text-secondary">Bu alan kilitlidir</small>
                </div>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Hediye İçin Damga Sayısı</label>
                    <InputNumber
                        v-model="editForm.stampsTarget"
                        showButtons
                        buttonLayout="horizontal"
                        :min="1"
                        :max="20"
                        decrementButtonClass="p-button-secondary"
                        incrementButtonClass="p-button-secondary"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                    />
                    <small class="text-secondary">Bir hediye kazanmak için gereken damga sayısı</small>
                </div>

                <!-- Konum Bilgileri -->
                <h3 style="margin: 0.5rem 0 0 0; font-size: 1.1rem; font-weight: 600; border-top: 1px solid var(--surface-border); padding-top: 1rem;">Konum Bilgileri</h3>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Şehir</label>
                    <InputText value="Ankara" disabled class="locked-field" />
                    <small class="text-secondary">Bu alan kilitlidir</small>
                </div>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">İlçe *</label>
                    <Select
                        v-model="editForm.district"
                        :options="editDistricts"
                        placeholder="İlçe seçin"
                        @change="onEditDistrictChange"
                    />
                </div>

                <div class="flex flex-column gap-2">
                    <label class="font-bold">Semt *</label>
                    <Select
                        v-model="editForm.neighborhood"
                        :options="editNeighborhoods"
                        placeholder="Önce ilçe seçin"
                        :disabled="!editForm.district"
                    />
                </div>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="editDialog = false" :disabled="saving" />
                <Button label="Kaydet" icon="pi pi-check" severity="success" @click="saveFirmEdit" :loading="saving" />
            </template>
        </Dialog>

        <!-- QR Display Dialog -->
        <Dialog v-model:visible="qrDialog" :header="qrFirmName + ' QR Kodu'" :style="{ width: '450px' }" modal>
            <div class="flex flex-column align-items-center p-3">
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <img :src="qrDataUrl" alt="QR Code" style="max-width: 100%; display: block;" />
                </div>
                <div class="mt-3 p-2 border-round flex align-items-center gap-2" style="background: var(--highlight-bg);">
                    <i class="pi pi-lock"></i>
                    <span class="text-sm" style="color: var(--text-color-secondary);">Bu QR kod kalıcıdır ve firmaya özeldir</span>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.firms-management {
    padding: 1rem;
}

.page-header {
    margin-bottom: 2rem;
}

.page-header h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-color);
}

.page-header .text-secondary {
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
}

.card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.firm-name-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.color-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: var(--text-color-secondary);
}

.confirmation-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 0;
}

.confirmation-text p {
    margin: 0.25rem 0;
}

.text-secondary {
    color: var(--text-color-secondary);
}

.text-sm {
    font-size: 0.875rem;
}

:deep(.p-datatable-firms .p-datatable-thead > tr > th) {
    background: var(--surface-ground);
    font-weight: 600;
}

:deep(.p-datatable-firms .p-datatable-tbody > tr:hover) {
    background: var(--surface-hover);
}

:deep(.delete-dialog .p-dialog-header) {
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
}

:deep(.delete-dialog .p-dialog-footer) {
    background: var(--surface-card);
    border-top: 1px solid var(--surface-border);
}

:deep(.edit-dialog .p-dialog-header) {
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
}

:deep(.edit-dialog .p-dialog-footer) {
    background: var(--surface-card);
    border-top: 1px solid var(--surface-border);
}

.locked-field {
    background-color: var(--surface-100) !important;
    cursor: not-allowed;
}

.file-input {
    padding: 0.75rem;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    background: var(--surface-card);
    color: var(--text-color);
    cursor: pointer;
}

.file-input:hover {
    border-color: var(--primary-color);
}
</style>
