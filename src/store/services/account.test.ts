import { accountApi, profilApi, groupApi, usersApi } from '@/store/services/account';
import { setupApiStore } from '@/store/store.test';

beforeAll(() => {
	process.env.NEXT_PUBLIC_ACCOUNT_SEND_PASSWORD_RESET ||= 'https://example.com/account/password-reset/send/';
	process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET ||= 'https://example.com/account/password-reset/';
	process.env.NEXT_PUBLIC_ACCOUNT_CHECK_EMAIL ||= 'https://example.com/account/check-email/';
	process.env.NEXT_PUBLIC_ACCOUNT_GROUPS ||= 'https://example.com/account/groups/';
	process.env.NEXT_PUBLIC_USERS_ROOT ||= 'https://example.com/users/';
	process.env.NEXT_PUBLIC_ACCOUNT_PROFIL ||= 'https://example.com/account/profile/';
	process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_CHANGE ||= 'https://example.com/account/password-change/';
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('accountApi', () => {
	const storeRef = setupApiStore(accountApi);

	it('sendPasswordResetCode mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			accountApi.endpoints.sendPasswordResetCode.initiate({ email: 'test@example.com' }),
		);
		expect('error' in result).toBe(false);
	});

	it('passwordReset mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			accountApi.endpoints.passwordReset.initiate({ email: 'test@example.com', code: '123456' }),
		);
		expect('error' in result).toBe(false);
	});

	it('SetPassword mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			accountApi.endpoints.SetPassword.initiate({
				email: 'test@example.com',
				code: '123456',
				new_password: 'newpass',
				new_password2: 'newpass',
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('groupApi', () => {
	const storeRef = setupApiStore(groupApi);

	it('getGroups query should complete without error', async () => {
		const result = await storeRef.store.dispatch(groupApi.endpoints.getGroups.initiate('test-token'));
		expect('error' in result).toBe(false);
	});
});

describe('usersApi', () => {
	const storeRef = setupApiStore(usersApi);

	it('getUsersList query with pagination should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.getUsersList.initiate({
				token: 'test-token',
				with_pagination: true,
				page: 1,
				pageSize: 10,
				search: '',
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('getUser query should complete without error', async () => {
		const result = await storeRef.store.dispatch(usersApi.endpoints.getUser.initiate({ token: 'test-token', id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('checkEmail mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.checkEmail.initiate({ token: 'test-token', email: 'test@example.com' }),
		);
		expect('error' in result).toBe(false);
	});

	it('deleteUser mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.deleteUser.initiate({ token: 'test-token', id: 1 }),
		);
		expect('error' in result).toBe(false);
	});

	it('editUser mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.editUser.initiate({
				token: 'test-token',
				id: 1,
				data: { first_name: 'Updated' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addUser mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.addUser.initiate({
				token: 'test-token',
				data: { first_name: 'New' },
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('profilApi', () => {
	const storeRef = setupApiStore(profilApi);

	it('getProfil query should complete without error', async () => {
		const result = await storeRef.store.dispatch(profilApi.endpoints.getProfil.initiate('test-token'));
		expect('error' in result).toBe(false);
	});

	it('editProfil mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			profilApi.endpoints.editProfil.initiate({
				token: 'test-token',
				data: { first_name: 'Updated' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('editPassword mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			profilApi.endpoints.editPassword.initiate({
				token: 'test-token',
				data: {
					old_password: 'oldpass',
					new_password: 'newpass',
					new_password2: 'newpass',
				},
			}),
		);
		expect('error' in result).toBe(false);
	});
});
