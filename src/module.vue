<script setup lang="ts">
import { useApi } from "@directus/extensions-sdk";
import { computed, ref } from "vue";
import { useI18n } from 'vue-i18n';

type Role = {
  id: string
  name: string
  icon: string
  description: string
}

function getRoleId(role: string | { id?: string } | null | undefined): string | undefined {
  return typeof role === 'string' ? role : role?.id;
}

const roles = ref<Array<Role>>([])
const can_choose = ref<Array<string>>([])
const currentRoleId = ref<string | undefined>(undefined)
const switching = ref(false)
const switchingRoleId = ref<string | null>(null)
const error = ref<string|null>(null)

const available_roles = computed(() => {
  return can_choose.value.length
    ? roles.value.filter(r => can_choose.value.includes(r.id))
    : []
})

const api = useApi()
const { t } = useI18n()

function fetchRoles() {
  api.get('/users/me', {
    params: {
      fields: ['role', 'roles.role'],
    },
  }).then(({ data: { data } }) => {
    currentRoleId.value = getRoleId(data.role);
    can_choose.value = (data.roles ?? [])
      .map((r: { role: string | { id?: string } }) => getRoleId(r.role))
      .filter((id: string | undefined): id is string => Boolean(id));
  });

  api.get('/roles', {
    params: {
      fields: ['id', 'name', 'icon', 'description']
    }
  }).then(({ data: { data } }) => {
    roles.value = data as Array<Role>
    roles.value.sort((a, b) => a.name.localeCompare(b.name))
  })
}
fetchRoles()

async function selectRole(role: Role) {
  if (switching.value) return;
  if (role.id === currentRoleId.value) return;

  switching.value = true;
  switchingRoleId.value = role.id;
  error.value = null;

  try {
    await api.patch('/users/me', {
      role: role.id,
    });

    try {
      await api.post('/auth/refresh', { mode: 'session' });
    } catch {
      await api.post('/auth/refresh');
    }

    window.location.assign('/admin/content');
  } catch (err: unknown) {
    const e = err as { toString?: () => string };
    error.value = e?.toString?.() ?? String(err);
    switching.value = false;
    switchingRoleId.value = null;
  }
}

</script>

<template>
  <private-view title="Choose role" id="role-chooser">
    <template #title-outer:prepend>
      <v-button class="header-icon" rounded disabled icon secondary>
        <v-icon name="security" />
      </v-button>
    </template>

    <v-error v-if="error" :error="error" @click="error = null"/>

    <div class="introduction">
      <p>Here you can switch between available roles assigned to you by the admin.</p>
      <p>If you do not see a role that you believe you should have, please contact the admin.</p>
    </div>

    <div class="available-roles">
      <v-info v-for="optRole in available_roles"
        :key="optRole.id"
        :icon="optRole.icon"
        :title="optRole.name"
        class="role"
      >
        <p class="role-description">{{ optRole.description }}</p>
        <div class="role--actions">
          <v-button
            :disabled="switching || optRole.id === currentRoleId"
            @click="selectRole(optRole)"
          >
            {{ switchingRoleId === optRole.id ? t('Loading...') : t('Select') }}
          </v-button>
        </div>
      </v-info>
    </div>
  </private-view>
</template>

<style>
/* Hide the sidebar and toggle actions */
#role-chooser .actions,
#role-chooser aside#sidebar,
#role-chooser .sidebar-overlay {
  display: none !important;
}

.introduction {
  margin: 1rem;
}

.available-roles {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  flex-wrap: wrap;
}

.available-roles>.role {
  flex: 1 1 20%;
  min-width: 300px;
  margin: 1rem;
  padding: var(--input-padding);
  border: var(--border-width) solid var(--border-normal);
  border-radius: var(--border-radius);
}

.available-roles>.role>.content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.available-roles>.role .role-description {
  flex-grow: 1;
}
.available-roles>.role .role--actions {
  padding-top: var(--input-padding);
}
</style>
