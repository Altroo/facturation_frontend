import { EventChannel, eventChannel } from 'redux-saga';
import type { WSEvent, WSEventType, WSUserAvatar } from '@/types/wsTypes';
import { WSUserAvatarAction } from '@/store/actions/wsActions';

// Add multiple WS action types as needed
type WSAction = ReturnType<typeof WSUserAvatarAction>;

let ws: WebSocket;

export function initWebsocket(token: string): EventChannel<WSAction> {
	return eventChannel<WSAction>((emitter) => {
		function createWs() {
			const wsUrl = `${process.env.NEXT_PUBLIC_ROOT_WS_URL}`;
			if (typeof window !== 'undefined') {
				ws = new WebSocket(`${wsUrl}?token=${token}`);
				ws.onopen = () => {
					console.log('Listening to ws...');
				};
				ws.onerror = (error: Event) => {
					console.log('WS error ' + error);
				};
				ws.onmessage = (e: MessageEvent) => {
					const msg = JSON.parse(e.data);
					if (msg) {
						const { message } = msg;
						const signalType: WSEventType = message.type;
						if (signalType === 'USER_AVATAR') {
							const { pk, avatar } = (msg as WSEvent<WSUserAvatar>).message;
							emitter(WSUserAvatarAction(pk, avatar));
						}
					}
				}; // unsubscribe function
				ws.onclose = (e: CloseEvent) => {
					console.log('Socket is closed Unexpectedly. Reconnect will be attempted in 1 second.', e.reason);
					setTimeout(() => {
						createWs();
					}, 1000);
				};
			}
		}

		createWs();
		return () => {
			console.log('Closing Websocket');
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
