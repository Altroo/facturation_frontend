import * as types from './index';
import { WSUserAvatarAction } from './wsActions';

describe('WSUserAvatarAction', () => {
	it('should create WS_USER_AVATAR action with pk and avatar', () => {
		const pk = 123;
		const avatar = 'avatar.png';

		const action = WSUserAvatarAction(pk, avatar);

		expect(action).toEqual({
			type: types.WS_USER_AVATAR,
			pk,
			avatar,
		});
	});
});
