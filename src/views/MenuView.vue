<template>
  <div class="menu-view p-4">
    <div class="flex flex-column sm:flex-row justify-content-between align-items-center mb-5 gap-3">
      <div>
        <h1 class="text-900 font-bold text-3xl mb-2">Menü Yönetimi</h1>
        <p class="text-500">İşletmenizin menüsünü yönetin ve popüler ürünleri belirleyin</p>
      </div>
      <Button 
        label="Yeni Ürün Ekle" 
        icon="pi pi-plus" 
        @click="openAddModal" 
        class="p-button-primary"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-content-center p-5">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="surface-card p-5 border-round text-center shadow-1">
      <i class="pi pi-image text-500 text-5xl mb-3"></i>
      <h3 class="text-900 font-bold text-xl mb-2">Menünüz boş</h3>
      <p class="text-500 mb-4">İlk ürününüzü ekleyerek başlayın.</p>
      <Button label="Ürün Ekle" icon="pi pi-plus" @click="openAddModal" />
    </div>

    <!-- Product Grid -->
    <div v-else class="grid">
      <div v-for="product in products" :key="product._id" class="col-12 md:col-6 xl:col-4">
        <div class="surface-card border-round-xl overflow-hidden shadow-1 hover:shadow-3 transition-duration-200 h-full flex flex-column">
           
           <!-- Image Section -->
           <div class="relative h-15rem w-full bg-gray-100 flex align-items-center justify-content-center overflow-hidden">
             <img 
               v-if="product.imageUrl" 
               :src="getApiUrl(product.imageUrl)" 
               class="w-full h-full object-cover" 
               alt="Product Image" 
             />
             <i v-else class="pi pi-image text-400 text-5xl"></i>
             
             <!-- Popular Badge -->
             <div v-if="product.isPopular" class="absolute top-0 right-0 m-2">
                <span class="bg-yellow-500 text-white text-xs font-bold px-2 py-1 border-round shadow-1 flex align-items-center gap-1">
                   <i class="pi pi-star-fill text-xs"></i> POPÜLER
                </span>
             </div>
             <!-- Campaign Badge -->
             <div v-if="product.campaignId" class="absolute top-0 left-0 m-2">
                <span class="bg-primary text-white text-xs font-bold px-2 py-1 border-round shadow-1 flex align-items-center gap-1">
                   <i class="pi pi-megaphone text-xs"></i> Kampanya Ürünü
                </span>
             </div>
           </div>

           <!-- Content -->
           <div class="p-3 flex-1 flex flex-column">
             <div class="flex justify-content-between align-items-start mb-2">
                <h3 class="text-900 font-bold text-lg m-0 text-overflow-ellipsis overflow-hidden white-space-nowrap" :title="product.name">
                  {{ product.name }}
                </h3>
                 <div class="flex flex-column sm:flex-row align-items-end sm:align-items-center gap-1 ml-2">
                    <span v-if="product.discount > 0" class="text-500 line-through text-xs sm:text-sm">
                        {{ formatCurrency(product.price) }}
                    </span>
                    <span class="text-primary font-bold text-lg white-space-nowrap">
                        {{ formatCurrency(product.discount > 0 ? product.price - product.discount : product.price) }}
                    </span>
                 </div>
             </div>
             <p class="text-500 text-sm m-0 mb-3 flex-1 overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
               {{ product.description || 'Açıklama yok' }}
             </p>

             <!-- Actions -->
             <div v-if="product.campaignId" class="mt-auto border-top-1 surface-border pt-3">
               <p class="text-500 text-xs m-0 text-center">
                 <i class="pi pi-lock mr-1"></i>Bu ürün kampanya tarafından yönetilmektedir. Değiştirmek için kampanyayı düzenleyin.
               </p>
             </div>
             <div v-else class="flex gap-2 mt-auto border-top-1 surface-border pt-3">
               <Button 
                  icon="pi pi-pencil ml-0" 
                  label="Düzenle"
                  text 
                  size="small"
                  class="flex-1 p-0"
                  @click="openEditModal(product)" 
                />
               <Button 
                  icon="pi pi-trash ml-0" 
                  label="Sil"
                  text 
                  severity="danger" 
                  size="small"
                  class="flex-1 p-0"
                  @click="deleteProduct(product._id)" 
                />
             </div>
           </div>

        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Dialog 
      v-model:visible="showModal" 
      modal 
      :header="editingId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'" 
      :style="{ width: '500px' }"
      class="p-fluid"
      @hide="resetModal"
    >
      <div class="field text-center mb-4">
          <div 
             class="relative inline-block border-2 border-dashed border-300 border-round p-4 cursor-pointer hover:bg-gray-50 transition-colors w-full"
             @click="triggerFileInput"
          >
             <input 
               type="file" 
               ref="fileInput" 
               class="hidden" 
               accept="image/*" 
               @change="handleFileChange" 
             />
             <div v-if="itemForm.imagePreview" class="flex flex-column align-items-center">
                <img :src="itemForm.imagePreview" class="max-h-15rem border-round shadow-1 mb-2" style="max-width: 100%;" />
                <span class="text-primary text-sm font-medium">Resmi Değiştir</span>
             </div>
             <div v-else class="flex flex-column align-items-center py-4">
                <i class="pi pi-cloud-upload text-4xl text-500 mb-2"></i>
                <span class="text-900 font-medium">Ürün Resmi Yükle</span>
                <span class="text-500 text-sm">PNG, JPG (Max 5MB)</span>
             </div>
          </div>
      </div>

      <div class="field">
        <label for="name" class="font-bold">Ürün Adı</label>
        <InputText id="name" v-model="itemForm.name" placeholder="Örn: Latte" />
      </div>

      <div class="formgrid grid">
        <div class="field col">
            <label for="price" class="font-bold">Fiyat (TL)</label>
            <InputNumber id="price" v-model="itemForm.price" mode="currency" currency="TRY" locale="tr-TR" placeholder="0.00" />
        </div>

        <div class="field col">
            <label for="category" class="font-bold">Kategori</label>
            <Select id="category" v-model="itemForm.category" :options="categories" placeholder="Seçiniz" class="w-full" />
        </div>
      </div>
      <div class="formgrid grid">
        <div class="field col flex align-items-center mb-3">
             <ToggleSwitch v-model="itemForm.isPopular" inputId="popular" />
             <label for="popular" class="ml-2 cursor-pointer select-none">Popüler</label>
        </div>
        <div class="field col flex align-items-center mb-3">
             <ToggleSwitch v-model="itemForm.isAvailable" inputId="available" />
             <label for="available" class="ml-2 cursor-pointer select-none">Mevcut</label>
        </div>
      </div>

      <div class="field">
        <label for="description" class="font-bold">Açıklama (İsteğe Bağlı)</label>
        <Textarea id="description" v-model="itemForm.description" rows="3" placeholder="Ürün içeriği hakkında bilgi..." autoResize />
      </div>

      <template #footer>
        <Button label="İptal" text plain @click="resetModal" />
        <Button 
          :label="editingId ? 'Kaydet' : 'Ekle'" 
          icon="pi pi-check" 
          @click="saveProduct" 
          :loading="submitting" 
          :disabled="!itemForm.name || itemForm.price === null"
        />
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

