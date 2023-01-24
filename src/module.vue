<script setup lang="ts">
import { ref, computed } from "vue";
import { useApi } from "@directus/extensions-sdk";
import { useI18n } from 'vue-i18n';

type Role = {
  id: string
  name: string
  icon: string
  description: string
}

const roles = ref<Array<Role>>([])
const can_choose = ref<Array<string>>([])
const role = ref<string>('')
const error = ref<string|null>(null)

const available_roles = computed(() => {
  return can_choose.value ? roles.value.filter(r => can_choose.value.includes(r.id)) : roles.value
})

const api = useApi()
const { t } = useI18n()

function fetchRoles() {
  api.get('/users/me', {
    params: {
      fields: ['role', 'roles.role'],
    },
  }).then(({ data: { data } }) => {
    role.value = data.role;
    can_choose.value = data.roles?.map(r => r.role)
  });

  api.get('/roles', {
    params: {
      fields: ['id', 'name', 'icon', 'description']
    }
  }).then(({ data: { data } }) => roles.value = data as Array<Role>)
}
fetchRoles()

async function selectRole(role: Role) {
  try {
    await api.patch('/users/me', {
      role: role.id,
    })

    location.reload()
  } catch (err: any) {
    error.value = err.toString()
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
    
    <template #navigation>
      <v-sheet>
        <p>Here you can switch between available roles assigned to you by the admin.</p>
        <p>If you do not see a role that you believe you should have, please contact the admin.</p>
      </v-sheet>
    </template>

    <v-error v-if="error" :error="error" @click="error = null"/>
    <div class="available-roles">
      <v-info v-for="optRole in available_roles"
        :key="optRole.id"
        :icon="optRole.icon"
        :title="optRole.name"
        class="role"
      >
        <p class="role-description">{{ optRole.description }}</p>
        <div class="role--actions">
          <v-button :disabled="optRole.id === role" @click="selectRole(optRole)">
            {{ t('Select') }}
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

.available-roles {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  flex-wrap: wrap;
}

.available-roles>.role {
  flex: 1 1 30%;
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