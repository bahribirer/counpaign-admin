<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// import { FilterMatchMode } from 'primevue/api'; // Removed broken import

const FilterMatchMode = {
    CONTAINS: 'contains'
};
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import InputText from 'primevue/inputtext'; // Ensure InputText is imported
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

interface User {
    _id: string;
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    gender: string;
    createdAt: string;
}

const router = useRouter();
const toast = useToast();
const users = ref<User[]>([]);
const loading = ref(true);
const deleteDialog = ref(false);
const userToDelete = ref<User | null>(null);
const deleting = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const fetchUsers = async () => {
    loading.value = true;
    try {
        const response = await fetch('http://localhost:5001/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        users.value = await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Kullanıcılar yüklenemedi', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const goToUserDetail = (id: string) => {
    router.push(`/users/${id}`);
};

const confirmDelete = (user: User) => {
    userToDelete.value = user;
    deleteDialog.value = true;
};

const deleteUser = async () => {
    if (!userToDelete.value) return;

    deleting.value = true;
    try {
        const response = await fetch(`http://localhost:5001/api/users/${userToDelete.value._id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete user');

        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Kullanıcı silindi', life: 3000 });
        users.value = users.value.filter(u => u._id !== userToDelete.value?._id);
        deleteDialog.value = false;
    } catch (error) {
        console.error('Error deleting user:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Kullanıcı silinemedi', life: 3000 });
    } finally {
        deleting.value = false;
        userToDelete.value = null;
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
    fetchUsers();
});
</script>

<template>
    <div class="users-management">
        <Toast />
        
        <div class="page-header mb-5">
            <h1 class="text-900 font-bold">Kullanıcılar</h1>
            <p class="text-secondary">Tüm kullanıcıları görüntüle ve yönet</p>
        </div>

        <div class="card p-0 overflow-hidden">
            <DataTable 
                v-model:filters="filters"
                :value="users" 
                :loading="loading"
                :paginator="true" 
                :rows="10"
                responsiveLayout="scroll"
                :globalFilterFields="['name', 'surname', 'email', 'phoneNumber']"
                class="p-datatable-users"
            >
                <template #header>
                    <div class="flex justify-content-end">
                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Kullanıcı Ara..." />
                        </IconField>
                    </div>
                </template>
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-users" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                        <p>Henüz kullanıcı bulunmuyor</p>
                    </div>
                </template>

                <Column field="name" header="Ad Soyad" sortable>
                    <template #body="{ data }">
                        <div class="flex align-items-center gap-2">
                            <Avatar :label="data.name.charAt(0)" shape="circle" />
                            <span class="font-semibold">{{ data.name }} {{ data.surname }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="email" header="E-posta" sortable></Column>
                
                <Column field="phoneNumber" header="Telefon"></Column>

                <Column field="createdAt" header="Katılma Tarihi" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>

                <Column header="İşlemler">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button 
                                icon="pi pi-user-edit" 
                                severity="info" 
                                text 
                                rounded 
                                @click="goToUserDetail(data._id)"
                                v-tooltip.top="'Detay ve Cüzdan'"
                            />
                            <Button 
                                icon="pi pi-trash" 
                                severity="danger" 
                                text 
                                rounded 
                                @click="confirmDelete(data)"
                                v-tooltip.top="'Kullanıcıyı Sil'"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Delete Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Kullanıcı Sil" :style="{ width: '450px' }" modal>
            <div class="confirmation-content flex align-items-center gap-3">
                <i class="pi pi-exclamation-triangle text-red-500" style="font-size: 2rem"></i>
                <span v-if="userToDelete">Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!</span>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="deleteDialog = false" :disabled="deleting" />
                <Button label="Sil" icon="pi pi-trash" severity="danger" @click="deleteUser" :loading="deleting" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.users-management { padding: 1rem; }
.page-header { margin-bottom: 2rem; }
.page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 700; }
.card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; box-shadow: var(--card-shadow); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: var(--text-color-secondary); }
</style>
