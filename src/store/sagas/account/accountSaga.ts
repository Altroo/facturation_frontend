import { call, put, takeLatest } from 'redux-saga/effects';
import * as Types from '../../actions';
import {
	isAuthenticatedInstance,
} from '@/utils/helpers';
import { patchApi} from "../../services/_init/_initAPI";
import {
	setProfil,
	setWSUserAvatar,
} from "../../slices/account/accountSlice";
import {
	ApiErrorResponseType,
	AuthSagaContextType,
} from "@/types/_init/_initTypes";
import {
	AccountPatchProfilResponseType,
	AccountPatchProfilType,
} from "@/types/account/accountTypes";
import { ctxAuthSaga } from '../_init/_initSaga';
import { AxiosInstance } from "axios";

function* accountPatchProfilSaga(payload: AccountPatchProfilType) {
	const authSagaContext : AuthSagaContextType = yield call(() => ctxAuthSaga());
	const url = `${process.env.NEXT_PUBLIC_ACCOUNT_PROFIL}`;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { type, ...payloadData } = payload;
	try {
		if (authSagaContext.initStateToken.access !== null) {
			const authInstance : AxiosInstance = yield call(() => isAuthenticatedInstance(authSagaContext.initStateToken));
			const response: AccountPatchProfilResponseType = yield call(() =>
				patchApi(url, authInstance, payloadData),
			);
			if (response.status === 200) {
				yield put(setProfil(response.data));
				return true;
			}
		}
	} catch (e) {
		return e as ApiErrorResponseType;
	}
}


function* wsUserAvatarSaga(payload: { type: string; pk: number; avatar: string }) {
	yield put(setWSUserAvatar({avatar: payload.avatar}));
}

export function* watchAccount() {
	yield takeLatest(Types.ACCOUNT_PATCH_PROFIL, accountPatchProfilSaga);
	yield takeLatest(Types.WS_USER_AVATAR, wsUserAvatarSaga);
}
