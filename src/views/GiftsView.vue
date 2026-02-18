<template>
  <div class="gifts-view p-4 md:p-6 fade-in">
    <!-- Header Section -->
    <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4">
      <div>
        <h1 class="font-bold text-4xl mb-2 tracking-tight">
          <span class="text-primary mr-2">✦</span>Hediyeler
        </h1>
        <p class="text-secondary text-lg">Müşterilerin puanlarıyla alabileceği ödülleri yönetin.</p>
      </div>
      <Button 
        label="Yeni Hediye Ekle" 
        icon="pi pi-plus" 
        @click="showAddModal = true" 
        class="p-button-primary p-button-lg shadow-4 hover:shadow-6 transition-all transition-duration-300 border-round-xl px-4"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-content-center align-items-center p-8 card shadow-1" style="min-height: 400px">
      <div class="flex flex-column align-items-center gap-3">
        <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
        <span class="text-500 font-medium">Yükleniyor...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="gifts.length === 0" class="flex flex-column align-items-center justify-content-center p-8 card shadow-1 text-center" style="min-height: 400px">
      <div class="bg-primary-50 border-circle w-6rem h-6rem flex align-items-center justify-content-center mb-4 shadow-1">
         <i class="pi pi-gift text-primary text-5xl"></i>
      </div>
      <h3 class="font-bold text-2xl mb-2">Henüz hediye eklenmemiş</h3>
      <p class="text-secondary text-lg mb-4 max-w-sm">Müşterilerinizi mutlu edecek ilk ödülü şimdi ekleyin.</p>
      <Button label="Hediye Oluştur" icon="pi pi-plus" @click="showAddModal = true" class="p-button-outlined p-button-secondary border-round-xl" />
    </div>

    <!-- Premium DataTable -->
    <div v-else class="card border-round-2xl overflow-hidden shadow-1">
       <DataTable 
          :value="gifts" 
          responsiveLayout="stack" 
          :paginator="true" 
          :rows="10"
          dataKey="_id"
          class="p-datatable-premium"
          :rowHover="true"
        >
          <template #header>
              <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 p-2">
                  <span class="p-input-icon-left">
                      <i class="pi pi-search" />
                      <InputText v-model="filters['global'].value" placeholder="Hediye Ara..." class="p-inputtext-sm" />
                  </span>
                  <span class="text-secondary text-sm">Toplam {{ gifts.length }} hediye</span>
              </div>
          </template>

          <template #empty>
              <div class="text-center p-4 text-secondary">Kayıt bulunamadı.</div>
          </template>

          <!-- Icon Column -->
          <Column header="" headerStyle="width: 3rem">
             <template #body>
                <div class="bg-primary-50 border-circle w-2rem h-2rem flex align-items-center justify-content-center shadow-1">
                   <i class="pi pi-gift text-primary text-xs"></i>
                </div>
             </template>
          </Column>

          <!-- Title Column -->
          <Column field="title" header="HEDİYE ADI" sortable>
             <template #body="{ data }">
                <span class="font-bold text-lg">{{ data.title }}</span>
             </template>
          </Column>

          <!-- Points Column -->
          <Column field="pointCost" header="PUAN DEĞERİ" sortable>
             <template #body="{ data }">
                <div class="surface-100 px-3 py-1 border-round-xl inline-flex align-items-center gap-2">
                   <i class="pi pi-star-fill text-yellow-500 text-sm"></i>
                   <span class="font-medium">{{ data.pointCost }} P</span>
                </div>
             </template>
          </Column>

          <!-- Date Column -->
          <Column field="createdAt" header="EKLENME TARİHİ" sortable>
             <template #body="{ data }">
                <span class="text-secondary text-sm">
                   {{ new Date(data.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
                </span>
             </template>
          </Column>

          <!-- Actions Column -->
          <Column header="İŞLEMLER" headerStyle="width: 8rem; text-align: center" bodyStyle="text-align: center">
             <template #body="{ data }">
                <div class="flex gap-2 justify-content-center">
                   <Button 
                      icon="pi pi-pencil" 
                      text 
                      rounded 
                      class="text-secondary hover:bg-surface-100 transition-colors duration-200"
                      @click="openEditModal(data)" 
                      v-tooltip.top="'Düzenle'"
                    />
                    <Button 
                      icon="pi pi-trash" 
                      text 
                      rounded 
                      severity="danger" 
                      class="text-red-500 hover:bg-red-50 transition-colors duration-200"
                      @click="deleteGift(data._id)" 
                      v-tooltip.top="'Sil'"
                    />
                </div>
             </template>
          </Column>
       </DataTable>
    </div>

    <!-- Elegant Modal -->
    <Dialog 
      v-model:visible="showAddModal" 
      modal 
      :header="editingId ? 'Ödülü Düzenle' : 'Yeni Ödül Ekle'" 
      :style="{ width: '450px' }"
      class="p-fluid premium-dialog"
      :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
      @hide="resetModal"
    >
      <div class="flex flex-column gap-4 py-3">
        <div class="field">
          <label for="title" class="font-bold mb-2 block">Hediye Başlığı</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-tag" />
            <InputText id="title" v-model="newGift.title" placeholder="Örn: 1 Adet Filtre Kahve" class="w-full" size="large" />
          </span>
        </div>
        <div class="field">
          <label for="pointCost" class="font-bold mb-2 block">Puan Değeri</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-star" />
            <InputNumber id="pointCost" v-model="newGift.pointCost" placeholder="Örn: 150" class="w-full" size="large" inputClass="pl-5" />
          </span>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-content-end pt-3">
            <Button label="Vazgeç" text plain @click="resetModal" class="px-4" />
            <Button 
              :label="editingId ? 'Kaydet' : 'Oluştur'" 
              icon="pi pi-check" 
              @click="saveGift" 
              :loading="submitting" 
              :disabled="!newGift.title || !newGift.pointCost"
              class="px-4 border-round-lg shadow-2"
            />
        </div>
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAuthStore } from '../stores/auth.store'; 
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
const FilterMatchMode = { CONTAINS: 'contains' };
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

// API Helper
const API_URL = import.meta.env.VITE_API_URL || 'https://counpaign.com/api';

const api = {
  async request(method: string, endpoint: string, body: any = null) {
    const token = localStorage.getItem('token');
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options: any = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `İşlem başarısız: ${res.status}`);
    return { data };
  },
  get: (url: string) => api.request('GET', url),
  post: (url: string, body: any) => api.request('POST', url, body),
  put: (url: string, body: any) => api.request('PUT', url, body),
  delete: (url: string) => api.request('DELETE', url),
};

export default defineComponent({
  name: 'GiftsView',
  components: { Button, Dialog, InputText, InputNumber, Toast, ConfirmDialog, DataTable, Column },
  setup() {
    const authStore = useAuthStore();
    const toast = useToast();
    const confirm = useConfirm();
    return { authStore, toast, confirm };
  },
  data() {
    return {
      gifts: [] as any[],
      loading: true,
      
      showAddModal: false,
      editingId: null as string | null,
      newGift: { title: '', pointCost: null },
      submitting: false,
      
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      }
    };
  },
  async created() {
    await this.fetchGifts();
  },
  methods: {
    async fetchGifts() {
      try {
        this.loading = true;
        const res = await api.get('/gifts/my');
        this.gifts = res.data;
      } catch (error) {
        console.error('Error fetching gifts:', error);
      } finally {
        this.loading = false;
      }
    },

    openEditModal(gift: any) {
      this.editingId = gift._id;
      this.newGift = { title: gift.title, pointCost: gift.pointCost };
      this.showAddModal = true;
    },

    resetModal() {
      this.showAddModal = false;
      this.editingId = null;
      this.newGift = { title: '', pointCost: null };
    },

    async saveGift() {
      if (!this.newGift.title || !this.newGift.pointCost) return;
      
      this.submitting = true;
      const payload = { ...this.newGift };

      try {
        if (this.editingId) {
          // UPDATE
          const res = await api.put(`/gifts/${this.editingId}`, payload);
          const index = this.gifts.findIndex(g => g._id === this.editingId);
          if (index !== -1) {
            this.gifts[index] = res.data;
          }
          this.toast.add({ severity: 'success', summary: 'Güncellendi', detail: 'Hediye başarıyla güncellendi', life: 3000 });
        } else {
          // CREATE
          const res = await api.post('/gifts', payload);
          this.gifts.unshift(res.data);
          this.toast.add({ severity: 'success', summary: 'Eklendi', detail: 'Yeni hediye eklendi', life: 3000 });
        }
        this.resetModal();
      } catch (error) {
        console.error('Error saving gift:', error);
        this.toast.add({ severity: 'error', summary: 'Hata', detail: 'İşlem başarısız oldu.', life: 3000 });
      } finally {
        this.submitting = false;
      }
    },
    
    async deleteGift(id: string) {
      this.confirm.require({
        message: 'Bu hediyeyi silmek istediğinize emin misiniz?',
        header: 'Silme Onayı',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Evet, Sil',
        rejectLabel: 'Vazgeç',
        accept: async () => {
          try {
            await api.delete(`/gifts/${id}`);
            this.gifts = this.gifts.filter(g => g._id !== id);
            this.toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Hediye silindi', life: 3000 });
          } catch (error) {
            console.error('Error deleting gift:', error);
            this.toast.add({ severity: 'error', summary: 'Hata', detail: 'Hediye silinemedi.', life: 3000 });
          }
        },
      });
    }
  }
});
</script>

