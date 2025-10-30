import * as types from '../index';

export const WSUserAvatarAction = (pk: number, avatar: string) => {
  return {
    type: types.WS_USER_AVATAR,
    pk,
    avatar
  };
};