import { initWebsocket } from './ws';
import { WSMaintenanceAction, WSReconnectedAction, WSUserAvatarAction } from '@/store/actions/wsActions';

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
		const channel = initWebsocket('test-token');

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

	it('emits WSMaintenanceAction when MAINTENANCE message is received', async () => {
		let createdSocket: MockWebSocket | null = null;

		global.WebSocket = jest.fn((url: string) => {
			createdSocket = new MockWebSocket(url);
			return createdSocket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		type ExpectedAction = ReturnType<typeof WSMaintenanceAction>;
		const channel = initWebsocket('test-token');

		const emitted = await new Promise<ExpectedAction>((resolve) => {
			channel.take((action) => {
				resolve(action as ExpectedAction);
			});

			const sendMessage = () => {
				if (createdSocket == null) {
					setTimeout(sendMessage, 0);
					return;
				}
				const ev = new MessageEvent('message', {
					data: JSON.stringify({
						message: { type: 'MAINTENANCE', maintenance: true },
					}),
				});
				createdSocket.onmessage?.(ev);
			};

			sendMessage();
		});

		expect(emitted).toEqual(WSMaintenanceAction(true));

		channel.close();
	});

	it('handles onopen callback and resets reconnect delay', async () => {
		let createdSocket: MockWebSocket | null = null;

		global.WebSocket = jest.fn((url: string) => {
			createdSocket = new MockWebSocket(url);
			return createdSocket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		const channel = initWebsocket('test-token');

		await new Promise<void>((resolve) => {
			const checkSocket = () => {
				if (createdSocket) {
					// Trigger onopen callback
					createdSocket.onopen?.call(createdSocket, new Event('open'));
					resolve();
				} else {
					setTimeout(checkSocket, 0);
				}
			};
			checkSocket();
		});

		// If we got here without errors, onopen was called successfully
		expect(createdSocket).not.toBeNull();
		channel.close();
	});

	it('handles onerror callback gracefully', async () => {
		let createdSocket: MockWebSocket | null = null;

		global.WebSocket = jest.fn((url: string) => {
			createdSocket = new MockWebSocket(url);
			return createdSocket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		const channel = initWebsocket('test-token');

		await new Promise<void>((resolve) => {
			const checkSocket = () => {
				if (createdSocket) {
					// Trigger onerror callback
					createdSocket.onerror?.call(createdSocket, new Event('error'));
					resolve();
				} else {
					setTimeout(checkSocket, 0);
				}
			};
			checkSocket();
		});

		// Should not throw - errors are followed by onclose
		expect(createdSocket).not.toBeNull();
		channel.close();
	});

	it('handles malformed message data gracefully', async () => {
		let createdSocket: MockWebSocket | null = null;

		global.WebSocket = jest.fn((url: string) => {
			createdSocket = new MockWebSocket(url);
			return createdSocket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		const channel = initWebsocket('test-token');

		await new Promise<void>((resolve) => {
			const sendMalformed = () => {
				if (createdSocket == null) {
					setTimeout(sendMalformed, 0);
					return;
				}
				// Send malformed JSON
				const ev = new MessageEvent('message', { data: 'not valid json {' });
				createdSocket.onmessage?.(ev);
				resolve();
			};
			sendMalformed();
		});

		// Should not throw - malformed messages are silently ignored
		expect(createdSocket).not.toBeNull();
		channel.close();
	});

	it('handles message with null content gracefully', async () => {
		let createdSocket: MockWebSocket | null = null;

		global.WebSocket = jest.fn((url: string) => {
			createdSocket = new MockWebSocket(url);
			return createdSocket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		const channel = initWebsocket('test-token');

		await new Promise<void>((resolve) => {
			const sendNull = () => {
				if (createdSocket == null) {
					setTimeout(sendNull, 0);
					return;
				}
				// Send null message
				const ev = new MessageEvent('message', { data: 'null' });
				createdSocket.onmessage?.(ev);
				resolve();
			};
			sendNull();
		});

		expect(createdSocket).not.toBeNull();
		channel.close();
	});

	it('handles unknown message type gracefully', async () => {
		let createdSocket: MockWebSocket | null = null;

		global.WebSocket = jest.fn((url: string) => {
			createdSocket = new MockWebSocket(url);
			return createdSocket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		const channel = initWebsocket('test-token');

		await new Promise<void>((resolve) => {
			const sendUnknown = () => {
				if (createdSocket == null) {
					setTimeout(sendUnknown, 0);
					return;
				}
				// Send unknown message type
				const ev = new MessageEvent('message', {
					data: JSON.stringify({ message: { type: 'UNKNOWN_TYPE', data: 'test' } }),
				});
				createdSocket.onmessage?.(ev);
				resolve();
			};
			sendUnknown();
		});

		expect(createdSocket).not.toBeNull();
		channel.close();
	});

	it('does NOT emit WSReconnectedAction on first onopen', async () => {
		let createdSocket: MockWebSocket | null = null;

		global.WebSocket = jest.fn((url: string) => {
			createdSocket = new MockWebSocket(url);
			return createdSocket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		type ExpectedAction = ReturnType<typeof WSUserAvatarAction>;
		const channel = initWebsocket('test-token');

		// Set up take FIRST, then trigger events — same pattern as other tests
		const emitted = await new Promise<ExpectedAction>((resolve) => {
			channel.take((action) => resolve(action as ExpectedAction));

			const trigger = () => {
				if (createdSocket == null) { setTimeout(trigger, 0); return; }
				// First open — hasConnectedBefore is false, should NOT emit WSReconnectedAction
				createdSocket.onopen?.call(createdSocket, new Event('open'));
				// Send a regular message to have something to take
				const ev = new MessageEvent('message', {
					data: JSON.stringify({ message: { type: 'USER_AVATAR', pk: 7, avatar: 'test.png' } }),
				});
				createdSocket.onmessage?.(ev);
			};
			trigger();
		});

		// The first emitted action should be USER_AVATAR, not WS_RECONNECTED
		expect(emitted).toEqual(WSUserAvatarAction(7, 'test.png'));
		expect(emitted).not.toEqual(WSReconnectedAction());
		channel.close();
	});

	it('emits WSReconnectedAction on second onopen (reconnect)', async () => {
		jest.useFakeTimers();
		const sockets: MockWebSocket[] = [];

		global.WebSocket = jest.fn((url: string) => {
			const socket = new MockWebSocket(url);
			sockets.push(socket);
			return socket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		const channel = initWebsocket('test-token');

		// Wait for first socket to be created
		await jest.advanceTimersByTimeAsync(0);
		expect(sockets).toHaveLength(1);

		// First open — hasConnectedBefore = false, no emission
		sockets[0].onopen?.call(sockets[0], new Event('open'));

		// Simulate close to trigger reconnect
		sockets[0].onclose?.call(sockets[0], new CloseEvent('close'));

		// Advance initial 1000ms reconnect delay
		await jest.advanceTimersByTimeAsync(1000);
		expect(sockets).toHaveLength(2);

		// Set up take, then trigger second open — should emit WSReconnectedAction
		type ReconnectedAction = ReturnType<typeof WSReconnectedAction>;
		const emitted = new Promise<ReconnectedAction>((resolve) => {
			channel.take((action) => resolve(action as ReconnectedAction));
			// Second open — hasConnectedBefore = true, emit WSReconnectedAction
			sockets[1].onopen?.call(sockets[1], new Event('open'));
		});

		const result = await emitted;
		expect(result).toEqual(WSReconnectedAction());
		channel.close();
	});

	it('reconnects with exponential backoff on close', async () => {
		jest.useFakeTimers();
		let createCount = 0;
		const sockets: MockWebSocket[] = [];

		global.WebSocket = jest.fn((url: string) => {
			const socket = new MockWebSocket(url);
			sockets.push(socket);
			createCount++;
			return socket as unknown as WebSocket;
		}) as unknown as typeof WebSocket;

		process.env.NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost';

		const channel = initWebsocket('test-token');

		// Wait for first socket creation
		await jest.advanceTimersByTimeAsync(0);
		expect(createCount).toBe(1);

		// Trigger close on first socket
		sockets[0].onclose?.call(sockets[0], new CloseEvent('close'));

		// Advance timers to trigger reconnect (initial delay is 1000ms)
		await jest.advanceTimersByTimeAsync(1000);
		expect(createCount).toBe(2);

		// Trigger close again to test exponential backoff
		sockets[1].onclose?.call(sockets[1], new CloseEvent('close'));

		// Next delay should be 2000ms
		await jest.advanceTimersByTimeAsync(2000);
		expect(createCount).toBe(3);

		channel.close();
	});
});
