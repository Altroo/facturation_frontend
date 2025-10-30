import {take, call, put, select} from 'redux-saga/effects';
import {initWebsocket} from '../../services/ws';
import {getAccessToken} from '../../selectors';
import {RootState} from '../../store';
import { Action } from "redux";
import {EventChannel, SagaIterator} from "redux-saga";


function* monitorToken(
  selector: (state: RootState) => string | null,
  previousValue: string | null,
  takePattern = "*"
): SagaIterator<string | null> {
  while (true) {
    const nextValue: string | null = yield select(selector);
    if (nextValue !== previousValue) {
      return nextValue;
    }
    yield take(takePattern);
  }
}

export function* watchWS(): SagaIterator<void> {
  const token: string | null = yield call(monitorToken, getAccessToken, null);

  if (token) {
    const channel: EventChannel<Action> = yield call(initWebsocket, token);

    while (true) {
      const action: Action = yield take(channel);
      yield put(action);
    }
  }
}

