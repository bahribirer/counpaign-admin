<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Rating from 'primevue/rating';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { useAuthStore } from '../stores/auth.store';

interface Review {
    _id: string;
    rating: number;
    comment: string;
    createdAt?: string;
    customer?: {
        name: string;
        surname: string;
        email?: string;
        profileImage?: string;
    };
    business?: {
        companyName: string;
        logo?: string;
    };
    isAnonymous?: boolean;
}

const authStore = useAuthStore();
const toast = useToast();
const reviews = ref<Review[]>([]);
const loading = ref(true);
const deleteDialog = ref(false);
const reviewToDelete = ref<Review | null>(null);
const deleting = ref(false);

const isSuperAdmin = computed(() => authStore.user?.role === 'super_admin');

const fetchReviews = async () => {
    loading.value = true;
    try {
        const url = isSuperAdmin.value 
            ? 'https://counpaign.com/api/reviews/all' 
            : 'https://counpaign.com/api/reviews/my-business';
            
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch reviews');
        reviews.value = await response.json();
    } catch (error) {
        console.error('Error fetching reviews:', error);
    } finally {
        loading.value = false;
    }
};

const confirmDelete = (review: Review) => {
    reviewToDelete.value = review;
    deleteDialog.value = true;
};

const deleteReview = async () => {
    if (!reviewToDelete.value) return;

    deleting.value = true;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://counpaign.com/api/reviews/${reviewToDelete.value._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete review');

        reviews.value = reviews.value.filter(r => r._id !== reviewToDelete.value?._id);
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Değerlendirme silindi', life: 3000 });
        deleteDialog.value = false;
    } catch (error) {
        console.error('Error deleting review:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Değerlendirme silinemedi', life: 3000 });
    } finally {
        deleting.value = false;
        reviewToDelete.value = null;
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

onMounted(fetchReviews);
</script>

<template>
    <div class="reviews-page">
        <Toast />
        <div class="page-header mb-5">
            <h1 class="text-900 font-bold">Değerlendirmeler</h1>
            <p class="text-secondary">
                {{ isSuperAdmin ? 'Tüm firmalara yapılan kullanıcı değerlendirmeleri' : 'İşletmenize yapılan değerlendirmeler (Anonim)' }}
            </p>
        </div>

        <div class="card p-0 overflow-hidden">
            <DataTable 
                :value="reviews" 
                :loading="loading" 
                :paginator="true" 
                :rows="10"
                responsiveLayout="scroll"
                dataKey="_id"
            >
                <template #empty>
                    <div class="p-5 text-center text-secondary">Henüz bir değerlendirme bulunmuyor.</div>
                </template>

                <!-- Firm Column (Super Admin Only) -->
                <Column v-if="isSuperAdmin" field="business.companyName" header="Firma" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="flex align-items-center gap-3">
                            <span class="font-bold">{{ data.business?.companyName }}</span>
                        </div>
                    </template>
                </Column>

                <!-- User Column -->
                <Column header="Kullanıcı" style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="flex align-items-center gap-3">
                            <div v-if="!data.isAnonymous && data.customer?.profileImage" class="w-2rem h-2rem border-circle overflow-hidden">
                                <img :src="`https://counpaign.com${data.customer.profileImage}`" class="w-full h-full object-cover">
                            </div>
                            <div v-else class="w-2rem h-2rem border-circle bg-gray-200 flex align-items-center justify-content-center text-gray-500">
                                <i class="pi pi-user"></i>
                            </div>
                            <div class="flex flex-column">
                                <span class="font-medium">
                                    {{ !data.isAnonymous ? `${data.customer?.name} ${data.customer?.surname}` : 'Anonim' }}
                                </span>
                                <span v-if="!data.isAnonymous && data.customer?.email" class="text-sm text-secondary">{{ data.customer.email }}</span>
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- Rating -->
                <Column field="rating" header="Puan" sortable style="min-width: 150px">
                    <template #body="{ data }">
                        <Rating :modelValue="data.rating" readonly :cancel="false" />
                    </template>
                </Column>

                <!-- Comment -->
                <Column field="comment" header="Yorum" style="min-width: 300px">
                    <template #body="{ data }">
                        <p class="m-0 line-height-3" v-if="data.comment">{{ data.comment }}</p>
                        <span v-else class="text-secondary italic">Yorum yok</span>
                    </template>
                </Column>

                <!-- Date (Hidden for Anonymous) -->
                <Column v-if="isSuperAdmin" field="createdAt" header="Tarih" sortable style="min-width: 150px">
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>

                <!-- Actions (Super Admin Only) -->
                <Column v-if="isSuperAdmin" header="İşlemler" style="min-width: 100px">
                    <template #body="{ data }">
                        <Button 
                            icon="pi pi-trash" 
                            severity="danger" 
                            text 
                            rounded 
                            @click="confirmDelete(data)"
                            v-tooltip.top="'Değerlendirmeyi Sil'"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Delete Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Değerlendirmeyi Sil" :style="{ width: '450px' }" modal>
            <div class="confirmation-content flex align-items-center gap-3">
                <i class="pi pi-exclamation-triangle text-red-500" style="font-size: 2rem"></i>
                <span v-if="reviewToDelete">Bu değerlendirmeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</span>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="deleteDialog = false" :disabled="deleting" />
                <Button label="Sil" icon="pi pi-trash" severity="danger" @click="deleteReview" :loading="deleting" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.reviews-page {
    padding: 0;
}
</style>
