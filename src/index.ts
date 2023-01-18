import {defineModule} from '@directus/extensions-sdk';
import {User, Permission} from '@directus/shared/types';
import ModuleComponent from './module.vue';

export default defineModule({
  id: 'role-chooser',
  name: 'Role Chooser',
  icon: 'security',
  routes: [
    {
      path: '',
      component: ModuleComponent,
    },
  ],
  preRegisterCheck(user: User, permissions: Permission[]) {
    if (user.role.admin_access) return true;

    return !!permissions.find(
      permission =>
        permission.collection === 'directus_users' &&
        permission.action === 'update' &&
        permission.fields?.includes('role')
    );
  },
});
