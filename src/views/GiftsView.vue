<template>
  <div class="gifts-view p-4">
    <div class="flex flex-column sm:flex-row justify-content-between align-items-center mb-5 gap-3">
      <div>
        <h1 class="text-900 font-bold text-3xl mb-2">Hediyeler</h1>
        <p class="text-500">Müşterilerin puanlarıyla alabileceği hediyeleri yönetin</p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Hediye Teslim Et" 
          icon="pi pi-qrcode" 
          severity="success"
          @click="showRedeemModal = true" 
        />
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

    <!-- Add/Edit Gift Dialog -->
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

    <!-- Redeem Gift Dialog (2-Step) -->
    <Dialog 
      v-model:visible="showRedeemModal" 
      modal 
      header="Hediye Teslim Et" 
      :style="{ width: '600px' }"
      class="p-fluid"
      @hide="resetRedeemState"
    >
      <!-- Step 1: Input Code -->
      <div v-if="!redemptionDetails" class="flex flex-column align-items-center mb-4 pt-4">
        <i class="pi pi-qrcode text-6xl text-primary mb-4 opacity-70"></i>
        <p class="text-center text-700 text-xl font-medium m-0">Müşterinin uygulamasındaki kodu giriniz.</p>
        
        <div class="field mt-5 w-full flex justify-content-center">
          <InputText 
            id="redeemCode" 
            v-model="redeemCode" 
            placeholder="KODU GİRİN" 
            class="text-center text-4xl font-bold uppercase p-inputtext-lg w-8"
            maxlength="6"
            autofocus
            @keyup.enter="verifyRedemption"
          />
        </div>
      </div>

      <!-- Step 2: Confirmation Preview -->
      <div v-else-if="!redemptionSuccess" class="flex flex-column align-items-center mb-4 text-center pt-2">
        <div class="border-circle w-6rem h-6rem flex align-items-center justify-content-center mb-4 shadow-2" style="background: var(--green-500); color: white;">
          <i class="pi pi-check text-4xl"></i>
        </div>
        
        <h3 class="text-900 font-bold text-3xl mb-2">{{ redemptionDetails.customerName }}</h3>
        <span class="text-500 font-medium text-lg mb-5 block">{{ redemptionDetails.customerEmail }}</span>

        <div class="surface-card border-1 surface-border border-round-xl p-5 w-full shadow-2 mt-2">
          <p class="text-500 font-medium mb-3 uppercase text-sm tracking-widest">TESLİM EDİLECEK ÜRÜN</p>
          <p class="text-primary font-bold text-4xl m-0 mb-4 line-height-2">{{ redemptionDetails.giftTitle }}</p>
          
          <!-- Dynamic Badge based on Type -->
          <div v-if="redemptionDetails.redemptionType === 'GIFT_ENTITLEMENT'" 
               class="inline-flex align-items-center px-4 py-2 border-round-2xl text-base font-bold"
               style="background: rgba(156, 39, 176, 0.1); color: #AB47BC; border: 1px solid rgba(156, 39, 176, 0.2);">
            <i class="pi pi-gift mr-2 text-xl"></i>
            Hediye Hakkı Kullanımı
          </div>
          <div v-else class="inline-flex align-items-center px-4 py-2 border-round-2xl text-base font-bold"
               style="background: rgba(255, 152, 0, 0.1); color: #FFA726; border: 1px solid rgba(255, 152, 0, 0.2);">
            <i class="pi pi-star-fill mr-2 text-xl"></i>
            -{{ redemptionDetails.pointCost }} Puan
          </div>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div v-else class="flex flex-column align-items-center mb-4 text-center">
        <div class="bg-green-500 border-circle w-6rem h-6rem flex align-items-center justify-content-center mb-4 fadein animation-duration-500">
          <i class="pi pi-check text-white text-5xl"></i>
        </div>
        <h3 class="text-green-600 font-bold text-2xl mb-2">Başarılı!</h3>
        <p class="text-600 text-lg">Hediye teslim edildi.</p>
      </div>

      <template #footer>
        <div v-if="!redemptionDetails">
          <Button label="İptal" text plain @click="showRedeemModal = false" />
          <Button 
            label="Sorgula" 
            icon="pi pi-search" 
            @click="verifyRedemption" 
            :loading="verifying" 
            :disabled="!redeemCode || redeemCode.length < 6"
          />
        </div>
        <div v-else-if="!redemptionSuccess">
          <Button label="Vazgeç" text plain @click="resetRedeemState" />
          <Button 
            label="Onayla ve Teslim Et" 
            icon="pi pi-check-circle" 
            severity="success"
            @click="completeRedemption" 
            :loading="redeeming"
          />
        </div>
      </template>
    </Dialog>
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

      // Redeem State
      showRedeemModal: false,
      redeemCode: '',
      verifying: false,
      redeeming: false,
      redemptionDetails: null as any,
      redemptionSuccess: false,
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

    async verifyRedemption() {
      if (!this.redeemCode || this.redeemCode.length < 6) return;
      try {
        this.verifying = true; 
        const res = await api.post('/gifts/verify-redemption', { token: this.redeemCode.toUpperCase() });
        this.redemptionDetails = res.data;
      } catch (error: any) {
         console.error('Verify error:', error);
         const msg = error.message === 'Failed to fetch' ? 'Sunucuya ulaşılamadı' : (error.message || 'Eski veya süresi geçmiş kod');
         this.toast.add({ severity: 'error', summary: 'Hata', detail: msg, life: 3000 });
         this.redemptionDetails = null;
      } finally {
        this.verifying = false;
      }
    },

    async completeRedemption() {
      if (!this.redeemCode) return;
      try {
        this.redeeming = true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const res = await api.post('/gifts/complete-redemption', { token: this.redeemCode.toUpperCase() });
        
        // Show Success Step instead of Alert
        this.redemptionSuccess = true;
        this.toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Hediye teslim edildi', life: 3000 });

        // Auto-close after 2 seconds
        setTimeout(() => {
            this.showRedeemModal = false;
        }, 2000);
      } catch (error: any) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: error.message || 'Teslim edilemedi.', life: 3000 });
      } finally {
        this.redeeming = false;
      }
    },

    resetRedeemState() {
      this.redeemCode = '';
      this.redemptionDetails = null;
      this.redemptionSuccess = false;
      this.verifying = false;
      this.redeeming = false;
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
