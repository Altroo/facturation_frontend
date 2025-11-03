import { put, takeLatest } from 'redux-saga/effects';
import * as Types from '../../actions';
import {
	setProfil,
	setWSUserAvatar,
} from "../../slices/account/accountSlice";
import {setProfilPayloadType} from "@/types/account/accountTypes";

function* accountSetProfilSaga(payload: setProfilPayloadType) {
	yield put(setProfil(payload.data));
}

function* accountPatchProfilSaga(payload: setProfilPayloadType) {
	yield put(setProfil(payload.data));
}


function* wsUserAvatarSaga(payload: { type: string; pk: number; avatar: string }) {
	yield put(setWSUserAvatar({avatar: payload.avatar}));
}

export function* watchAccount() {
	yield takeLatest(Types.ACCOUNT_SET_PROFIL, accountSetProfilSaga);
	yield takeLatest(Types.ACCOUNT_PATCH_PROFIL, accountPatchProfilSaga);
	yield takeLatest(Types.WS_USER_AVATAR, wsUserAvatarSaga);
}
