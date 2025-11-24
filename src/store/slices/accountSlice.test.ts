import reducer, { setProfil, setGroupes, setWSUserAvatar } from './accountSlice';
import { UserClass, GroupClass } from '@/models/Classes';

describe('account slice', () => {
	const sampleUser = new UserClass(
		1,
		'John',
		'Doe',
		'john.doe@example.com',
		'male',
		'avatar-initial',
		null,
		false,
		true,
		'2024-01-01T00:00:00Z',
		'2024-06-01T00:00:00Z',
	);

	it('returns the initial state when given undefined state', () => {
		const state = reducer(undefined, { type: '@@INIT' });
		expect(state).toEqual({
			profil: {},
			groupes: [],
		});
	});

	it('setProfil stores the provided UserClass instance into profil', () => {
		const next = reducer(undefined, setProfil(sampleUser));
		expect(next.profil).toBe(sampleUser);
		expect((next.profil as UserClass).email).toBe('john.doe@example.com');
	});

	it('setGroupes sets groupes from GroupClass.group_titles', () => {
		const groups = new GroupClass(['admins', 'editors']);
		const next = reducer(undefined, setGroupes(groups));
		expect(next.groupes).toEqual(['admins', 'editors']);
	});

	it('setWSUserAvatar updates profil.avatar when profil is a UserClass', () => {
		const stateWithProfil = { profil: { ...sampleUser }, groupes: [] };
		const updated = reducer(stateWithProfil, setWSUserAvatar({ avatar: 'avatar-updated' }));
		expect((updated.profil as UserClass).avatar).toBe('avatar-updated');
	});

	it('setWSUserAvatar does not throw when profil is plain object and sets avatar property', () => {
		const plainState = { profil: {}, groupes: [] };
		const updated = reducer(plainState, setWSUserAvatar({ avatar: 'avatar-set' }));
		expect((updated.profil as Record<string, unknown>).avatar).toBe('avatar-set');
	});
});
