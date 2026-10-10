import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ChatAIAssistant, ChatAIFloatingButton, ChatAIPanel } from './ChatAIAssistant';
import { chatRequest, ChatAPIError, consumeChatStream } from './api';
import { useAppSelector, useAppDispatch } from '@/utils/hooks';
import { getAccessToken } from '@/store/selectors';
import type { ChatCapabilities, ChatCard, ChatMessage, ChatRecord, NavigationTarget } from './types';
import { ChatAIResults } from './ChatAIResults';
import { getChatAICompany, publishChatAICompany } from './company-context';
const mockPush = jest.fn();
const mockDispatch = jest.fn();
let mockPathname = '/dashboard/';
let mockCompanyId: number | string | null = 1;
let mockToken = 'local-test-token';
let mockProfileId = 1;
let mockLanguage: 'fr' | 'en' = 'fr';
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => new URLSearchParams(mockCompanyId === null ? '' : `company_id=${mockCompanyId}`),
}));
jest.mock('./api', () => ({
	...jest.requireActual('./api'),
	chatRequest: jest.fn(),
	consumeChatStream: jest.fn(),
}));
jest.mock('@/utils/helpers', () => ({ ...jest.requireActual('@/utils/helpers'), handleUnauthorized: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	useAppDispatch: jest.fn(),
	useLanguage: () => ({
		language: mockLanguage,
		setLanguage: jest.fn(),
		t: jest.requireActual('@/translations').translations[mockLanguage],
	}),
}));
jest.mock('@/store/selectors', () => ({ getAccessToken: jest.fn(), getProfilState: jest.fn() }));
jest.mock('@/store/services/factureClient', () => ({
	factureClientApi: {
		util: { invalidateTags: (tags: string[]) => ({ type: 'factureClient/invalidateTags', payload: tags }) },
	},
}));
jest.mock('@/store/services/client', () => ({
	clientApi: { util: { invalidateTags: (tags: string[]) => ({ type: 'client/invalidateTags', payload: tags }) } },
}));
jest.mock('@/store/services/dashboard', () => ({
	dashboardApi: { util: { invalidateTags: (tags: string[]) => ({ type: 'dashboard/invalidateTags', payload: tags }) } },
}));
jest.mock('@/store/services/reglement', () => ({
	reglementApi: { util: { invalidateTags: (tags: string[]) => ({ type: 'reglement/invalidateTags', payload: tags }) } },
}));
jest.mock('@/store/services/devi', () => ({
	deviApi: { util: { invalidateTags: (tags: string[]) => ({ type: 'devi/invalidateTags', payload: tags }) } },
}));
jest.mock('@/store/services/factureProForma', () => ({
	factureProFormaApi: {
		util: { invalidateTags: (tags: string[]) => ({ type: 'factureProForma/invalidateTags', payload: tags }) },
	},
}));
jest.mock('@/store/services/factureAvoir', () => ({
	factureAvoirApi: {
		util: { invalidateTags: (tags: string[]) => ({ type: 'factureAvoir/invalidateTags', payload: tags }) },
	},
}));
jest.mock('@/store/services/bonDeLivraison', () => ({
	bonDeLivraisonApi: {
		util: { invalidateTags: (tags: string[]) => ({ type: 'bonDeLivraison/invalidateTags', payload: tags }) },
	},
}));
jest.mock('@/store/services/stock', () => ({
	stockApi: { util: { invalidateTags: (tags: string[]) => ({ type: 'stock/invalidateTags', payload: tags }) } },
}));
const theme = createTheme();
const themed = (node: React.ReactNode) => <ThemeProvider theme={theme}>{node}</ThemeProvider>;
it('renders a single accessible fixed floating button and toggles it', () => {
	const toggle = jest.fn();
	render(themed(<ChatAIFloatingButton open={false} toggle={toggle} />));
	const button = screen.getByRole('button', { name: 'Ask AI Assistant' });
	expect(button).toHaveStyle({ position: 'fixed', width: '56px', height: '56px' });
	expect(button).toHaveAttribute('aria-expanded', 'false');
	fireEvent.click(button);
	expect(toggle).toHaveBeenCalledTimes(1);
});
it('minimizing preserves the composer DOM, Escape closes and focus returns', () => {
	const close = jest.fn();
	const { rerender } = render(
		themed(
			<ChatAIPanel close={close} minimized={false}>
				<input aria-label="Draft" defaultValue="unsent" />
			</ChatAIPanel>,
		),
	);
	expect(screen.getByRole('dialog')).toHaveFocus();
	fireEvent.keyDown(document, { key: 'Escape' });
	expect(close).toHaveBeenCalledTimes(1);
	rerender(
		themed(
			<ChatAIPanel close={close} minimized>
				<input aria-label="Draft" defaultValue="unsent" />
			</ChatAIPanel>,
		),
	);
	expect(screen.getByLabelText('Draft')).toHaveValue('unsent');
	expect(screen.getByRole('dialog', { hidden: true })).not.toBeVisible();
});
it('renders database text as text rather than executing HTML', () => {
	const { container } = render(
		themed(
			<ChatAIResults
				cards={[{ type: 'record_list', resource: 'client', items: [{ id: 1, name: '<img src=x onerror=alert(1)>' }] }]}
				navigate={jest.fn()}
				confirm={jest.fn()}
				pdf={jest.fn()}
			/>,
		),
	);
	expect(container.querySelector('img')).toBeNull();
	expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
});
it('shows the exact destructive target and only calls confirmation after a click', async () => {
	const confirm = jest.fn().mockResolvedValue(undefined);
	render(
		themed(
			<ChatAIResults
				cards={[
					{
						type: 'confirmation',
						resource: 'invoice',
						operation: 'delete',
						action_id: 'action-1',
						record_id: 12,
						label: '0012/26',
						warning: 'Suppression définitive',
						changes: {},
					},
				]}
				navigate={jest.fn()}
				confirm={confirm}
				pdf={jest.fn()}
			/>,
		),
	);
	expect(screen.getByText(/0012\/26/)).toBeInTheDocument();
	expect(confirm).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
	expect(confirm).not.toHaveBeenCalled();
	await act(async () => {
		fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }));
	});
	expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ action_id: 'action-1', record_id: 12 }));
});

