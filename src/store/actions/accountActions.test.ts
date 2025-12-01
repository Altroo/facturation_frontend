import * as types from './index';
import { accountSetProfilAction, accountSetGroupesAction, accountEditProfilAction } from './accountActions';
import { UserClass, GroupClass } from '@/models/Classes';

describe('Account Actions', () => {
	it('accountSetProfilAction should create ACCOUNT_SET_PROFIL action with user data', () => {
		const user = new UserClass(
			1,
			'John',
			'Doe',
			'john@example.com',
			'M',
			null,
			null,
			true,
			true,
			'2023-01-01',
			'2023-01-02',
		);

		const action = accountSetProfilAction(user);
		expect(action).toEqual({
			type: types.ACCOUNT_SET_PROFIL,
			data: { ...user },
		});
	});

	it('accountSetGroupesAction should create ACCOUNT_SET_GROUPES action with group data', () => {
		const group = new GroupClass(['Admin', 'User']);

		const action = accountSetGroupesAction(group);
		expect(action).toEqual({
			type: types.ACCOUNT_SET_GROUPES,
			data: group,
		});
	});

	it('accountEditProfilAction should create ACCOUNT_EDIT_PROFIL action with user data', () => {
		const user = new UserClass(
			2,
			'Jane',
			'Smith',
			'jane@example.com',
			'F',
			null,
			null,
			false,
			true,
			'2023-02-01',
			'2023-02-02',
		);

		const action = accountEditProfilAction(user);
		expect(action).toEqual({
			type: types.ACCOUNT_EDIT_PROFIL,
			data: { ...user },
		});
	});
});
