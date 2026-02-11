<template>
  <div class="gifts-view p-4">
    <div class="flex flex-column sm:flex-row justify-content-between align-items-center mb-5 gap-3">
      <div>
        <h1 class="text-900 font-bold text-3xl mb-2">Hediyeler</h1>
        <p class="text-500">Müşterilerin puanlarıyla alabileceği hediyeleri yönetin</p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Yeni Hediye Ekle" 
          icon="pi pi-plus" 
          @click="showAddModal = true" 
          class="p-button-primary"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-content-center p-5">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Empty State -->
    <div v-else-if="gifts.length === 0" class="surface-card p-5 border-round text-center shadow-1">
      <i class="pi pi-gift text-500 text-5xl mb-3"></i>
      <h3 class="text-900 font-bold text-xl mb-2">Henüz hediye eklenmemiş</h3>
      <p class="text-500 mb-4">Müşterileriniz için ilk hediyenizi ekleyin.</p>
      <Button label="Hediye Ekle" icon="pi pi-plus" @click="showAddModal = true" />
    </div>

    <div v-else class="grid">
      <div v-for="gift in gifts" :key="gift._id" class="col-12 md:col-6 xl:col-4">
        <div class="surface-card border-round-xl p-4 flex align-items-start shadow-1 border-1 surface-border hover:shadow-3 transition-duration-200 h-full relative overflow-hidden group">
           
           <!-- Decorative Stripe -->
           <div class="absolute left-0 top-0 bottom-0 w-4px bg-primary border-round-left-xl"></div>

           <!-- Content -->
           <div class="flex-1 overflow-hidden pl-3 pr-2">
             <div class="flex align-items-center mb-2">
                <div class="flex align-items-center text-primary font-bold bg-primary-50 px-3 py-1 border-round-2xl">
                   <i class="pi pi-star-fill mr-2 text-sm"></i>
                   <span class="text-sm">{{ gift.pointCost }} P</span>
                </div>
                <div class="flex align-items-center text-500 text-xs ml-3">
                   <i class="pi pi-calendar mr-1 opacity-70"></i>
                   <span>{{ new Date(gift.createdAt).toLocaleDateString('tr-TR') }}</span>
                </div>
             </div>

             <h3 class="text-900 font-bold text-lg m-0 line-height-3" style="word-break: break-word;">
               {{ gift.title }}
             </h3>
           </div>

           <!-- Actions -->
           <div class="flex flex-column gap-2 ml-2">
              <Button 
                icon="pi pi-trash" 
                text 
                rounded 
                severity="danger" 
                class="hover:bg-red-50 w-2rem h-2rem"
                @click="deleteGift(gift._id)" 
                tooltip="Sil"
              />
              <Button 
                icon="pi pi-pencil" 
                text 
                rounded 
                severity="secondary" 
                class="hover:bg-gray-100 w-2rem h-2rem"
                @click="openEditModal(gift)" 
                tooltip="Düzenle"
              />
           </div>

        </div>
      </div>
    </div>

    <Dialog 
      v-model:visible="showAddModal" 
      modal 
      :header="editingId ? 'Hediyeyi Düzenle' : 'Yeni Hediye Ekle'" 
      :style="{ width: '400px' }"
      class="p-fluid"
      @hide="resetModal"
    >
      <div class="field">
        <label for="title" class="font-medium text-900">Hediye Adı</label>
        <InputText id="title" v-model="newGift.title" placeholder="Örn: Bedava Kahve" autofocus />
      </div>
      <div class="field">
        <label for="pointCost" class="font-medium text-900">Puan Değeri</label>
        <InputNumber id="pointCost" v-model="newGift.pointCost" placeholder="Örn: 100" />
      </div>

      <template #footer>
        <Button label="İptal" text plain @click="resetModal" />
        <Button 
          :label="editingId ? 'Güncelle' : 'Ekle'" 
          icon="pi pi-check" 
          @click="saveGift" 
          :loading="submitting" 
          :disabled="!newGift.title || !newGift.pointCost"
        />
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAuthStore } from '../stores/auth.store'; // Import Auth Store
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

// API Helper
const API_URL = 'https://counpaign.com/api';

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
  components: { Button, Dialog, InputText, InputNumber, Toast, ConfirmDialog },
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
      editingId: null as string | null, // Track editing state
      newGift: { title: '', pointCost: null },
      submitting: false,
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
    
    // Kept for direct click on Add Button
    createGift() {
       this.saveGift();
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
  max-width: 1400px;
  margin: 0 auto;
}
/* PrimeFlex classes handle most styling now */
</style>
