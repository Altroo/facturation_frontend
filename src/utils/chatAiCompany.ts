let activeCompany: number | null = null;
const listeners = new Set<() => void>();
export const publishChatAICompany = (id: number | null) => {
	if (activeCompany === id) return;
	activeCompany = id;
	listeners.forEach((notify) => notify());
};
export const getChatAICompany = () => activeCompany;
export const subscribeChatAICompany = (notify: () => void) => {
	listeners.add(notify);
	return () => {
		listeners.delete(notify);
	};
};
