import { getChatAICompany, publishChatAICompany, subscribeChatAICompany } from './chatAiCompany';

beforeEach(() => publishChatAICompany(null));
afterEach(() => publishChatAICompany(null));

it('publishes company changes and clears the active company on logout', () => {
	const notify = jest.fn();
	const unsubscribe = subscribeChatAICompany(notify);
	try {
		publishChatAICompany(7);
		expect(getChatAICompany()).toBe(7);
		publishChatAICompany(7);
		expect(notify).toHaveBeenCalledTimes(1);
		publishChatAICompany(8);
		expect(getChatAICompany()).toBe(8);
		publishChatAICompany(null);
		expect(getChatAICompany()).toBeNull();
		expect(notify).toHaveBeenCalledTimes(3);
	} finally {
		unsubscribe();
	}
});

it('unsubscribes one listener without affecting other subscribers', () => {
	const first = jest.fn();
	const second = jest.fn();
	const unsubscribeFirst = subscribeChatAICompany(first);
	const unsubscribeSecond = subscribeChatAICompany(second);
	try {
		unsubscribeFirst();
		unsubscribeFirst();
		publishChatAICompany(7);
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	} finally {
		unsubscribeFirst();
		unsubscribeSecond();
	}
});
