import type { EventChannel } from 'redux-saga';
import { eventChannel } from 'redux-saga';
import type { WSEvent, WSEventType, WSUserAvatar } from '@/types/wsTypes';
import { WSUserAvatarAction } from '@/store/actions/wsActions';

// Add multiple WS action types as needed
type WSAction = ReturnType<typeof WSUserAvatarAction>;

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
						const msg = JSON.parse(e.data);
						if (msg) {
							const { message } = msg;
							const signalType: WSEventType = message.type;
							if (signalType === 'USER_AVATAR') {
								const { pk, avatar } = (msg as WSEvent<WSUserAvatar>).message;
								emitter(WSUserAvatarAction(pk, avatar));
							}
						}
					} catch {
						// Skip malformed message and continue listening
					}
				};
				ws.onclose = () => {
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
