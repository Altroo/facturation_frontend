import { initWebsocket } from './ws';
import { WSUserAvatarAction } from '@/store/actions/wsActions';
import type { EventChannel } from 'redux-saga';

class MockWebSocket implements WebSocket {
	url: string;
	onopen: ((this: WebSocket, ev: Event) => void) | null = null;
	onerror: ((this: WebSocket, ev: Event) => void) | null = null;
	onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null;
	onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null;
	readonly CLOSED = 3;
	readonly CLOSING = 2;
	readonly CONNECTING = 0;
	readonly OPEN = 1;
	readyState = this.CONNECTING;
	protocol = '';
	extensions = '';
	bufferedAmount = 0;
	binaryType: BinaryType = 'blob';

	constructor(url: string) {
		this.url = url;
	}

	send(): void {}
	close(): void {
		this.readyState = this.CLOSED;
	}
	addEventListener(): void {}
	removeEventListener(): void {}
	dispatchEvent(): boolean {
		return true;
	}
}

describe('initWebsocket', () => {
	let originalWebSocket: typeof WebSocket | undefined;

	beforeEach(() => {
		originalWebSocket = global.WebSocket;
		delete (global as unknown as { WebSocket?: typeof WebSocket }).WebSocket;
	});

	afterEach(() => {
		if (originalWebSocket) {
			global.WebSocket = originalWebSocket;
		} else {
			delete (global as unknown as { WebSocket?: typeof WebSocket }).WebSocket;
		}
		jest.useRealTimers();
		jest.clearAllTimers();
	});

	it('emits WSUserAvatarAction when USER_AVATAR message is received', async () => {
		let createdSocket: MockWebSocket | null = null;

		global.WebSocket = jest.fn((url: string) => {
			createdSocket = new MockWebSocket(url);
			return createdSocket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		type ExpectedAction = ReturnType<typeof WSUserAvatarAction>;
		const channel: EventChannel<ExpectedAction> = initWebsocket('test-token');

		const emitted = await new Promise<ExpectedAction>((resolve) => {
			// start listening on the channel
			channel.take((action) => {
				resolve(action as ExpectedAction);
			});

			// ensure the websocket instance created inside initWebsocket is available,
			// schedule message send on next tick if not created synchronously
			const sendMessage = () => {
				if (createdSocket == null) {
					// try again shortly
					setTimeout(sendMessage, 0);
					return;
				}
				const ev = new MessageEvent('message', {
					data: JSON.stringify({
						message: { type: 'USER_AVATAR', pk: 42, avatar: 'https://example.com/avatar.png' },
					}),
				});
				createdSocket.onmessage?.(ev);
			};

			sendMessage();
		});

		expect(emitted).toEqual(WSUserAvatarAction(42, 'https://example.com/avatar.png'));

		channel.close();
	});
});