const capabilities: ChatCapabilities = {
	companies: [1, 2].map((id) => ({
		id,
		name: `Company ${id}`,
		can_update: true,
		can_delete: true,
		can_create: true,
		can_print: true,
		suggestions: [],
		shortcuts: [
			{
				command: '/voir',
				title: 'Rechercher un document',
				help: 'Décrivez le client ou le produit.',
				example: '/voir devis client Atlas',
			},
		],
	})),
	languages: ['fr', 'en'],
};
const jsonResponse = (value: unknown) => ({ json: async () => value }) as Response;
const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
const assistantMessage = (text: string, cards: ChatCard[] = []): ChatMessage => ({
	id: `reply-${text}`,
	role: 'assistant',
	text,
	cards,
});
let handlers: Record<string, (init?: RequestInit) => Response | Promise<Response>>;
let conversationCount = 0;
beforeEach(() => {
	jest.clearAllMocks();
	mockPathname = '/dashboard/';
	mockCompanyId = 1;
	mockToken = 'local-test-token';
	mockProfileId = 1;
	mockLanguage = 'fr';
	publishChatAICompany(null);
	conversationCount = 0;
	handlers = {};
	jest
		.mocked(useAppSelector)
		.mockImplementation((selector) => (selector === getAccessToken ? mockToken : { id: mockProfileId }));
	jest.mocked(useAppDispatch).mockReturnValue(mockDispatch);
	jest.mocked(chatRequest).mockImplementation(async (path, _token, init) => {
		if (handlers[path]) return handlers[path](init);
		if (path.startsWith('capabilities/')) return jsonResponse(capabilities);
		if (path === 'conversations/') return jsonResponse({ id: `conversation-${++conversationCount}` });
		throw new Error(`Unexpected request: ${path}`);
	});
	jest.mocked(consumeChatStream).mockImplementation(async (response, receive) => {
		receive('message.completed', await response.json());
	});
});
const renderAssistant = async () => {
	const result = render(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	await screen.findByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' });
	return result;
};
const sendMessage = (text: string) => {
	fireEvent.change(screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' }), {
		target: { value: text },
	});
	fireEvent.click(screen.getByRole('button', { name: mockLanguage === 'en' ? 'Send' : 'Envoyer' }));
};
const historyItem = { id: 'old-conversation', title: 'Factures du client Atlas', updated_at: '2026-10-08T12:00:00Z' };
const quoteConfirmation: ChatCard = {
	type: 'confirmation',
	resource: 'quote',
	operation: 'delete',
	action_id: 'quote-delete',
	record_id: 12,
	label: 'DEV-0012/26',
	warning: 'Suppression définitive',
	changes: {},
};
const beginQuoteConfirmation = async () => {
	handlers['conversations/conversation-1/messages/'] = () =>
		jsonResponse(assistantMessage('Vérifiez ce devis.', [quoteConfirmation]));
	const result = await renderAssistant();
	sendMessage('/supprimer devis');
	await screen.findByText('Vérifiez ce devis.');
	fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
	fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette action' }));
	await waitFor(() =>
		expect(chatRequest).toHaveBeenCalledWith('actions/quote-delete/confirm/', expect.any(String), expect.any(Object)),
	);
	return result;
};

it('keeps a sent reply visible when an older history response finishes later', async () => {
	const historyBody = deferred<unknown>();
	handlers['conversations/?company_id=1'] = () => ({ json: () => historyBody.promise }) as Response;
	handlers['conversations/conversation-1/messages/'] = () =>
		jsonResponse(assistantMessage('Voici comment utiliser /voir.'));
	await renderAssistant();
	fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
	await screen.findByText('Chargement de l’historique…');
	fireEvent.click(screen.getByRole('button', { name: 'Revenir à la conversation' }));
	sendMessage('/voir');
	await screen.findByText('Voici comment utiliser /voir.');
	await act(async () => {
		historyBody.resolve([historyItem]);
	});
	expect(screen.getByText('Voici comment utiliser /voir.')).toBeVisible();
	expect(screen.getByRole('article', { name: 'Message de vous' })).toHaveTextContent('Vous');
	expect(screen.getByRole('article', { name: 'AI Assistant' })).toHaveTextContent('AI Assistant');
	expect(screen.queryByText(/Historique de cette société/)).not.toBeInTheDocument();
	expect(screen.queryByText('Chargement de l’historique…')).not.toBeInTheDocument();
});

