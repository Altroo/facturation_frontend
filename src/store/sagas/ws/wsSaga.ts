import {take, call, put, select} from 'redux-saga/effects';
import {initWebsocket} from '../../services/ws';
import {getAccessToken} from '../../selectors';
import {RootState} from '../../store';
import {EventChannel} from "redux-saga";
import {NotUndefined} from "@redux-saga/types";


function* monitorToken(selector: (state: RootState) => string | null, previousValue: string | null, takePattern = "*") {
  while (true) {
    const nextValue: string | null = yield select(selector);
    if (nextValue !== previousValue) {
      return nextValue;
    }
    yield take(takePattern);
  }
}

export function* watchWS() {
  const token: string | null = yield call(() => monitorToken(getAccessToken, null));
  // user token is required for backend to identify the user
  if (token) {
    const channel: EventChannel<NotUndefined> = yield call(() => initWebsocket(token));
    while (true) {
      const action: Record<string, unknown> | null = yield take(channel);
      // type & payload passed from the switch case
      // with yield put it calls the action & passes the payload
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      yield put(action);
    }
  }
}