<style scoped>
.gifts-view {
  max-width: 1600px;
  margin: 0 auto;
}

/* Premium DataTable Styles - Light Theme Compatible */
:deep(.p-datatable-premium) {
  background: transparent;
}

:deep(.p-datatable-premium .p-datatable-header) {
  background: transparent;
  border: none;
  padding: 1.5rem;
}

:deep(.p-datatable-premium .p-datatable-thead > tr > th) {
  background: var(--surface-ground);
  color: var(--text-color-secondary);
  border: none;
  padding: 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

:deep(.p-datatable-premium .p-datatable-tbody > tr) {
  background: transparent;
  transition: all 0.2s;
}

:deep(.p-datatable-premium .p-datatable-tbody > tr > td) {
  border: none;
  border-bottom: 1px solid var(--surface-border);
  padding: 1.25rem 1rem;
}

:deep(.p-datatable-premium .p-datatable-tbody > tr:hover) {
  background: var(--surface-ground) !important;
}

:deep(.p-datatable-premium .p-datatable-tbody > tr:last-child > td) {
  border-bottom: none;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.p-paginator) {
  background: transparent;
  border: none;
  margin-top: 1rem;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
  background: var(--primary-color);
  color: var(--primary-color-text);
  border-radius: 50%;
  border: none;
}

:deep(.p-paginator .p-paginator-page:not(.p-highlight):hover) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  color: var(--text-color);
}
</style>