it('does not replace a new conversation with an older history detail response', async () => {
	const oldDetail = deferred<unknown>();
	handlers['conversations/?company_id=1'] = () => jsonResponse([historyItem]);
	handlers['conversations/old-conversation/'] = () => ({ json: () => oldDetail.promise }) as Response;
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Nouvelle réponse'));
	await renderAssistant();
	fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
	fireEvent.click(await screen.findByRole('button', { name: `Ouvrir la conversation : ${historyItem.title}` }));
	await waitFor(() =>
		expect(chatRequest).toHaveBeenCalledWith('conversations/old-conversation/', expect.any(String), expect.any(Object)),
	);
	fireEvent.click(screen.getByRole('button', { name: 'Nouvelle conversation' }));
	sendMessage('Nouvelle demande');
	await screen.findByText('Nouvelle réponse');
	await act(async () => {
		oldDetail.resolve({ company_id: 1, messages: [assistantMessage('Ancienne réponse privée')] });
	});
	expect(screen.getByText('Nouvelle réponse')).toBeVisible();
	expect(screen.queryByText('Ancienne réponse privée')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' })).toBeEnabled();
});

it('ignores an old record selection without clearing the newer response loading state', async () => {
	const selection = deferred<unknown>();
	const latestReply = deferred<unknown>();
	handlers['conversations/conversation-1/messages/'] = () =>
		jsonResponse(
			assistantMessage('Un devis', [
				{ type: 'record_list', resource: 'quote', items: [{ id: 12, number: 'DEV-0012/26' }] },
			]),
		);
	handlers['conversations/conversation-1/selection/'] = () => ({ json: () => selection.promise }) as Response;
	handlers['conversations/conversation-2/messages/'] = () => ({ json: () => latestReply.promise }) as Response;
	await renderAssistant();
	sendMessage('/voir devis');
	await screen.findByText('DEV-0012/26');
	fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
	await waitFor(() =>
		expect(chatRequest).toHaveBeenCalledWith(
			'conversations/conversation-1/selection/',
			expect.any(String),
			expect.any(Object),
		),
	);
	fireEvent.click(screen.getByRole('button', { name: 'Nouvelle conversation' }));
	sendMessage('Une autre recherche');
	await waitFor(() =>
		expect(chatRequest).toHaveBeenCalledWith(
			'conversations/conversation-2/messages/',
			expect.any(String),
			expect.any(Object),
		),
	);
	await act(async () => {
		selection.resolve(assistantMessage('Ancienne sélection'));
	});
	expect(screen.queryByText('Ancienne sélection')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Annuler la réponse' })).toBeVisible();
	expect(
		screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' }),
	).toBeDisabled();
	await act(async () => {
		latestReply.resolve(assistantMessage('Recherche actuelle'));
	});
	expect(screen.getByText('Recherche actuelle')).toBeVisible();
	expect(screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' })).toBeEnabled();
});

it('keeps cancellation effective when a canceled stream still delivers its final event', async () => {
	const reply = deferred<unknown>();
	handlers['conversations/conversation-1/messages/'] = () => ({ json: () => reply.promise }) as Response;
	await renderAssistant();
	sendMessage('Recherche lente');
	await waitFor(() => expect(consumeChatStream).toHaveBeenCalled());
	fireEvent.click(screen.getByRole('button', { name: 'Annuler la réponse' }));
	expect(screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' })).toBeEnabled();
	await act(async () => {
		reply.resolve(assistantMessage('Réponse annulée'));
	});
	expect(screen.queryByText('Réponse annulée')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Annuler la réponse' })).not.toBeInTheDocument();
});

it('refreshes quote caches after a confirmed write without affecting a different company', async () => {
	const confirmation = deferred<Response>();
	handlers['actions/quote-delete/confirm/'] = () => confirmation.promise;
	const { rerender } = await beginQuoteConfirmation();
	mockCompanyId = 2;
	rerender(themed(<ChatAIAssistant />));
	await waitFor(() => expect(screen.getByText('Company 2')).toBeVisible());
	await act(async () => {
		confirmation.resolve(jsonResponse({ success: true }));
	});
	expect(mockDispatch).toHaveBeenCalledWith({ type: 'devi/invalidateTags', payload: ['Devi'] });
	expect(screen.queryByText(/Action effectuée\. Votre identité/)).not.toBeInTheDocument();
	expect(mockPush).not.toHaveBeenCalled();
	await waitFor(() => expect(screen.getByText('Company 2')).toBeVisible());
});

it('navigates to the quote list after a current confirmed quote deletion', async () => {
	const confirmation = deferred<Response>();
	handlers['actions/quote-delete/confirm/'] = () => confirmation.promise;
	await beginQuoteConfirmation();
	await act(async () => {
		confirmation.resolve(jsonResponse({ success: true }));
	});
	expect(mockPush).toHaveBeenCalledWith('/dashboard/devis/?company_id=1');
	expect(mockDispatch).toHaveBeenCalledWith({ type: 'devi/invalidateTags', payload: ['Devi'] });
	expect(screen.getByText(/Action effectuée\. Votre identité/)).toBeVisible();
});

it('does not redirect away from a page opened while a confirmation was pending', async () => {
	const confirmation = deferred<Response>();
	handlers['actions/quote-delete/confirm/'] = () => confirmation.promise;
	const { rerender } = await beginQuoteConfirmation();
	mockPathname = '/dashboard/clients/';
	rerender(themed(<ChatAIAssistant />));
	await act(async () => {
		confirmation.resolve(jsonResponse({ success: true }));
	});
	expect(mockPush).not.toHaveBeenCalled();
	expect(mockDispatch).toHaveBeenCalledWith({ type: 'devi/invalidateTags', payload: ['Devi'] });
});

it('does not offer unsupported edit or delete actions on payment results', () => {
	render(
		themed(
			<ChatAIResults
				cards={[{ type: 'record_list', resource: 'payment', items: [{ id: 1, number: 'REG-01' }] }]}
				navigate={jest.fn()}
				select={jest.fn()}
				permissions={{ can_update: true, can_delete: true, can_print: true }}
			/>,
		),
	);
	expect(screen.getByText(/REG-01/)).toBeVisible();
	expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
});

it('lets the user pick an authorized company despite an invalid URL and stale tab hint', async () => {
	mockCompanyId = 999;
	publishChatAICompany(999);
	render(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	expect(screen.getByText('Choisissez une société autorisée pour commencer.')).toBeVisible();
	fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Société' }));
	fireEvent.click(await screen.findByRole('option', { name: 'Company 2' }));
	expect(
		await screen.findByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' }),
	).toBeEnabled();
	expect(screen.getByRole('combobox', { name: 'Société' })).toHaveTextContent('Company 2');
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Réponse Company 2'));
	sendMessage('/voir');
	await screen.findByText('Réponse Company 2');
	expect(chatRequest).toHaveBeenCalledWith(
		'conversations/',
		expect.any(String),
		expect.objectContaining({ body: JSON.stringify({ company_id: 2 }) }),
	);
});

it.each(['-1', '1.5', '9007199254740993', '1e0'])(
	'uses the authorized active tab when URL company %s is malformed',
	async (hint) => {
		mockCompanyId = hint;
		publishChatAICompany(2);
		await renderAssistant();
		await waitFor(() => expect(screen.getByText('Company 2')).toBeVisible());
		expect(screen.queryByRole('combobox', { name: 'Société' })).not.toBeInTheDocument();
	},
);

it('retains the detail company and its conversation when moving from a different list to a neutral page', async () => {
	mockCompanyId = null;
	mockPathname = '/dashboard/clients/';
	publishChatAICompany(1);
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Résultats Company 1'));
	handlers['conversations/conversation-2/messages/'] = () => jsonResponse(assistantMessage('Résultats Company 2'));
	const { rerender } = await renderAssistant();
	sendMessage('/voir clients');
	await screen.findByText('Résultats Company 1');
	mockPathname = '/dashboard/devis/12/';
	mockCompanyId = 2;
	rerender(themed(<ChatAIAssistant />));
	await waitFor(() => expect(screen.getByText('Company 2')).toBeVisible());
	expect(screen.queryByText('Résultats Company 1')).not.toBeInTheDocument();
	sendMessage('/voir devis');
	await screen.findByText('Résultats Company 2');
	mockPathname = '/dashboard/users/';
	mockCompanyId = null;
	rerender(themed(<ChatAIAssistant />));
	await waitFor(() => expect(screen.getByText('Company 2')).toBeVisible());
	expect(screen.getByText('Résultats Company 2')).toBeVisible();
	expect(screen.queryByText('Résultats Company 1')).not.toBeInTheDocument();
});

it('clears shared company scope and private conversation state on logout', async () => {
	handlers['conversations/conversation-1/messages/'] = () =>
		jsonResponse(assistantMessage('Private old session response'));
	const { rerender } = await renderAssistant();
	sendMessage('/voir clients');
	await screen.findByText('Private old session response');
	expect(getChatAICompany()).toBe(1);
	mockToken = '';
	mockProfileId = 0;
	rerender(themed(<ChatAIAssistant />));
	expect(getChatAICompany()).toBeNull();
	expect(screen.queryByRole('button', { name: 'Ask AI Assistant' })).not.toBeInTheDocument();
	expect(screen.queryByText('Private old session response')).not.toBeInTheDocument();
	mockToken = 'new-user-token';
	mockProfileId = 2;
	mockCompanyId = null;
	rerender(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	expect(screen.getByText('Choisissez une société autorisée pour commencer.')).toBeVisible();
	expect(screen.queryByText('Private old session response')).not.toBeInTheDocument();
});

it('deletes the named history row while preserving the active conversation', async () => {
	const current = { ...historyItem, id: 'conversation-1', title: 'Mes factures actuelles' };
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Résultat actuel'));
	handlers['conversations/?company_id=1'] = () => jsonResponse([current, historyItem]);
	handlers['conversations/old-conversation/'] = () => jsonResponse({});
	await renderAssistant();
	sendMessage('Mes factures actuelles');
	await screen.findByText('Résultat actuel');
	fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
	const activeRow = await screen.findByRole('button', { name: `Ouvrir la conversation : ${current.title}` });
	expect(activeRow).toHaveAttribute('aria-current', 'true');
	expect(activeRow).toHaveTextContent('Conversation actuelle');
	expect(activeRow).toHaveTextContent(new Date(current.updated_at).toLocaleString());
	fireEvent.click(screen.getByRole('button', { name: `Supprimer la conversation : ${historyItem.title}` }));
	fireEvent.click(await screen.findByRole('button', { name: 'Supprimer la conversation' }));
	await waitFor(() =>
		expect(
			screen.queryByRole('button', { name: `Ouvrir la conversation : ${historyItem.title}` }),
		).not.toBeInTheDocument(),
	);
	expect(chatRequest).toHaveBeenCalledWith(
		'conversations/old-conversation/',
		expect.any(String),
		expect.objectContaining({ method: 'DELETE' }),
	);
	expect(chatRequest).not.toHaveBeenCalledWith(
		'conversations/conversation-1/',
		expect.any(String),
		expect.objectContaining({ method: 'DELETE' }),
	);
	expect(screen.getByRole('button', { name: `Ouvrir la conversation : ${current.title}` })).toHaveAttribute(
		'aria-current',
		'true',
	);
	fireEvent.click(screen.getByRole('button', { name: 'Revenir à la conversation' }));
	expect(screen.getByText('Résultat actuel')).toBeVisible();
});

it('clears the active conversation only when its own history row is deleted', async () => {
	const current = { ...historyItem, id: 'conversation-1', title: 'Conversation à supprimer' };
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Réponse à supprimer'));
	handlers['conversations/?company_id=1'] = () => jsonResponse([current, historyItem]);
	handlers['conversations/conversation-1/'] = () => jsonResponse({});
	await renderAssistant();
	sendMessage(current.title);
	await screen.findByText('Réponse à supprimer');
	fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
	fireEvent.click(await screen.findByRole('button', { name: `Supprimer la conversation : ${current.title}` }));
	fireEvent.click(await screen.findByRole('button', { name: 'Supprimer la conversation' }));
	await waitFor(() =>
		expect(screen.queryByRole('button', { name: `Ouvrir la conversation : ${current.title}` })).not.toBeInTheDocument(),
	);
	expect(screen.getByRole('button', { name: `Ouvrir la conversation : ${historyItem.title}` })).toBeVisible();
	fireEvent.click(screen.getByRole('button', { name: 'Revenir à la conversation' }));
	expect(screen.queryByText('Réponse à supprimer')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' })).toHaveValue(
		'',
	);
});

it('ignores a late history deletion result after the user starts another conversation', async () => {
	const deletion = deferred<Response>();
	const current = { ...historyItem, id: 'conversation-1', title: 'Ancienne conversation' };
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Ancienne réponse'));
	handlers['conversations/conversation-2/messages/'] = () =>
		jsonResponse(assistantMessage('Nouvelle réponse préservée'));
	handlers['conversations/?company_id=1'] = () => jsonResponse([current]);
	handlers['conversations/conversation-1/'] = () => deletion.promise;
	await renderAssistant();
	sendMessage(current.title);
	await screen.findByText('Ancienne réponse');
	fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
	fireEvent.click(await screen.findByRole('button', { name: `Supprimer la conversation : ${current.title}` }));
	fireEvent.click(await screen.findByRole('button', { name: 'Supprimer la conversation' }));
	await waitFor(() =>
		expect(chatRequest).toHaveBeenCalledWith(
			'conversations/conversation-1/',
			expect.any(String),
			expect.objectContaining({ method: 'DELETE' }),
		),
	);
	fireEvent.click(screen.getByRole('button', { name: 'Nouvelle conversation' }));
	sendMessage('Une nouvelle demande');
	await screen.findByText('Nouvelle réponse préservée');
	await act(async () => deletion.resolve(jsonResponse({})));
	expect(screen.getByText('Nouvelle réponse préservée')).toBeVisible();
	expect(screen.queryByText('Ancienne réponse')).not.toBeInTheDocument();
});

it('stops forcing stream scroll after the reader scrolls up, and resumes on a new message', async () => {
	const streamDone = deferred<void>();
	let receive!: Parameters<typeof consumeChatStream>[1];
	jest.mocked(consumeChatStream).mockImplementationOnce(async (_response, callback) => {
		receive = callback;
		await streamDone.promise;
	});
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Nouvelle réponse'));
	await renderAssistant();
	const log = screen.getByRole('log', { name: 'Conversation' });
	const bottom = log.lastElementChild as HTMLElement;
	const scrollToBottom = jest.fn();
	bottom.scrollIntoView = scrollToBottom;
	Object.defineProperties(log, {
		scrollHeight: { configurable: true, value: 1000 },
		clientHeight: { configurable: true, value: 300 },
		scrollTop: { configurable: true, writable: true, value: 700 },
	});
	sendMessage('Expliquer ce document');
	await waitFor(() => expect(receive).toBeDefined());
	scrollToBottom.mockClear();
	log.scrollTop = 100;
	fireEvent.scroll(log);
	await act(async () => receive('message.delta', { text: 'Explication en cours' }));
	expect(screen.getByText('Explication en cours')).toBeVisible();
	expect(scrollToBottom).not.toHaveBeenCalled();
	log.scrollTop = 700;
	fireEvent.scroll(log);
	await act(async () => receive('message.delta', { text: ' avec détails' }));
	expect(scrollToBottom).toHaveBeenCalled();
	log.scrollTop = 100;
	fireEvent.scroll(log);
	scrollToBottom.mockClear();
	await act(async () => {
		receive('message.completed', assistantMessage('Explication terminée'));
		streamDone.resolve();
	});
	expect(scrollToBottom).not.toHaveBeenCalled();
	sendMessage('Ma question suivante');
	await screen.findByText('Nouvelle réponse');
	expect(scrollToBottom).toHaveBeenCalled();
});

it('shows slash help while choosing a command and releases space once details are typed', async () => {
	await renderAssistant();
	const input = screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' });
	fireEvent.change(input, { target: { value: '/' } });
	expect(screen.getByText('Raccourcis de l’assistant')).toBeVisible();
	fireEvent.change(input, { target: { value: '/voir' } });
	expect(screen.getByText('Rechercher un document')).toBeVisible();
	fireEvent.change(input, { target: { value: '/voir ' } });
	expect(screen.queryByText('Raccourcis de l’assistant')).not.toBeInTheDocument();
	fireEvent.change(input, { target: { value: '/voir devis du client Atlas' } });
	expect(screen.queryByText('Raccourcis de l’assistant')).not.toBeInTheDocument();
	expect(input).toHaveValue('/voir devis du client Atlas');
});

const commercialDocuments = [
	{
		resource: 'proforma',
		label: 'Facture pro forma',
		path: 'facture-pro-forma',
		api: 'factureProForma',
		tag: 'FactureProForma',
	},
	{
		resource: 'credit_note',
		label: 'Facture d’avoir',
		path: 'facture-avoir',
		api: 'factureAvoir',
		tag: 'FactureAvoir',
	},
	{
		resource: 'delivery_note',
		label: 'Bon de livraison',
		path: 'bon-de-livraison',
		api: 'bonDeLivraison',
		tag: 'BonDeLivraison',
	},
] as const;

it.each(commercialDocuments)(
	'dispatches $resource result actions with the correct resource and selected record',
	({ resource, label, path }) => {
		const navigate = jest.fn();
		const select = jest.fn();
		const pdf = jest.fn();
		const navigation: NavigationTarget = {
			application: 'facturation',
			resource,
			identifier: 42,
			company_id: 1,
			path: `/dashboard/${path}/42/?company_id=1`,
		};
		render(
			themed(
				<ChatAIResults
					cards={[{ type: 'record_list', resource, items: [{ id: 42, number: '0042/26', navigation }] }]}
					navigate={navigate}
					select={select}
					pdf={pdf}
					permissions={{ can_update: true, can_delete: true, can_print: true }}
				/>,
			),
		);
		expect(screen.getByText(label)).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Voir' }));
		fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
		fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
		fireEvent.click(screen.getByRole('button', { name: 'PDF' }));
		expect(navigate).toHaveBeenCalledWith(navigation);
		expect(select).toHaveBeenNthCalledWith(1, resource, 42, 'edit');
		expect(select).toHaveBeenNthCalledWith(2, resource, 42, 'delete');
		expect(pdf).toHaveBeenCalledWith(42, resource);
	},
);

it.each(commercialDocuments)(
	'hides unavailable mutation and print actions on $resource cards',
	({ resource, path }) => {
		const navigation: NavigationTarget = {
			application: 'facturation',
			resource,
			identifier: 42,
			company_id: 1,
			path: `/dashboard/${path}/42/?company_id=1`,
		};
		render(
			themed(
				<ChatAIResults
					cards={[{ type: 'record_list', resource, items: [{ id: 42, number: '0042/26', navigation }] }]}
					navigate={jest.fn()}
					select={jest.fn()}
					pdf={jest.fn()}
					permissions={{ can_update: false, can_delete: false, can_print: false }}
				/>,
			),
		);
		expect(screen.getByRole('button', { name: 'Voir' })).toBeVisible();
		for (const name of ['Modifier', 'Supprimer', 'PDF'])
			expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
	},
);

it.each(commercialDocuments)(
	'refreshes $resource and dependent caches only after confirmed deletion, then opens its own list',
	async ({ resource, path, api, tag }) => {
		const confirmation = deferred<Response>();
		const card: ChatCard = {
			...quoteConfirmation,
			resource,
			action_id: `${resource}-delete`,
			label: '0042/26',
			record_id: 42,
		};
		handlers['conversations/conversation-1/messages/'] = () =>
			jsonResponse(assistantMessage('Vérifiez le document sélectionné.', [card]));
		handlers[`actions/${resource}-delete/confirm/`] = () => confirmation.promise;
		await renderAssistant();
		sendMessage(`/supprimer ${resource}`);
		await screen.findByText('Vérifiez le document sélectionné.');
		fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
		expect(mockDispatch).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette action' }));
		await waitFor(() =>
			expect(chatRequest).toHaveBeenCalledWith(
				`actions/${resource}-delete/confirm/`,
				expect.any(String),
				expect.objectContaining({ method: 'POST', body: JSON.stringify({ confirmed: true }) }),
			),
		);
		expect(mockDispatch).not.toHaveBeenCalled();
		await act(async () => confirmation.resolve(jsonResponse({ success: true })));
		expect(mockDispatch).toHaveBeenCalledWith({ type: `${api}/invalidateTags`, payload: [tag] });
		expect(mockDispatch).toHaveBeenCalledWith({ type: 'factureClient/invalidateTags', payload: ['FactureClient'] });
		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'stock/invalidateTags',
			payload: ['StockBalance', 'StockMovement', 'StockReceipt', 'Inventory'],
		});
		expect(mockDispatch).toHaveBeenCalledWith({ type: 'dashboard/invalidateTags', payload: ['Dashboard'] });
		expect(mockPush).toHaveBeenCalledWith(`/dashboard/${path}/?company_id=1`);
	},
);

it('does not invalidate caches or navigate when a delivery-note deletion is rejected', async () => {
	const card: ChatCard = { ...quoteConfirmation, resource: 'delivery_note', action_id: 'delivery-denied' };
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Vérifiez ce bon.', [card]));
	handlers['actions/delivery-denied/confirm/'] = () => {
		throw new ChatAPIError('PERMISSION_DENIED');
	};
	await renderAssistant();
	sendMessage('/supprimer bon de livraison');
	await screen.findByText('Vérifiez ce bon.');
	fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
	fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette action' }));
	await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmer cette action' })).toBeEnabled());
	expect(mockDispatch).not.toHaveBeenCalled();
	expect(mockPush).not.toHaveBeenCalled();
	expect(screen.queryByText(/Action effectuée\. Votre identité/)).not.toBeInTheDocument();
});

const readOnlyCards: Array<{
	resource: string;
	label: string;
	path: string;
	record: ChatRecord;
	expected: string[];
	hidden?: string[];
}> = [
	{
		resource: 'article',
		label: 'Article',
		path: 'articles/42/?company_id=1',
		record: {
			id: 42,
			number: 'ART-42',
			designation: 'Panneau acoustique',
			type_article: 'Produit',
			archived: true,
			sale_amount: '75.50',
			sale_currency: 'MAD',
			purchase_amount: '43.25',
			purchase_currency: 'EUR',
		},
		expected: [
			'Designation : Panneau acoustique',
			'Type : Produit',
			'Archivé',
			'Prix de vente : 75,50 MAD',
			"Prix d'achat : 43,25 EUR",
		],
	},
	{
		resource: 'article',
		label: 'Article',
		path: 'articles/42/?company_id=1',
		record: {
			id: 42,
			number: 'LOT-A',
			designation: 'Lot test',
			sale_amount: '75.50',
			sale_currency: 'MAD',
			sale_label: 'price_excl_tax',
		},
		expected: ['Prix H.T. : 75,50 MAD'],
		hidden: ['Prix de vente', "Prix d'achat", 'price_excl_tax'],
	},
	{
		resource: 'payment',
		label: 'Règlement',
		path: 'reglements/42/?company_id=1',
		record: {
			id: 42,
			number: 'FAC-42',
			client: 'Client test',
			date: '2026-10-08',
			status: 'Valide',
			amount: '500',
			currency: 'MAD',
		},
		expected: ['Facture FAC-42', 'Client test', '08/10/2026', '500,00 MAD', 'Valide'],
	},
	{
		resource: 'user',
		label: 'Utilisateur',
		path: 'users/42/',
		record: { id: 42, name: 'Salma Test', email: 'salma@example.test', is_active: false, is_staff: true },
		expected: ['Salma Test', 'Email : salma@example.test', 'Admin : Oui', 'Active : Inactif'],
	},
	{
		resource: 'stock_balance',
		label: 'Stock',
		path: 'stock/42/?company_id=1',
		record: {
			id: 42,
			number: 'ART-42',
			product_name: 'Panneau acoustique',
			location: 'Dépôt test',
			status: 'a_approvisionner',
			physical_quantity: '7',
			reserved_quantity: '9',
			available_quantity: '-2',
			incoming_quantity: '4',
			projected_quantity: '2',
			stock_minimum: '3',
		},
		expected: [
			'Désignation : Panneau acoustique',
			'Emplacement : Dépôt test',
			'À approvisionner',
			'Physique : 7,000',
			'Réservé : 9,000',
			'Disponible : -2,000',
			'Entrant : 4,000',
			'Projeté : 2,000',
			'Minimum : 3,000',
		],
		hidden: ['a_approvisionner'],
	},
	{
		resource: 'stock_movement',
		label: 'Mouvement de stock',
		path: 'stock/movements/42/?company_id=1',
		record: { id: 42, number: 'ART-42', status: 'receipt', quantity: '3', balance_after: '7' },
		expected: ['Réception', 'Quantité : 3,000', 'Stock après mouvement : 7,000'],
		hidden: ['receipt'],
	},
	{
		resource: 'stock_receipt',
		label: 'Réception de stock',
		path: 'stock/receipts/42/?company_id=1',
		record: {
			id: 42,
			number: 'REC-42',
			status: 'validated',
			logistics_number: 'LOG-42',
			supplier: 'Fournisseur test',
			date_validated: '2026-10-08T12:00:00Z',
			lines: [
				{ id: 1, reference: 'ART-42', product_name: 'Panneau acoustique', location: 'Dépôt test', quantity: '3' },
			],
		},
		expected: [
			'Validée',
			'Dossier logistique : LOG-42',
			'Fournisseur : Fournisseur test',
			'Date de validation : 08/10/2026',
			'Quantité reçue : 3,000',
		],
		hidden: ['validated'],
	},
	{
		resource: 'stock_inventory',
		label: 'Inventaire',
		path: 'stock/inventories/42/?company_id=1',
		record: {
			id: 42,
			number: 'INV-42',
			status: 'cancelled',
			location: 'Dépôt test',
			lines: [
				{
					id: 1,
					reference: 'ART-42',
					product_name: 'Panneau acoustique',
					expected_quantity: '7',
					counted_quantity: '6',
				},
			],
		},
		expected: ['Annulé', 'Emplacement : Dépôt test', 'Quantité attendue : 7,000', 'Quantité comptée : 6,000'],
		hidden: ['cancelled'],
	},
	{
		resource: 'logistics_order',
		label: 'Dossier logistique',
		path: 'logistique/42/?company_id=1',
		record: {
			id: 42,
			number: 'LOG-42',
			status: 'Transit',
			global_status: 'En cours',
			supplier: 'Fournisseur test',
			date_expected: '2026-10-10',
			date_received: '2026-10-11',
			lines: [
				{
					id: 1,
					reference: 'ART-42',
					product_name: 'Panneau acoustique',
					client: 'Client test',
					quantity: '3',
					received_quantity: '2',
				},
			],
		},
		expected: [
			'Transit',
			'Statut global : En cours',
			'Fournisseur : Fournisseur test',
			'Date prévue : 10/10/2026',
			'Date réelle : 11/10/2026',
			'Client : Client test',
			'Quantité : 3,000',
			'Reçu : 2,000',
		],
	},
];
it.each(readOnlyCards)(
	'projects readable $resource data with Voir only, even for a writer',
	({ resource, label, path, record, expected, hidden = [] }) => {
		const navigate = jest.fn();
		const select = jest.fn();
		const pdf = jest.fn();
		const navigation: NavigationTarget = {
			application: 'facturation',
			resource,
			identifier: 42,
			company_id: 1,
			path: '/dashboard/' + path,
		};
		const projected = { ...record, navigation, internal_debug: 'private ignored value' };
		const { container } = render(
			themed(
				<ChatAIResults
					cards={[{ type: 'record_list', resource, items: [projected] }]}
					navigate={navigate}
					select={select}
					pdf={pdf}
					permissions={{ can_update: true, can_delete: true, can_print: true }}
				/>,
			),
		);
		expect(screen.getByText(label, { exact: true })).toBeVisible();
		for (const text of expected) expect(screen.getByText(text, { exact: true })).toBeVisible();
		for (const text of hidden) expect(container.textContent).not.toContain(text);
		for (const key of [
			'internal_debug',
			'private ignored value',
			'physical_quantity',
			'balance_after',
			'type_article',
			'sale_amount',
			'is_staff',
			'date_validated',
			'received_quantity',
		])
			expect(container.textContent).not.toContain(key);
		expect(screen.getAllByRole('button')).toHaveLength(1);
		fireEvent.click(screen.getByRole('button', { name: 'Voir' }));
		expect(navigate).toHaveBeenCalledWith(navigation);
		expect(select).not.toHaveBeenCalled();
		expect(pdf).not.toHaveBeenCalled();
	},
);
it('bounds operational detail lines while retaining a link to the complete record', () => {
	const lines = Array.from({ length: 11 }, (_, i) => ({
		id: i + 1,
		reference: `ART-UNIQUE-${i + 1}`,
		product_name: `Produit test ${i + 1}`,
		expected_quantity: '3',
		counted_quantity: '2',
	}));
	render(
		themed(
			<ChatAIResults
				cards={[
					{
						type: 'record_list',
						resource: 'stock_inventory',
						items: [
							{
								id: 42,
								number: 'INV-42',
								lines,
								has_more_lines: true,
								navigation: {
									application: 'facturation',
									resource: 'stock_inventory',
									identifier: 42,
									company_id: 1,
									path: '/dashboard/stock/inventories/42/?company_id=1',
								},
							},
						],
					},
				]}
				navigate={jest.fn()}
			/>,
		),
	);
	expect(screen.getByText('Référence : ART-UNIQUE-10')).toBeVisible();
	expect(screen.queryByText('Référence : ART-UNIQUE-11')).not.toBeInTheDocument();
	expect(screen.getByText('D’autres lignes sont disponibles dans la fiche.')).toBeVisible();
	expect(screen.getByRole('button', { name: 'Voir' })).toBeVisible();
});
it.each([
	{ resource: 'invoice', field: 'internal_column' },
	{ resource: 'quote', field: 'termes_paiement' },
	{ resource: 'credit_note', field: 'date_echeance' },
	{ resource: 'delivery_note', field: 'termes_paiement' },
	{ resource: 'client', field: 'remarque' },
	{ resource: 'article', field: 'remarque' },
	{ resource: '__proto__', field: 'remarque' },
])('blocks unsupported $resource.$field confirmation without exposing keys or values', ({ resource, field }) => {
	const confirm = jest.fn();
	const { container } = render(
		themed(
			<ChatAIResults
				cards={[
					{
						type: 'confirmation',
						resource,
						operation: 'update',
						action_id: 'unsupported',
						label: 'Fiche test',
						changes: { [field]: 'hidden replacement marker' },
						before: { [field]: 'hidden prior marker' },
					},
				]}
				navigate={jest.fn()}
				confirm={confirm}
			/>,
		),
	);
	expect(screen.getByText(/Cette action contient un champ non pris en charge/)).toBeVisible();
	expect(screen.getByRole('button', { name: 'Vérifier cette action' })).toBeDisabled();
	fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
	expect(screen.queryByRole('button', { name: 'Confirmer cette action' })).not.toBeInTheDocument();
	for (const value of [field, 'hidden replacement marker', 'hidden prior marker'])
		expect(container.textContent).not.toContain(value);
	expect(confirm).not.toHaveBeenCalled();
});
it.each([
	{ language: 'fr' as const, terms: 'Termes de paiement', date: "Date d'échéance" },
	{ language: 'en' as const, terms: 'Payment terms', date: 'Due date' },
])('uses actual $language invoice form labels in the card and confirmation dialog', ({ language, terms, date }) => {
	mockLanguage = language;
	const { container } = render(
		themed(
			<ChatAIResults
				cards={[
					{
						type: 'confirmation',
						resource: 'invoice',
						operation: 'update',
						action_id: 'labels',
						label: 'FAC-42',
						changes: { termes_paiement: 'À réception', date_echeance: '2026-10-31' },
						before: { termes_paiement: '30 jours', date_echeance: '2026-10-20' },
					},
				]}
				navigate={jest.fn()}
				confirm={jest.fn()}
			/>,
		),
	);
	expect(screen.getByText(`${terms} : 30 jours → À réception`)).toBeVisible();
	expect(screen.getByText(`${date} : 2026-10-20 → 2026-10-31`)).toBeVisible();
	fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
	expect(screen.getByText(terms, { exact: true })).toBeVisible();
	expect(screen.getByText(date, { exact: true })).toBeVisible();
	expect(screen.getByRole('button', { name: 'Confirmer cette action' })).toBeEnabled();
	expect(container.textContent).not.toContain('termes_paiement');
	expect(container.textContent).not.toContain('date_echeance');
});

it.each([
	['confirmed_update', 'Modification effectuée. Votre identité est enregistrée dans l’historique.'],
	['confirmed_delete', 'Deletion completed. Your identity is recorded in the history.'],
	['expired', 'Cette demande de confirmation a expiré. Faites une nouvelle demande pour continuer.'],
	['stale', 'The record has changed since this request. Make a new request before confirming.'],
	['unavailable', 'Cette action n’est plus disponible. Faites une nouvelle demande pour continuer.'],
] as const)('renders replayed confirmation %s without another action or stale values', (status, message) => {
	const confirm = jest.fn();
	render(
		themed(
			<ChatAIResults
				cards={[{ type: 'confirmation_status', status, message }]}
				navigate={jest.fn()}
				confirm={confirm}
				pdf={jest.fn()}
			/>,
		),
	);
	expect(screen.getByText(message)).toBeVisible();
	expect(screen.queryByRole('button')).not.toBeInTheDocument();
	expect(screen.queryByText('Aucun résultat trouvé.')).not.toBeInTheDocument();
	expect(confirm).not.toHaveBeenCalled();
});

it.each([
	['/dashboard/facture-client/11/', { interface_language: 'en', invoice_id: 11 }],
	['/dashboard/', { interface_language: 'en' }],
])('retries the original context from %s after navigating to another invoice', async (initialPath, initialContext) => {
	mockPathname = initialPath;
	mockLanguage = 'en';
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Original answer'));
	jest.mocked(consumeChatStream).mockRejectedValueOnce(new ChatAPIError('INCOMPLETE_RESPONSE'));
	const { rerender } = await renderAssistant();
	sendMessage('Explain this invoice');
	await screen.findByRole('button', { name: mockLanguage === 'en' ? 'Retry' : 'Réessayer' });
	const requests = () =>
		jest
			.mocked(chatRequest)
			.mock.calls.filter(([path]) => path === 'conversations/conversation-1/messages/')
			.map(([, , init]) => JSON.parse(init!.body as string));
	expect(requests()[0].context).toEqual(initialContext);
	mockPathname = '/dashboard/facture-client/22/';
	mockLanguage = 'fr';
	rerender(themed(<ChatAIAssistant />));
	fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
	await screen.findByText('Original answer');
	expect(requests()).toHaveLength(2);
	expect(requests()[1]).toEqual(requests()[0]);
	expect(screen.getAllByRole('article', { name: 'Message de vous' })).toHaveLength(1);
	expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Current answer'));
	sendMessage('Explique cette facture maintenant');
	await screen.findByText('Current answer');
	expect(requests()[2].context).toEqual({ interface_language: 'fr', invoice_id: 22 });
	expect(requests()[2].request_id).not.toBe(requests()[0].request_id);
});

it.each(['conversation', 'company'])('clears a failed retry when changing %s', async (scope) => {
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Never completed'));
	jest.mocked(consumeChatStream).mockRejectedValueOnce(new ChatAPIError('INCOMPLETE_RESPONSE'));
	const { rerender } = await renderAssistant();
	sendMessage('Old request');
	await screen.findByRole('button', { name: mockLanguage === 'en' ? 'Retry' : 'Réessayer' });
	if (scope === 'conversation') {
		fireEvent.click(screen.getByRole('button', { name: 'Nouvelle conversation' }));
	} else {
		mockCompanyId = 2;
		rerender(themed(<ChatAIAssistant />));
		await screen.findByText('Company 2');
	}
	expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
	expect(screen.queryByText('Old request')).not.toBeInTheDocument();
	expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it.each([
	['fr', 'Affiche les factures impayées.'],
	['en', 'Show unpaid customer invoices.'],
] as const)('sends the complete %s suggestion immediately in the active company', async (language, question) => {
	mockLanguage = language;
	mockCompanyId = 2;
	const scoped = {
		...capabilities,
		companies: capabilities.companies.map((company) => ({
			...company,
			suggestions: [company.id === 2 ? question : 'Suggestion from another company'],
		})),
	};
	handlers[`capabilities/?language=${language}`] = () => jsonResponse(scoped);
	handlers['conversations/conversation-1/messages/'] = () => jsonResponse(assistantMessage('Authorized results.'));
	await renderAssistant();
	expect(screen.queryByRole('button', { name: 'Suggestion from another company' })).not.toBeInTheDocument();
	fireEvent.change(screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' }), {
		target: { value: 'Unsent draft' },
	});
	fireEvent.click(screen.getByRole('button', { name: question }));
	await screen.findByText('Authorized results.');
	const calls = jest.mocked(chatRequest).mock.calls;
	const creation = calls.find(([path]) => path === 'conversations/');
	expect(JSON.parse(creation![2]!.body as string)).toEqual({ company_id: 2 });
	const sent = calls.filter(([path]) => path.endsWith('/messages/'));
	expect(sent).toHaveLength(1);
	expect(JSON.parse(sent[0][2]!.body as string)).toEqual(
		expect.objectContaining({
			text: question,
			context: { interface_language: language },
		}),
	);
	expect(screen.getByRole('textbox', { name: mockLanguage === 'en' ? 'Your message' : 'Votre message' })).toHaveValue(
		'',
	);
	expect(screen.getByText(question)).toBeInTheDocument();
});

it('does not add hardcoded suggestions outside the selected company permissions', async () => {
	await renderAssistant();
	expect(screen.queryByRole('button', { name: 'Trouver un devis par client et produit' })).not.toBeInTheDocument();
	expect(jest.mocked(chatRequest).mock.calls.filter(([path]) => path === 'conversations/')).toHaveLength(0);
});

it('closes shortcut help and clears its draft when starting a new conversation', async () => {
	await renderAssistant();
	fireEvent.change(screen.getByRole('textbox', { name: 'Votre message' }), { target: { value: '/voir client Demo' } });
	fireEvent.click(screen.getByRole('button', { name: '/ Raccourcis' }));
	expect(screen.getByRole('listbox')).toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Nouvelle conversation' }));
	expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox', { name: 'Votre message' })).toHaveValue('');
});
