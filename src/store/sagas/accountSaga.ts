import { put, takeLatest } from 'redux-saga/effects';
import * as Types from '../actions';
import { setProfil, setGroupes, setWSUserAvatar } from '../slices/accountSlice';
import { setGroupesPayloadType, setProfilPayloadType } from '@/types/accountTypes';

function* accountSetProfilSaga(payload: setProfilPayloadType) {
	yield put(setProfil(payload.data));
}

function* accountEditProfilSaga(payload: setProfilPayloadType) {
	yield put(setProfil(payload.data));
}

function* accountSetGroupesSaga(payload: setGroupesPayloadType) {
	yield put(setGroupes(payload.data));
}

function* wsUserAvatarSaga(payload: { type: string; pk: number; avatar: string }) {
	yield put(setWSUserAvatar({ avatar: payload.avatar }));
}

export function* watchAccount() {
	yield takeLatest(Types.ACCOUNT_SET_PROFIL, accountSetProfilSaga);
	yield takeLatest(Types.ACCOUNT_SET_GROUPES, accountSetGroupesSaga);
	yield takeLatest(Types.ACCOUNT_EDIT_PROFIL, accountEditProfilSaga);
	yield takeLatest(Types.WS_USER_AVATAR, wsUserAvatarSaga);
}
