import { getInitStateToken, getAccessToken, getProfilState, getGroupesState } from './index';

import { UserClass } from '@/models/Classes';

describe('Redux selectors', () => {
	const mockState = {
		_init: {
			initStateToken: {
				access: 'mock-access-token',
				refresh: 'mock-refresh-token',
			},
		},
		account: {
			profil: new UserClass(
				1,
				'John',
				'Doe',
				'john.doe@example.com',
				'male',
				null,
				null,
				true,
				true,
				'2023-01-01T12:00:00Z',
				'2023-12-01T08:30:00Z',
			),
			groupes: ['admin', 'editor'],
		},
	};

	it('getInitStateToken should return the initStateToken object', () => {
		expect(getInitStateToken(mockState)).toEqual({
			access: 'mock-access-token',
			refresh: 'mock-refresh-token',
		});
	});

	it('getAccessToken should return the access token string', () => {
		expect(getAccessToken(mockState)).toBe('mock-access-token');
	});

	it('getProfilState should return a UserClass instance', () => {
		const profil = getProfilState(mockState);
		expect(profil).toBeInstanceOf(UserClass);
		expect(profil.email).toBe('john.doe@example.com');
		expect(profil.is_staff).toBe(true);
	});

	it('getGroupesState should return the groupes array', () => {
		expect(getGroupesState(mockState)).toEqual(['admin', 'editor']);
	});
});
