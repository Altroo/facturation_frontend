import * as Types from '@/store/actions';
import { put, takeLatest } from 'redux-saga/effects';
import type {
	setCategoriesPayloadType,
	setCitiesPayloadType,
	setEmplacementsPayloadType,
	setMarquesPayloadType,
	setUnitesPayloadType,
	setModePaiementPayloadType,
	setModeRegelementPayloadType,
} from '@/types/parameterTypes';
import {
	setCities,
	setCategories,
	setMarques,
	setUnites,
	setEmplacements,
	setModeReglement,
	setModePaiement,
} from '@/store/slices/parameterSlice';

export function* parameterSetCitiesSaga(payload: setCitiesPayloadType) {
	yield put(setCities(payload.data));
}

export function* parameterSetCategoriesSaga(payload: setCategoriesPayloadType) {
	yield put(setCategories(payload.data));
}

export function* parameterSetEmplacementsSaga(payload: setEmplacementsPayloadType) {
	yield put(setEmplacements(payload.data));
}

export function* parameterSetUnitesSaga(payload: setUnitesPayloadType) {
	yield put(setUnites(payload.data));
}

export function* parameterSetMarquesSaga(payload: setMarquesPayloadType) {
	yield put(setMarques(payload.data));
}

export function* parameterSetModePaiementSaga(payload: setModePaiementPayloadType) {
	yield put(setModePaiement(payload.data));
}

export function* parameterSetModeReglementSaga(payload: setModeRegelementPayloadType) {
	yield put(setModeReglement(payload.data));
}

export function* watchParameter() {
	yield takeLatest(Types.PARAMETER_SET_CITIES, parameterSetCitiesSaga);
	yield takeLatest(Types.PARAMETER_SET_CATEGORIES, parameterSetCategoriesSaga);
	yield takeLatest(Types.PARAMETER_SET_EMPLACEMENTS, parameterSetEmplacementsSaga);
	yield takeLatest(Types.PARAMETER_SET_UNITES, parameterSetUnitesSaga);
	yield takeLatest(Types.PARAMETER_SET_MARQUES, parameterSetMarquesSaga);
	yield takeLatest(Types.PARAMETER_SET_MODE_PAIEMENT, parameterSetModePaiementSaga);
	yield takeLatest(Types.PARAMETER_SET_MODE_REGLEMENT, parameterSetModeReglementSaga);
}