// Use same API URL logic as main app
const API_URL = import.meta.env.VITE_API_URL || 'https://counpaign.com/api';

export default defineComponent({
  name: 'MenuView',
  components: { Button, Dialog, InputText, InputNumber, Textarea, ToggleSwitch, Toast, ConfirmDialog, Select },
  setup() {
    const authStore = useAuthStore();
    const toast = useToast();
    const confirm = useConfirm();
    const fileInput = ref<HTMLInputElement | null>(null);

    const products = ref<any[]>([]);
    const loading = ref(true);
    const submitting = ref(false);
    
    // Modal State
    const showModal = ref(false);
    const editingId = ref<string | null>(null);
    const categories = ['Sıcak Kahveler', 'Soğuk Kahveler', 'Sıcak İçecekler', 'Soğuk İçecekler', 'Tatlılar'];
    const itemForm = reactive({
        name: '',
        price: null as number | null,
        description: '',
        category: 'Sıcak Kahveler',
        isPopular: false,
        isAvailable: true,
        imageFile: null as File | null,
        imagePreview: '' as string // URL or Base64 for preview
    });

    // Helpers
    const getApiUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        // Clean double slashes just in case
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    };

    // Actions
    const fetchProducts = async () => {
        if (!authStore.user?.businessId) return;
        try {
            loading.value = true;
            // Public endpoint can be used, or we assume admin endpoint if different (controller uses public for GET)
            const res = await fetch(`${API_URL}/products/${authStore.user.businessId}`);
            if (!res.ok) throw new Error('Fetch failed');
            products.value = await res.json();
        } catch (error) {
            console.error(error);
            toast.add({ severity: 'error', summary: 'Hata', detail: 'Menü yüklenemedi', life: 3000 });
        } finally {
            loading.value = false;
        }
    };

    const triggerFileInput = () => {
        fileInput.value?.click();
    };

    const handleFileChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            const file = target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.add({ severity: 'warn', summary: 'Dosya Çok Büyük', detail: 'Max 5MB yükleyebilirsiniz.', life: 3000 });
                return;
            }
            itemForm.imageFile = file;
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                itemForm.imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const openAddModal = () => {
        editingId.value = null;
        Object.assign(itemForm, { 
          name: '', 
          price: null, 
          description: '', 
          category: 'Sıcak Kahveler', 
          isPopular: false, 
          isAvailable: true, 
          imageFile: null, 
          imagePreview: '' 
        });
        showModal.value = true;
    };

    const openEditModal = (product: any) => {
        editingId.value = product._id;
        Object.assign(itemForm, {
            name: product.name,
            price: product.price,
            description: product.description || '',
            category: product.category || 'Sıcak Kahveler',
            isPopular: product.isPopular,
            isAvailable: product.isAvailable !== false,
            imageFile: null,
            imagePreview: product.imageUrl ? getApiUrl(product.imageUrl) : ''
        });
        showModal.value = true;
    };

    const resetModal = () => {
        showModal.value = false;
        editingId.value = null;
    };

    const saveProduct = async () => {
        if (!itemForm.name || itemForm.price === null) return;
        
        submitting.value = true;
        
        try {
            const formData = new FormData();
            formData.append('name', itemForm.name);
            formData.append('price', itemForm.price.toString());
            formData.append('description', itemForm.description);
            formData.append('category', itemForm.category);
            formData.append('isPopular', itemForm.isPopular.toString());

            formData.append('isAvailable', itemForm.isAvailable.toString());
            if (itemForm.imageFile) {
                formData.append('image', itemForm.imageFile);
            }

            const token = localStorage.getItem('token');
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            let url = `${API_URL}/products`;
            let method = 'POST';

            if (editingId.value) {
                url = `${API_URL}/products/${editingId.value}`;
                method = 'PUT'; // Controller uses updateProduct on PUT? Yes usually or PATCH. Checked controller: updateProduct used.
            }

            const res = await fetch(url, {
                method,
                headers, // Do NOT set Content-Type for FormData, browser sets it with boundary
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'İşlem başarısız');

            await fetchProducts(); // Refresh list
            toast.add({ severity: 'success', summary: 'Başarılı', detail: editingId.value ? 'Ürün güncellendi' : 'Ürün eklendi', life: 3000 });
            resetModal();

        } catch (error: any) {
            console.error(error);
            toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
        } finally {
            submitting.value = false;
        }
    };

    const executeDelete = async (id: string, force: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const url = force ? `${API_URL}/products/${id}?force=true` : `${API_URL}/products/${id}`;
            
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 409) {
                const data = await res.json();
                
                // Show Warning Dialog for cascade delete
                setTimeout(() => {
                    confirm.require({
                        message: `UYARI: ${data.message} (${data.campaigns?.length || 0} kampanya etkilenecek).\nBu işlem geri alınamaz.`,
                        header: 'Bağlı Kampanyalar Var',
                        icon: 'pi pi-exclamation-circle text-red-600',
                        acceptClass: 'p-button-danger',
                        acceptLabel: 'Anladım, Hepsini Sil',
                        rejectLabel: 'İptal',
                        accept: () => executeDelete(id, true)
                    });
                }, 300);
                return;
            }

            if (!res.ok) throw new Error('Silme başarısız');
            
            const responseData = await res.json();
            
            // Remove the deleted product AND any cascade-deleted campaign products
            products.value = products.value.filter(p => {
                // Remove the main deleted product
                if (p._id === id) return false;
                
                // Remove products that belong to the deleted campaigns (fırsat ürünleri)
                if (responseData.deletedCampaignIds && 
                    responseData.deletedCampaignIds.includes(p.campaignId)) {
                    return false;
                }
                
                return true;
            });

            toast.add({ severity: 'success', summary: 'Silindi', detail: 'Ürün ve ilişkili veriler silindi', life: 3000 });
        } catch (error) {
            console.error('Delete error:', error);
            toast.add({ severity: 'error', summary: 'Hata', detail: 'Silme işlemi başarısız oldu', life: 3000 });
        }
    };

    const deleteProduct = (id: string) => {
         confirm.require({
            message: 'Bu ürünü silmek istediğinize emin misiniz?',
            header: 'Silme Onayı',
            icon: 'pi pi-exclamation-triangle',
            acceptClass: 'p-button-danger',
            acceptLabel: 'Evet, Sil',
            rejectLabel: 'Vazgeç',
            accept: () => executeDelete(id, false)
        });
    };

    onMounted(() => {
        fetchProducts();
    });

    return {
        products, loading, submitting, showModal, editingId, itemForm,
        fileInput, getApiUrl, formatCurrency,
        openAddModal, openEditModal, resetModal, saveProduct, deleteProduct,
        triggerFileInput, handleFileChange, categories
    };
  }
});
</script>

<style scoped>
/* Scoped styles if needed */
</style>
