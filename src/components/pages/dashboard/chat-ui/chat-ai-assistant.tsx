'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	IconButton,
	ListItemButton,
	MenuItem,
	Portal,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { BusinessOutlined, DeleteOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector, useLanguage } from '@/utils/hooks';
import { getAccessToken, getProfilState } from '@/store/selectors';
import {
	chatErrorCode,
	isChatMessage,
	safeNavigation,
	getChatAICompany,
	publishChatAICompany,
	subscribeChatAICompany,
} from '@/utils/helpers';
import { chatRequest, consumeChatStream, downloadInvoicePDF } from '@/utils/apiHelpers';

import { factureClientApi } from '@/store/services/factureClient';
import { deviApi } from '@/store/services/devi';
import { factureProFormaApi } from '@/store/services/factureProForma';
import { factureAvoirApi } from '@/store/services/factureAvoir';
import { bonDeLivraisonApi } from '@/store/services/bonDeLivraison';
import { stockApi } from '@/store/services/stock';
import { clientApi } from '@/store/services/client';
import { dashboardApi } from '@/store/services/dashboard';
import { reglementApi } from '@/store/services/reglement';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import styles from '@/styles/dashboard/chat-ui/chat-ui.module.sass';
import { ChatAIHeader, ChatAIInterface, ChatAIMessageBox, ChatAIWelcome } from './chat-ai-interface';
import { ChatAIComposer } from './chat-ai-composer';
import { ChatAIResults } from './chat-ai-results';
import type { ChatCapabilities, ChatCard, ChatMessage, NavigationTarget } from '@/types/chatAiTypes';

export { ChatAIFloatingButton, ChatAIPanel } from './chat-ai-interface';

const errorText: Record<string, string> = {
	PERMISSION_DENIED: 'Vous n’avez pas accès à ces informations.',
	NOT_FOUND: 'Aucun résultat autorisé trouvé.',
	CONTEXT_EXPIRED: 'Le contexte a expiré ou vos autorisations ont changé. Démarrez une nouvelle conversation.',
	NOT_AUTHENTICATED: 'Votre session a expiré.',
	BUSY: 'L’assistant est occupé. Réessayez dans un instant.',
	INVALID_MODEL_OUTPUT:
		'Je n’ai pas pu interpréter cette demande. Précisez votre recherche ou utilisez /aide pour choisir un module.',
	INCOMPLETE_RESPONSE: 'La réponse est incomplète. Vous pouvez réessayer ou utiliser /aide pour choisir un module.',
	TOOL_TIMEOUT: 'L’opération a pris trop de temps. Vérifiez son résultat avant de recommencer.',
	MODEL_TIMEOUT: 'La réponse a pris trop de temps. Réessayez avec une recherche plus précise.',
	SENSITIVE_INPUT: 'Retirez les mots de passe ou secrets avant d’envoyer ce message.',
	INVALID_ARGUMENTS: 'Précisez votre demande, le numéro ou la période.',
	MULTIPLE_MATCHES: 'Plusieurs résultats correspondent. Précisez votre recherche.',
	STALE_ACTION: 'Le document a changé. Demandez une nouvelle prévisualisation.',
	ACTION_REJECTED: 'L’application a refusé cette action selon ses règles de gestion.',
	CONTEXT_LIMIT: 'Cette conversation est complète. Démarrez une nouvelle conversation.',
};

const errorTextEnglish: Record<string, string> = {
	PERMISSION_DENIED: 'You do not have permission to access this information.',
	NOT_FOUND: 'No authorized matching result was found.',
	CONTEXT_EXPIRED: 'The context expired or your permissions changed. Start a new conversation.',
	NOT_AUTHENTICATED: 'Your session expired.',
	BUSY: 'The assistant is busy. Please try again shortly.',
	INVALID_MODEL_OUTPUT:
		'I could not interpret that request. Make your search more specific or use /help to choose a module.',
	INCOMPLETE_RESPONSE: 'The response is incomplete. Retry or use /help to choose a module.',
	MODEL_TIMEOUT: 'The response took too long. Try a more specific search.',
	TOOL_TIMEOUT: 'The operation took too long. Please try again.',
	SENSITIVE_INPUT: 'Remove passwords or secrets before sending this message.',
	INVALID_ARGUMENTS: 'Specify your request, the record or the period.',
	MULTIPLE_MATCHES: 'Several results match. Make your search more specific.',
	STALE_ACTION: 'The record changed. Request a new preview.',
	ACTION_REJECTED: 'The application rejected this action under its business rules.',
	CONTEXT_LIMIT: 'This conversation is full. Start a new conversation.',
};

