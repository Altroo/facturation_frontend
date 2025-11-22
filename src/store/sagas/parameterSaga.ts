import * as Types from '@/store/actions';
import { put, takeLatest } from 'redux-saga/effects';
import { setCitiesPayloadType } from '@/types/parameterTypes';
import { setCities } from '@/store/slices/parameterSlice';

export function* parameterSetCitiesSaga(payload: setCitiesPayloadType) {
	yield put(setCities(payload.data));
}

export function* watchParameter() {
	yield takeLatest(Types.PARAMETER_SET_CITIES, parameterSetCitiesSaga);
}
