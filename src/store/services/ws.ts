import type { EventChannel } from 'redux-saga';
import { END, eventChannel } from 'redux-saga';
import { WSMaintenanceAction, WSUserAvatarAction } from '@/store/actions/wsActions';

type WSAction = ReturnType<typeof WSUserAvatarAction> | ReturnType<typeof WSMaintenanceAction>;

type WSMessage = {
	type: string;
	pk?: number;
	avatar?: string;
	maintenance?: boolean;
};

type WSEnvelope = {
	message: WSMessage;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null;
};

const isWSEnvelope = (value: unknown): value is WSEnvelope => {
	if (!isObjectRecord(value)) {
		return false;
	}

	const message = value.message;
	if (!isObjectRecord(message)) {
		return false;
	}

	return typeof message.type === 'string';
};

let ws: WebSocket;

const WS_MAX_RECONNECT_DELAY_MS = 30000;
const WS_INITIAL_RECONNECT_DELAY_MS = 1000;

export function initWebsocket(token: string): EventChannel<WSAction> {
	return eventChannel<WSAction>((emitter) => {
		let reconnectDelay = WS_INITIAL_RECONNECT_DELAY_MS;

		function createWs() {
			const wsUrl = `${process.env.NEXT_PUBLIC_ROOT_WS_URL}`;
			if (typeof window !== 'undefined') {
				ws = new WebSocket(`${wsUrl}?token=${token}`);
				ws.onopen = () => {
					// Reset delay on successful connection
					reconnectDelay = WS_INITIAL_RECONNECT_DELAY_MS;
				};
				ws.onerror = () => {
					// Errors are followed by onclose, no action needed here
				};
				ws.onmessage = (e: MessageEvent) => {
					try {
						const parsedMessage: unknown = JSON.parse(e.data);
						if (isWSEnvelope(parsedMessage)) {
							const { message } = parsedMessage;
							const signalType = message.type;
							if (signalType === 'USER_AVATAR') {
								if (typeof message.pk === 'number' && typeof message.avatar === 'string') {
									emitter(WSUserAvatarAction(message.pk, message.avatar));
								}
							} else if (signalType === 'MAINTENANCE') {
								if (typeof message.maintenance === 'boolean') {
									emitter(WSMaintenanceAction(message.maintenance));
								}
							}
						}
					} catch {
						// Skip malformed message and continue listening
					}
				};
				ws.onclose = (e: CloseEvent) => {
					// 4001 = auth rejected by server - no point retrying
					if (e.code === 4001) {
						emitter(END);
						return;
					}
					setTimeout(() => {
						createWs();
					}, reconnectDelay);
					// Exponential backoff with cap
					reconnectDelay = Math.min(reconnectDelay * 2, WS_MAX_RECONNECT_DELAY_MS);
				};
			}
		}

		createWs();
		return () => {
			ws.close();
		};
	});
}

/*
	 WS STATUS TITLE                                          e.code
	 WS_CLOSE_STATUS_NORMAL                                 = 1000,
	 WS_CLOSE_STATUS_GOINGAWAY                              = 1001,
	 WS_CLOSE_STATUS_PROTOCOL_ERR                           = 1002,
	 WS_CLOSE_STATUS_UNACCEPTABLE_OPCODE                    = 1003,
	 WS_CLOSE_STATUS_RESERVED                               = 1004,
	 WS_CLOSE_STATUS_NO_STATUS                              = 1005, // RESERVED
	 WS_CLOSE_STATUS_ABNORMAL_CLOSE                         = 1006,
	 WS_CLOSE_STATUS_INVALID_PAYLOAD                        = 1007,
	 WS_CLOSE_STATUS_POLICY_VIOLATION                       = 1008,
	 WS_CLOSE_STATUS_MESSAGE_TOO_LARGE                      = 1009,
	 WS_CLOSE_STATUS_EXTENSION_REQUIRED                     = 1010,
	 WS_CLOSE_STATUS_UNEXPECTED_CONDITION                   = 1011,
	 WS_CLOSE_STATUS_TLS_FAILURE                            = 1015,
	 WS_CLOSE_STATUS_CLIENT_TRANSACTION_DONE                = 2000,
*/