const chatErrorMessage = (error: unknown, language: 'fr' | 'en') =>
	(language === 'en' ? errorTextEnglish : errorText)[chatErrorCode(error)] ||
	(language === 'en'
		? 'The assistant is unavailable. You can retry.'
		: 'L’assistant est indisponible. Vous pouvez réessayer.');

type ChatAIRetryRequest = {
	text: string;
	id: string;
	context: { interface_language: 'fr' | 'en'; invoice_id?: number };
};

const ChatAIWorkspace = ({
	companyId,
	token,
	capabilities,
	close,
	companyControl,
}: {
	close: () => void;
	companyControl: React.ReactNode;
	companyId: number;
	token: string;
	capabilities: ChatCapabilities;
}) => {
	const router = useRouter();
	const { language: interfaceLanguage } = useLanguage();
	const pathname = usePathname();
	const dispatch = useAppDispatch();
	const company = capabilities.companies.find((item) => item.id === companyId)!;
	const [conversation, setConversation] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draft, setDraft] = useState('');
	const [composerVersion, setComposerVersion] = useState(0);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [delta, setDelta] = useState('');
	const [historyOpen, setHistoryOpen] = useState(false);
	const [pendingDeletion, setPendingDeletion] = useState<string | null>(null);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [history, setHistory] = useState<{ id: string; title?: string; updated_at: string }[]>([]);
	const controller = useRef<AbortController | null>(null);
	const active = useRef(true);
	const requestEpoch = useRef(0);
	const currentPath = useRef(pathname);
	const bottom = useRef<HTMLDivElement>(null);
	const followLatest = useRef(true);
	const [retry, setRetry] = useState<ChatAIRetryRequest | null>(null);
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
			requestEpoch.current += 1;
			controller.current?.abort();
		};
	}, []);
	useEffect(() => {
		currentPath.current = pathname;
	}, [pathname]);
	useEffect(() => {
		if (historyOpen) return;
		if (!messages.length && !delta && !busy) {
			bottom.current?.parentElement?.scrollTo?.({ top: 0 });
		} else if (followLatest.current) {
			bottom.current?.scrollIntoView?.({ behavior: 'auto', block: 'end' });
		}
	}, [messages, delta, busy, historyOpen]);

	// Every new view/request invalidates older asynchronous work, including requests
	// whose response body finishes after abort. Server-confirmed writes are still
	// allowed to invalidate business caches, but cannot change a newer chat view.
	const cancelPending = () => {
		setPendingDeletion(null);
		requestEpoch.current += 1;
		controller.current?.abort();
		controller.current = null;
		setBusy(false);
		setHistoryLoading(false);
		setDelta('');
	};
	const startRequest = (loading: 'message' | 'history') => {
		cancelPending();
		const epoch = requestEpoch.current;
		const requestController = new AbortController();
		controller.current = requestController;
		setBusy(loading === 'message');
		setHistoryLoading(loading === 'history');
		const isCurrent = () => active.current && requestEpoch.current === epoch && !requestController.signal.aborted;
		return {
			signal: requestController.signal,
			isCurrent,
			finish: () => {
				if (!isCurrent()) return;
				controller.current = null;
				setBusy(false);
				setHistoryLoading(false);
				setDelta('');
			},
		};
	};

	const navigate = (target: NavigationTarget) => {
		const route = safeNavigation(target, companyId);
		if (route) router.push(route);
		else setError(interfaceLanguage === 'en' ? 'Navigation denied.' : 'Navigation refusée.');
	};
	const showError = (err: unknown) => {
		if (!active.current || chatErrorCode(err) === 'ABORTED') return;
		setError(chatErrorMessage(err, interfaceLanguage));
	};
	const confirmAction = async (card: ChatCard): Promise<{ error?: string }> => {
		setError('');
		const epoch = requestEpoch.current;
		const path = pathname;
		const isCurrent = () => active.current && requestEpoch.current === epoch;
		try {
			// Do not abort a confirmed write: it may already have executed. Its
			// successful result must refresh caches even after leaving this view.
			const result = await chatRequest(`actions/${card.action_id}/confirm/`, token, {
				method: 'POST',
				data: { confirmed: true },
			});
			if (result.error) {
				const message = ['APPLICATION_UNAVAILABLE', 'ABORTED'].includes(result.error.code)
					? interfaceLanguage === 'en'
						? 'The confirmation could not be verified. Check the record before trying again.'
						: 'La confirmation n’a pas pu être vérifiée. Consultez le document avant de recommencer.'
					: chatErrorMessage(result.error, interfaceLanguage);
				if (isCurrent()) setError(message);
				return { error: message };
			}
			dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
			dispatch(deviApi.util.invalidateTags(['Devi']));
			dispatch(factureProFormaApi.util.invalidateTags(['FactureProForma']));
			dispatch(factureAvoirApi.util.invalidateTags(['FactureAvoir']));
			dispatch(bonDeLivraisonApi.util.invalidateTags(['BonDeLivraison']));
			dispatch(stockApi.util.invalidateTags(['StockBalance', 'StockMovement', 'StockReceipt', 'Inventory']));
			dispatch(clientApi.util.invalidateTags(['Client']));
			dispatch(dashboardApi.util.invalidateTags(['Dashboard']));
			dispatch(reglementApi.util.invalidateTags(['Reglement']));
			if (!isCurrent()) return {};
			setMessages((old) => [
				...old.map((m) => ({ ...m, cards: m.cards?.filter((c) => c.type === 'confirmation') })),
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					text:
						interfaceLanguage === 'en'
							? 'Action completed. Your identity is recorded in the history.'
							: 'Action effectuée. Votre identité est enregistrée dans l’historique.',
				},
			]);
			const listRoutes: Record<string, string> = {
				client: 'clients',
				quote: 'devis',
				invoice: 'facture-client',
				proforma: 'facture-pro-forma',
				credit_note: 'facture-avoir',
				delivery_note: 'bon-de-livraison',
			};
			const list = card.resource && listRoutes[card.resource];
			if (card.operation === 'delete' && list && currentPath.current === path)
				router.push(`/dashboard/${list}/?company_id=${companyId}`);
			return {};
		} catch (err) {
			const message = chatErrorMessage(err, interfaceLanguage);
			if (isCurrent()) setError(message);
			return { error: message };
		}
	};
	const selectRecord = async (resource: string, identifier: number, operation: 'edit' | 'delete') => {
		if (!conversation || busy) return;
		const request = startRequest('message');
		setError('');
		try {
			const response = await chatRequest(`conversations/${conversation}/selection/`, token, {
				method: 'POST',
				data: { resource, identifier, operation },
				signal: request.signal,
			});
			if (response.error) {
				if (request.isCurrent()) showError(response.error);
				return;
			}
			const message: unknown = response.data;
			if (!isChatMessage(message)) {
				if (request.isCurrent()) showError({ code: 'INVALID_MODEL_OUTPUT' });
				return;
			}
			if (request.isCurrent()) setMessages((old) => [...old, message]);
		} catch (err) {
			if (request.isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};
	const send = async (text = draft, previousRequest?: ChatAIRetryRequest) => {
		if (!text.trim() || text.length > 4000 || busy) return;
		followLatest.current = true;
		const request = startRequest('message');
		setHistoryOpen(false);
		setError('');
		setDelta('');
		setDraft('');
		const requestId = previousRequest?.id || crypto.randomUUID();
		const match = pathname.match(/^\/dashboard\/facture-client\/(\d+)\/?$/);
		// Retrying a turn must keep its original page hint, even after navigation.
		// The backend reauthorizes the referenced record on every attempt.
		const context = previousRequest?.context ?? {
			interface_language: interfaceLanguage,
			...(match ? { invoice_id: Number(match[1]) } : {}),
		};
		setRetry({ text, id: requestId, context });
		if (!previousRequest) setMessages((old) => [...old, { id: requestId, role: 'user', text }]);
		const { signal, isCurrent } = request;
		try {
			let id = conversation;
			if (!id) {
				const response = await chatRequest<{ id?: unknown }>('conversations/', token, {
					method: 'POST',
					data: { company_id: companyId },
					signal,
				});
				if (response.error) {
					if (isCurrent()) showError(response.error);
					return;
				}
				id = response.data.id as string;
				if (typeof id !== 'string' || !id) {
					if (isCurrent()) showError({ code: 'INVALID_MODEL_OUTPUT' });
					return;
				}
				if (!isCurrent()) return;
				setConversation(id);
			}
			const response = await chatRequest<ReadableStream<Uint8Array>>(`conversations/${id}/messages/`, token, {
				method: 'POST',
				headers: { Accept: 'text/event-stream' },
				responseType: 'stream',
				data: { text, request_id: requestId, context },
				signal,
			});
			if (response.error) {
				if (isCurrent()) showError(response.error);
				return;
			}
			const stream = await consumeChatStream(response.data, (event, data) => {
				if (!isCurrent()) return;
				if (event === 'message.delta') setDelta((old) => old + (data as { text: string }).text);
				if (event === 'message.completed') {
					const message = data as ChatMessage;
					setDelta('');
					setMessages((old) => [...old.filter((item) => item.id !== message.id), message]);
					setRetry(null);
					// A validated navigation card is offered for user action; searches never redirect.
				}
			});
			if (stream.error && isCurrent()) showError(stream.error);
		} catch (err) {
			if (isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};
	const loadHistory = async () => {
		const request = startRequest('history');
		setHistoryOpen(true);
		setError('');
		try {
			const response = await chatRequest(`conversations/?company_id=${companyId}`, token, { signal: request.signal });
			if (response.error) {
				if (request.isCurrent()) showError(response.error);
				return;
			}
			const result = response.data;
			if (
				!Array.isArray(result) ||
				!result.every((item) => item && typeof item.id === 'string' && typeof item.updated_at === 'string')
			) {
				if (request.isCurrent()) showError({ code: 'INVALID_MODEL_OUTPUT' });
				return;
			}
			if (request.isCurrent()) setHistory(result);
		} catch (err) {
			if (request.isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};
	const openHistory = async (id: string) => {
		const request = startRequest('history');
		try {
			const response = await chatRequest<{ company_id: number; messages: ChatMessage[] }>(
				`conversations/${id}/`,
				token,
				{ signal: request.signal },
			);
			if (response.error) {
				if (request.isCurrent()) showError(response.error);
				return;
			}
			const result = response.data;
			if (
				!result ||
				result.company_id !== companyId ||
				!Array.isArray(result.messages) ||
				!result.messages.every(isChatMessage)
			) {
				if (request.isCurrent()) showError({ code: 'INVALID_MODEL_OUTPUT' });
				return;
			}
			if (request.isCurrent()) {
				followLatest.current = true;
				setConversation(id);
				setMessages(result.messages);
				setHistoryOpen(false);
				setError('');
				setRetry(null);
			}
		} catch (err) {
			if (request.isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};
	const newConversation = () => {
		cancelPending();
		setComposerVersion((version) => version + 1);
		followLatest.current = true;
		setConversation(null);
		setMessages([]);
		setDraft('');
		setError('');
		setRetry(null);
		setHistoryOpen(false);
	};
	const deleteConversation = async (id: string) => {
		if (!history.some((item) => item.id === id)) return;
		const request = startRequest('history');
		setError('');
		try {
			const result = await chatRequest(`conversations/${id}/`, token, { method: 'DELETE', signal: request.signal });
			if (result.error) {
				if (request.isCurrent()) showError(result.error);
				return;
			}
			if (!request.isCurrent()) return;
			setHistory((old) => old.filter((item) => item.id !== id));
			if (conversation === id) {
				setConversation(null);
				setMessages([]);
				setDraft('');
				setRetry(null);
				followLatest.current = true;
			}
		} catch (err) {
			if (request.isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};

	return (
		<>
			<ChatAIHeader
				appName="Facturation"
				closeAction={close}
				newConversationAction={newConversation}
				historyAction={() => {
					if (historyOpen) {
						cancelPending();
						setHistoryOpen(false);
					} else {
						void loadHistory();
					}
				}}
				historyExpanded={historyOpen}
				language={interfaceLanguage}
			/>
			{companyControl}
			<Box
				role="log"
				aria-live="polite"
				aria-label="Conversation"
				onScroll={(event) => {
					if (historyOpen) return;
					const list = event.currentTarget;
					followLatest.current = list.scrollHeight - list.scrollTop - list.clientHeight <= 64;
				}}
				className={styles.messages}
			>
				{historyOpen ? (
					<Stack spacing={1}>
						<Typography variant="caption">
							{interfaceLanguage === 'en'
								? 'History for this company. Results are refreshed when reopened.'
								: 'Historique de cette société. Les résultats sont actualisés à la réouverture.'}
						</Typography>
						{historyLoading && (
							<Typography role="status">
								{interfaceLanguage === 'en' ? 'Loading history…' : 'Chargement de l’historique…'}
							</Typography>
						)}
						{error && <Alert severity="warning">{error}</Alert>}
						<Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
							{history.map((item) => {
								const title =
									item.title?.trim() || (interfaceLanguage === 'en' ? 'New conversation' : 'Nouvelle conversation');
								const selected = item.id === conversation;
								return (
									<Box
										key={item.id}
										component="li"
										sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}
									>
										<ListItemButton
											selected={selected}
											aria-current={selected ? 'true' : undefined}
											aria-label={`${interfaceLanguage === 'en' ? 'Open conversation' : 'Ouvrir la conversation'} : ${title}`}
											onClick={() => openHistory(item.id)}
											sx={{ minWidth: 0, px: 1, py: 1.5 }}
										>
											<Box sx={{ minWidth: 0 }}>
												<Typography variant="body2" sx={{ fontWeight: selected ? 600 : 400, overflowWrap: 'anywhere' }}>
													{title}
												</Typography>
												<Typography
													variant="caption"
													color="text.secondary"
													component="time"
													dateTime={item.updated_at}
													sx={{ display: 'block', mt: 0.5 }}
												>
													{new Date(item.updated_at).toLocaleString()}
												</Typography>
												{selected && (
													<Typography variant="caption" color="text.secondary">
														{interfaceLanguage === 'en' ? 'Current conversation' : 'Conversation actuelle'}
													</Typography>
												)}
											</Box>
										</ListItemButton>
										<DarkTooltip
											title={`${interfaceLanguage === 'en' ? 'Delete conversation' : 'Supprimer la conversation'} : ${title}`}
										>
											<span>
												<IconButton
													aria-label={`${interfaceLanguage === 'en' ? 'Delete conversation' : 'Supprimer la conversation'} : ${title}`}
													disabled={historyLoading}
													onClick={() => setPendingDeletion(item.id)}
												>
													<DeleteOutlined fontSize="small" />
												</IconButton>
											</span>
										</DarkTooltip>
									</Box>
								);
							})}
						</Box>

						{!historyLoading && !history.length && (
							<Typography>{interfaceLanguage === 'en' ? 'No conversations yet.' : 'Aucune conversation.'}</Typography>
						)}
						<TextButton
							buttonText={interfaceLanguage === 'en' ? 'Back to conversation' : 'Revenir à la conversation'}
							onClick={() => {
								cancelPending();
								setHistoryOpen(false);
							}}
						/>
					</Stack>
				) : (
					<div>
						{!messages.length && (
							<ChatAIWelcome
								language={interfaceLanguage}
								suggestions={company.suggestions}
								busy={busy}
								sendAction={(question) => {
									void send(question);
								}}
							/>
						)}
						{messages.map((message) => (
							<ChatAIMessageBox key={message.id} role={message.role} text={message.text} language={interfaceLanguage}>
								<ChatAIResults
									cards={message.cards || []}
									navigate={navigate}
									confirm={confirmAction}
									select={selectRecord}
									permissions={company}
									pdf={(id, resource) => {
										void downloadInvoicePDF(id, companyId, token, resource).then((result) => {
											if (result.error) showError(result.error);
										});
									}}
								/>
							</ChatAIMessageBox>
						))}
						{(busy || delta) && (
							<ChatAIMessageBox role="assistant" text={delta} language={interfaceLanguage}>
								{busy && (
									<Stack role="status" direction="row" sx={{ gap: 1, alignItems: 'center', mt: delta ? 1 : 0 }}>
										<CircularProgress size={14} />
										<Typography variant="caption" color="text.secondary">
											{interfaceLanguage === 'en' ? 'Working…' : 'En cours…'}
										</Typography>
									</Stack>
								)}
							</ChatAIMessageBox>
						)}
						{error && (
							<Alert severity="warning">
								{error}
								{retry && (
									<Button onClick={() => send(retry.text, retry)} disabled={busy}>
										{interfaceLanguage === 'en' ? 'Retry' : 'Réessayer'}
									</Button>
								)}
							</Alert>
						)}
					</div>
				)}
				<div ref={bottom} />
			</Box>
			{pendingDeletion && (
				<ActionModals
					title={interfaceLanguage === 'en' ? 'Delete this conversation?' : 'Supprimer cette conversation ?'}
					body={
						interfaceLanguage === 'en'
							? 'This deletes the conversation and its messages. Business records are unaffected.'
							: 'La conversation et ses messages seront supprimés. Les données de l’application seront conservées.'
					}
					onClose={() => setPendingDeletion(null)}
					actions={[
						{
							text: interfaceLanguage === 'en' ? 'Cancel' : 'Annuler',
							active: false,
							onClick: () => setPendingDeletion(null),
						},
						{
							text: interfaceLanguage === 'en' ? 'Delete conversation' : 'Supprimer la conversation',
							active: true,
							color: '#C62828',
							onClick: () => {
								void deleteConversation(pendingDeletion);
							},
						},
					]}
				>
					<Typography variant="body2">{history.find((item) => item.id === pendingDeletion)?.title}</Typography>
				</ActionModals>
			)}
			<ChatAIComposer
				key={`${composerVersion}:${historyOpen}`}
				draft={draft}
				setDraft={setDraft}
				busy={busy}
				historyOpen={historyOpen}
				shortcuts={company.shortcuts || []}
				language={interfaceLanguage}
				send={() => {
					void send();
				}}
				cancel={cancelPending}
			/>
		</>
	);
};

export const ChatAIAssistant = () => {
	const { language } = useLanguage();
	const token = useAppSelector(getAccessToken);
	const profile = useAppSelector(getProfilState);
	const pathname = usePathname();
	const search = useSearchParams();
	const tabCompany = useSyncExternalStore(subscribeChatAICompany, getChatAICompany, () => null);
	const [capabilities, setCapabilities] = useState<ChatCapabilities | null>(null);
	const [capabilitiesError, setCapabilitiesError] = useState('');
	const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
	const [capabilitiesAttempt, setCapabilitiesAttempt] = useState(0);
	const [open, setOpen] = useState(false);
	const [overlayOpen, setOverlayOpen] = useState(false);
	const companyMenuId = useId();
	useEffect(() => {
		// Native dialogs/drawers own focus and accessibility while open. Preserve
		// the chat state, but hide its shell until those overlays are closed.
		// The assistant's own company menu is portalled outside its shell.
		const update = () =>
			setOverlayOpen(
				Array.from(document.querySelectorAll<HTMLElement>('.MuiModal-root')).some((element) => {
					if (element.id === companyMenuId) return false;
					const style = getComputedStyle(element);
					return (
						element.getAttribute('aria-hidden') !== 'true' && style.display !== 'none' && style.visibility !== 'hidden'
					);
				}),
			);
		update();
		const observer = new MutationObserver(update);
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['aria-hidden', 'class', 'style'],
		});
		return () => observer.disconnect();
	}, [companyMenuId]);
	const [pickedCompany, setPickedCompany] = useState<number | null>(null);
	const authorizedCompanyId = (id: number | null) =>
		id !== null && Number.isSafeInteger(id) && id > 0 && capabilities?.companies.some((item) => item.id === id)
			? id
			: null;
	const routeValue = search.get('company_id');
	const routeCompany = authorizedCompanyId(routeValue && /^[1-9]\d*$/.test(routeValue) ? Number(routeValue) : null);
	const activeTabCompany = authorizedCompanyId(tabCompany);
	const activeCompany = routeCompany ?? activeTabCompany ?? authorizedCompanyId(pickedCompany);
	const company = capabilities?.companies.find((item) => item.id === activeCompany);
	const offset = pathname.includes('/logistique/');
	useEffect(() => {
		// A detail page can change company without mounting the list/tab bridge.
		// Keep its authorized scope when the next page has no company hint.
		if (token && profile.id && routeCompany !== null) publishChatAICompany(routeCompany);
	}, [token, profile.id, routeCompany]);
	useEffect(() => {
		if (!token || !profile.id) {
			setCapabilities(null);
			setPickedCompany(null);
			setOpen(false);
			publishChatAICompany(null);
			return;
		}
		const controller = new AbortController();
		setCapabilitiesLoading(true);
		const load = async () => {
			try {
				const result = await chatRequest<ChatCapabilities>(`capabilities/?language=${language}`, token, {
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				if (result.error) {
					setCapabilities(null);
					setCapabilitiesError(chatErrorMessage(result.error, language));
					return;
				}
				const value = result.data;
				if (controller.signal.aborted) return;
				if (
					!value ||
					!Array.isArray(value.companies) ||
					!Array.isArray(value.languages) ||
					!value.companies.every(
						(item: ChatCapabilities['companies'][number]) =>
							item &&
							Number.isSafeInteger(item.id) &&
							item.id > 0 &&
							typeof item.name === 'string' &&
							Array.isArray(item.suggestions),
					)
				) {
					setCapabilities(null);
					setCapabilitiesError(chatErrorMessage({ code: 'INVALID_MODEL_OUTPUT' }, language));
					return;
				}
				setCapabilities(value);
				setCapabilitiesError('');
			} catch (error) {
				if (!controller.signal.aborted) {
					setCapabilities(null);
					setCapabilitiesError(chatErrorMessage(error, language));
				}
			} finally {
				if (!controller.signal.aborted) setCapabilitiesLoading(false);
			}
		};
		void load();
		return () => controller.abort();
	}, [token, profile.id, language, capabilitiesAttempt]);
	useEffect(() => {
		const clear = () => {
			setCapabilities(null);
			setOpen(false);
			setPickedCompany(null);
			publishChatAICompany(null);
		};
		window.addEventListener('session-expired', clear);
		return () => window.removeEventListener('session-expired', clear);
	}, []);
	if (!token || !profile.id || (!capabilities && !capabilitiesError && !open) || !pathname.startsWith('/dashboard'))
		return null;
	const companyControl = (
		<Box className={styles.company}>
			{(routeCompany || activeTabCompany) && company ? (
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
					<BusinessOutlined fontSize="small" color="action" />
					<Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12 }}>
						{company.name}
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ ml: 'auto !important', fontSize: 10 }}>
						{language === 'en' ? 'Active company' : 'Société active'}
					</Typography>
				</Stack>
			) : (
				<TextField
					select
					fullWidth
					size="small"
					label={language === 'en' ? 'Company' : 'Société'}
					value={company?.id || ''}
					onChange={(event) => setPickedCompany(Number(event.target.value))}
					slotProps={{ select: { MenuProps: { id: companyMenuId } } }}
				>
					{capabilities?.companies.map((item) => (
						<MenuItem key={item.id} value={item.id}>
							{item.name}
						</MenuItem>
					))}
				</TextField>
			)}
		</Box>
	);
	return (
		<Portal>
			<ChatAIInterface open={open} onOpenChangeAction={setOpen} suppressed={overlayOpen} offset={offset}>
				{!capabilities ? (
					<>
						<ChatAIHeader appName="Facturation" closeAction={() => setOpen(false)} language={language} />
						<Stack spacing={2} sx={{ p: 3 }}>
							{capabilitiesError && <Alert severity="error">{capabilitiesError}</Alert>}
							<Button
								variant="outlined"
								disabled={capabilitiesLoading}
								onClick={() => setCapabilitiesAttempt((attempt) => attempt + 1)}
							>
								{capabilitiesLoading
									? language === 'en'
										? 'Loading…'
										: 'Chargement…'
									: language === 'en'
										? 'Retry'
										: 'Réessayer'}
							</Button>
						</Stack>
					</>
				) : company ? (
					<ChatAIWorkspace
						key={`${profile.id}:${company.id}`}
						companyId={company.id}
						token={token}
						capabilities={capabilities}
						close={() => setOpen(false)}
						companyControl={companyControl}
					/>
				) : (
					<>
						<ChatAIHeader appName="Facturation" closeAction={() => setOpen(false)} language={language} />
						{companyControl}
						<Box sx={{ p: 3 }}>
							<Typography>
								{language === 'en'
									? 'Choose an authorized company to start.'
									: 'Choisissez une société autorisée pour commencer.'}
							</Typography>
						</Box>
					</>
				)}
			</ChatAIInterface>
		</Portal>
	);
};
