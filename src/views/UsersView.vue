<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store'; // Import Auth Store

const FilterMatchMode = {
    CONTAINS: 'contains'
};
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Avatar from 'primevue/avatar';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';

interface User {
    _id: string;
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    gender: string;
    createdAt: string;
}

interface Firm {
    _id: string;
    companyName: string;
}

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const users = ref<User[]>([]);
const firms = ref<Firm[]>([]);

const sendNotification = (user: User) => {
    toast.add({ severity: 'info', summary: 'Yakında', detail: 'Bildirim sistemi yakında aktif olacak.', life: 3000 });
};
const loading = ref(true);
const deleteDialog = ref(false);
const userToDelete = ref<User | null>(null);
const deleting = ref(false);

// Notification State
const selectedUsers = ref<User[]>([]);
const notificationDialog = ref(false);
const notificationMessage = ref('');
const selectedTitle = ref<string>('Counpaign');
const sendingNotification = ref(false);

// Title options for dropdown
const titleOptions = computed(() => {
    const options = [{ label: 'Counpaign (Sistem)', value: 'Counpaign' }];
    firms.value.forEach(firm => {
        options.push({ label: firm.companyName, value: firm.companyName });
    });
    return options;
});

const fetchFirms = async () => {
    try {
        const response = await fetch('https://counpaign.com/api/firms');
        if (response.ok) {
            firms.value = await response.json();
        }
    } catch (error) {
        console.error('Error fetching firms:', error);
    }
};

const openNotificationDialog = () => {
    notificationMessage.value = '';
    selectedTitle.value = 'Counpaign';
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
        const userIds = selectedUsers.value.map(u => u._id);

        const response = await fetch('https://counpaign.com/api/notifications/send-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userIds,
                title: selectedTitle.value,
                body: notificationMessage.value
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Bildirim gönderilemedi.');
        
        toast.add({ severity: 'success', summary: 'Başarılı', detail: data.message, life: 3000 });
        notificationDialog.value = false;
        selectedUsers.value = []; // Clear selection
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message || 'Bildirim gönderilemedi.', life: 3000 });
    } finally {
        sendingNotification.value = false;
    }
};

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const fetchUsers = async () => {
    loading.value = true;
    try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('https://counpaign.com/api/users', { headers });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch users');
        }
        
        users.value = data;
    } catch (error: any) {
        console.error('Error fetching users:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message || 'Kullanıcılar yüklenemedi', life: 3000 });
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
        const token = localStorage.getItem('token');
        const headers: any = {
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`https://counpaign.com/api/users/${userToDelete.value._id}`, {
            method: 'DELETE',
            headers
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
    fetchFirms();
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
                v-model:selection="selectedUsers"
                :value="users" 
                :loading="loading"
                :paginator="true" 
                :rows="10"
                responsiveLayout="scroll"
                :globalFilterFields="['name', 'surname', 'email', 'phoneNumber']"
                class="p-datatable-users"
                dataKey="_id"
            >
                <template #header>
                    <div class="flex justify-content-between align-items-center">
                        <div class="flex align-items-center gap-2">
                             <Button 
                                v-if="selectedUsers.length > 0 && authStore.user?.role === 'super_admin'"
                                :label="`Bildirim Gönder (${selectedUsers.length})`" 
                                icon="pi pi-bell" 
                                severity="warning" 
                                @click="openNotificationDialog"
                            />
                        </div>
                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Kullanıcı Ara..." style="padding-left: 3rem !important" />
                        </IconField>
                    </div>
                </template>
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-users" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                        <p>Henüz kullanıcı bulunmuyor</p>
                    </div>
                </template>

                <Column selectionMode="multiple" headerStyle="width: 3rem" v-if="authStore.user?.role === 'super_admin'"></Column>

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
                            <!-- Superadmin: View Details & Send Notification -->
                            <template v-if="authStore.user?.role === 'super_admin'">
                                <Button 
                                    icon="pi pi-wallet" 
                                    severity="info" 
                                    text 
                                    rounded 
                                    @click="goToUserDetail(data._id)"
                                    v-tooltip.top="'Cüzdan Yönetimi'"
                                />

                            </template>

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


        <!-- Notification Dialog -->
        <Dialog v-model:visible="notificationDialog" header="Bildirim Gönder" :style="{ width: '550px' }" modal>
            <div class="flex flex-column gap-4">
                <span class="text-secondary block">
                    Seçili <strong>{{ selectedUsers.length }}</strong> kullanıcıya bildirim gönderilecek.
                </span>
                
                <div class="flex flex-column gap-2">
                    <label for="titleSelect" class="font-bold">Gönderen (Başlık)</label>
                    <Select 
                        id="titleSelect" 
                        v-model="selectedTitle" 
                        :options="titleOptions" 
                        optionLabel="label" 
                        optionValue="value"
                        placeholder="Gönderen seçin..." 
                        class="w-full"
                    />
                    <small class="text-secondary">Bildirim bu isimle gönderilecek.</small>
                </div>

                <div class="flex flex-column gap-2">
                    <label for="message" class="font-bold">Mesaj İçeriği</label>
                    <Textarea id="message" v-model="notificationMessage" rows="5" placeholder="Bildirim mesajınızı buraya yazın..." autoResize />
                </div>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="notificationDialog = false" :disabled="sendingNotification" />
                <Button label="Gönder" icon="pi pi-send" severity="warning" @click="sendBulkNotification" :loading="sendingNotification" />
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
