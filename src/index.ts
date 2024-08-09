import { defineModule } from '@directus/extensions-sdk';
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
	preRegisterCheck(user, permissions) {
		if (user.admin_access) return true;

		return Boolean(permissions.directus_users?.update?.fields?.includes('role'));
	},
});
