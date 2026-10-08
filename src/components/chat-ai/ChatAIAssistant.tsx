'use client';

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Fab,
	IconButton,
	MenuItem,
	ListItemButton,
	Paper,
	Portal,
	Stack,
	TextField,
	Typography,
	InputBase,
	Avatar,
} from '@mui/material';
import {
	ChatBubbleOutlined,
	Close,
	History,
	Add,
	Send,
	Stop,
	DeleteOutlined,
	BusinessOutlined,
	ArrowForward,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch, useLanguage } from '@/utils/hooks';
import { getAccessToken, getProfilState } from '@/store/selectors';
import { chatRequest, ChatAPIError, consumeChatStream, safeNavigation, downloadInvoicePDF } from './api';
import { getChatAICompany, publishChatAICompany, subscribeChatAICompany } from './company-context';
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
import styles from './chat-ai.module.sass';
import { ChatAIShortcuts } from './ChatAIShortcuts';
import { ChatAIResults } from './ChatAIResults';
import type { ChatCapabilities, ChatMessage, NavigationTarget, ChatCard } from './types';

export const ChatAIFloatingButton = ({
	open,
	toggle,
	offset = false,
}: {
	open: boolean;
	toggle: () => void;
	offset?: boolean;
}) => (
	<DarkTooltip title="Ask AI Assistant">
		<Fab
			className={styles.floating}
			color="primary"
			aria-label="Ask AI Assistant"
			aria-expanded={open}
			aria-controls="chat-ai-panel"
			onClick={toggle}
			sx={{
				'--chat-ai-primary': (theme) => theme.palette.primary.main,
				position: 'fixed',
				width: 56,
				height: 56,
				right: { xs: 16, sm: 24 },
				bottom: offset ? 96 : { xs: 'max(16px, env(safe-area-inset-bottom))', sm: 24 },
				zIndex: (theme) => theme.zIndex.drawer + 1,
				boxShadow: 3,
				'&:focus-visible': { outline: '3px solid', outlineColor: 'text.primary', outlineOffset: 3 },
				'@media (prefers-reduced-motion: reduce)': { transition: 'none' },
			}}
		>
			{open ? <Close /> : <ChatBubbleOutlined />}
		</Fab>
	</DarkTooltip>
);

const ChatAIMessageBox = ({
	role,
	text,
	children,
}: {
	role: ChatMessage['role'];
	text?: string;
	children?: ReactNode;
}) => (
	<Box
		component="article"
		className={role === 'user' ? styles.userMessage : styles.assistantMessage}
		aria-label={role === 'user' ? 'Message de vous' : 'Message de AI Assistant'}
		sx={{
			alignSelf: role === 'user' ? 'flex-end' : 'stretch',
			maxWidth: role === 'user' ? '90%' : '100%',
			minWidth: 0,
			bgcolor: role === 'user' ? 'action.hover' : 'background.paper',
			border: 1,
			borderColor: role === 'user' ? 'transparent' : 'divider',
			p: 1.5,
			borderRadius: 2,
		}}
	>
		<Typography
			className={styles.messageAuthor}
			component="div"
			variant="caption"
			color="text.secondary"
			sx={{ fontWeight: 600, mb: 0.75 }}
		>
			{role === 'user' ? 'Vous' : 'AI Assistant'}
		</Typography>
		{text && (
			<Typography dir="auto" variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.6 }}>
				{text}
			</Typography>
		)}
		{children}
	</Box>
);

const errorText: Record<string, string> = {
	PERMISSION_DENIED: 'Vous n’avez pas accès à ces informations.',
	NOT_FOUND: 'Aucun résultat autorisé trouvé.',
	CONTEXT_EXPIRED: 'Le contexte a expiré ou vos autorisations ont changé. Démarrez une nouvelle conversation.',
	NOT_AUTHENTICATED: 'Votre session a expiré.',
	BUSY: 'L’assistant est occupé. Réessayez dans un instant.',
	INVALID_MODEL_OUTPUT:
		'Je n’ai pas pu interpréter cette demande. Précisez votre recherche ou utilisez /aide pour choisir un module.',
	INCOMPLETE_RESPONSE: 'La réponse est incomplète. Vous pouvez réessayer ou utiliser /aide pour choisir un module.',
	MODEL_TIMEOUT: 'La réponse a pris trop de temps. Réessayez avec une recherche plus précise.',
	SENSITIVE_INPUT: 'Retirez les mots de passe ou secrets avant d’envoyer ce message.',
	INVALID_ARGUMENTS: 'Précisez votre demande, le numéro ou la période.',
	MULTIPLE_MATCHES: 'Plusieurs résultats correspondent. Précisez votre recherche.',
	STALE_ACTION: 'Le document a changé. Demandez une nouvelle prévisualisation.',
	ACTION_REJECTED: 'L’application a refusé cette action selon ses règles de gestion.',
	CONTEXT_LIMIT: 'Cette conversation est complète. Démarrez une nouvelle conversation.',
};

export const ChatAIPanel = ({
	children,
	close,
	minimized,
	offset = false,
}: {
	children: React.ReactNode;
	close: () => void;
	minimized: boolean;
	offset?: boolean;
}) => {
	const panel = useRef<HTMLDivElement>(null);
	const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
	useEffect(() => {
		const view = window.visualViewport;
		if (!view) return;
		const resize = () => setViewport({ height: view.height, top: view.offsetTop });
		resize();
		view.addEventListener('resize', resize);
		view.addEventListener('scroll', resize);
		return () => {
			view.removeEventListener('resize', resize);
			view.removeEventListener('scroll', resize);
		};
	}, []);
	const onClose = useEffectEvent(close);
	useEffect(() => {
		if (minimized) return;
		const previous = document.activeElement as HTMLElement | null;
		panel.current?.focus();
		const escape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', escape);
		return () => {
			document.removeEventListener('keydown', escape);
			previous?.focus();
		};
	}, [minimized]);
	return (
		<Paper
			className={styles.panel}
			ref={panel}
			id="chat-ai-panel"
			role="dialog"
			aria-label="AI Assistant"
			tabIndex={-1}
			elevation={8}
			sx={{
				display: minimized ? 'none' : 'flex',
				flexDirection: 'column',
				'--chat-ai-primary': (theme) => theme.palette.primary.main,
				position: 'fixed',
				right: { xs: 0, sm: 24 },
				top: { xs: viewport?.top ?? 0, sm: 'auto' },
				bottom: { xs: 'auto', sm: offset ? 164 : 92 },
				width: { xs: '100%', sm: 440 },
				height: { xs: viewport?.height ?? '100dvh', sm: 630 },
				maxHeight: { xs: '100dvh', sm: offset ? 'calc(100dvh - 180px)' : 'calc(100dvh - 112px)' },
				borderRadius: { xs: 0, sm: 3 },
				zIndex: (theme) => theme.zIndex.drawer + 2,
				pt: { xs: 'env(safe-area-inset-top)', sm: 0 },
				pb: { xs: 'env(safe-area-inset-bottom)', sm: 0 },
				overflow: 'hidden',
			}}
		>
			{children}
		</Paper>
	);
};

const ChatAIHeader = ({
	close,
	newConversation,
	history,
}: {
	close: () => void;
	newConversation?: () => void;
	history?: () => void;
}) => (
	<Box className={styles.header}>
		<Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
			<Avatar className={styles.assistantAvatar} variant="rounded" sx={{ width: 36, height: 36 }}>
				<ChatBubbleOutlined fontSize="small" />
			</Avatar>
			<Box sx={{ flex: 1 }}>
				<Typography sx={{ fontWeight: 600, fontSize: 14 }}>AI Assistant</Typography>
				<Typography variant="caption" color="text.secondary">
					Facturation
				</Typography>
			</Box>
			<DarkTooltip title="Fermer l’assistant">
				<IconButton aria-label="Fermer" onClick={close}>
					<Close />
				</IconButton>
			</DarkTooltip>
		</Stack>
		{newConversation && (
			<Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
				<TextButton
					cssClass={styles.headerControl}
					buttonText="Nouvelle conversation"
					startIcon={<Add fontSize="small" />}
					onClick={newConversation}
				/>
				<TextButton
					cssClass={styles.headerControl}
					buttonText="Historique"
					startIcon={<History fontSize="small" />}
					onClick={history}
				/>
			</Stack>
		)}
	</Box>
);

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
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [delta, setDelta] = useState('');
	const [historyOpen, setHistoryOpen] = useState(false);
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
		if (!historyOpen && followLatest.current) bottom.current?.scrollIntoView?.({ behavior: 'auto', block: 'end' });
	}, [messages, delta, busy, historyOpen]);

	// Every new view/request invalidates older asynchronous work, including fetches
	// whose response body finishes after abort. Server-confirmed writes are still
	// allowed to invalidate business caches, but cannot change a newer chat view.
	const cancelPending = () => {
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
		else setError('Navigation refusée.');
	};
	const showError = (err: unknown) => {
		if (!active.current || (err instanceof DOMException && err.name === 'AbortError')) return;
		setError(
			errorText[err instanceof ChatAPIError ? err.code : ''] || 'L’assistant est indisponible. Vous pouvez réessayer.',
		);
	};
	const confirmAction = async (card: ChatCard) => {
		const epoch = requestEpoch.current;
		const path = pathname;
		const isCurrent = () => active.current && requestEpoch.current === epoch;
		try {
			// Do not abort a confirmed write: it may already have executed. Its
			// successful result must refresh caches even after leaving this view.
			await chatRequest(`actions/${card.action_id}/confirm/`, token, {
				method: 'POST',
				body: JSON.stringify({ confirmed: true }),
			});
			dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
			dispatch(deviApi.util.invalidateTags(['Devi']));
			dispatch(factureProFormaApi.util.invalidateTags(['FactureProForma']));
			dispatch(factureAvoirApi.util.invalidateTags(['FactureAvoir']));
			dispatch(bonDeLivraisonApi.util.invalidateTags(['BonDeLivraison']));
			dispatch(stockApi.util.invalidateTags(['StockBalance', 'StockMovement', 'StockReceipt', 'Inventory']));
			dispatch(clientApi.util.invalidateTags(['Client']));
			dispatch(dashboardApi.util.invalidateTags(['Dashboard']));
			dispatch(reglementApi.util.invalidateTags(['Reglement']));
			if (!isCurrent()) return;
			setMessages((old) => [
				...old.map((m) => ({ ...m, cards: m.cards?.filter((c) => c.type === 'confirmation') })),
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					text: 'Action effectuée. Votre identité est enregistrée dans l’historique.',
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
		} catch (err) {
			if (!isCurrent()) return;
			showError(err);
			throw err;
		}
	};
	const selectRecord = async (resource: string, identifier: number, operation: 'edit' | 'delete') => {
		if (!conversation || busy) return;
		const request = startRequest('message');
		setError('');
		try {
			const response = await chatRequest(`conversations/${conversation}/selection/`, token, {
				method: 'POST',
				body: JSON.stringify({ resource, identifier, operation }),
				signal: request.signal,
			});
			const message = (await response.json()) as ChatMessage;
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
				const response = await chatRequest('conversations/', token, {
					method: 'POST',
					body: JSON.stringify({ company_id: companyId }),
					signal,
				});
				id = (await response.json()).id as string;
				if (!isCurrent()) return;
				setConversation(id);
			}
			const response = await chatRequest(`conversations/${id}/messages/`, token, {
				method: 'POST',
				headers: { Accept: 'text/event-stream' },
				body: JSON.stringify({ text, request_id: requestId, context }),
				signal,
			});
			await consumeChatStream(response, (event, data) => {
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
			const result = await response.json();
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
			const response = await chatRequest(`conversations/${id}/`, token, { signal: request.signal });
			const result = await response.json();
			if (request.isCurrent() && result.company_id === companyId) {
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
			await chatRequest(`conversations/${id}/`, token, { method: 'DELETE', signal: request.signal });
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
			<ChatAIHeader close={close} newConversation={newConversation} history={loadHistory} />
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
				sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}
			>
				{historyOpen ? (
					<Stack spacing={1}>
						<Typography variant="caption">
							Historique de cette société. Les résultats sont actualisés à la réouverture.
						</Typography>
						{historyLoading && <Typography role="status">Chargement de l’historique…</Typography>}
						{error && <Alert severity="warning">{error}</Alert>}
						<Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
							{history.map((item) => {
								const title = item.title?.trim() || 'Nouvelle conversation';
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
											aria-label={`Ouvrir la conversation : ${title}`}
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
														Conversation actuelle
													</Typography>
												)}
											</Box>
										</ListItemButton>
										<DarkTooltip title={`Supprimer la conversation : ${title}`}>
											<span>
												<IconButton
													aria-label={`Supprimer la conversation : ${title}`}
													disabled={historyLoading}
													onClick={() => deleteConversation(item.id)}
												>
													<DeleteOutlined fontSize="small" />
												</IconButton>
											</span>
										</DarkTooltip>
									</Box>
								);
							})}
						</Box>

						{!historyLoading && !history.length && <Typography>Aucune conversation.</Typography>}
						<TextButton
							buttonText="Revenir à la conversation"
							onClick={() => {
								cancelPending();
								setHistoryOpen(false);
							}}
						/>
					</Stack>
				) : (
					<Stack spacing={2}>
						{!messages.length && (
							<>
								<Box sx={{ pt: 0.5, pb: 1 }}>
									<Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
										Que souhaitez-vous retrouver ?
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
										Un client, un produit, une période… Décrivez simplement votre recherche.
									</Typography>
								</Box>
								{['Trouver un devis par client et produit', ...company.suggestions].map((text) => (
									<TextButton
										key={text}
										buttonText={text}
										startIcon={<ArrowForward fontSize="small" />}
										cssClass={styles.suggestion}
										onClick={() =>
											setDraft(text === 'Trouver un devis par client et produit' ? '/voir devis du client ' : text)
										}
									/>
								))}
							</>
						)}
						{messages.map((message) => (
							<ChatAIMessageBox key={message.id} role={message.role} text={message.text}>
								<ChatAIResults
									cards={message.cards || []}
									navigate={navigate}
									confirm={confirmAction}
									select={selectRecord}
									permissions={company}
									pdf={(id, resource) => {
										void downloadInvoicePDF(id, companyId, token, resource).catch(showError);
									}}
								/>
							</ChatAIMessageBox>
						))}
						{(busy || delta) && (
							<ChatAIMessageBox role="assistant" text={delta}>
								{busy && (
									<Stack role="status" direction="row" sx={{ gap: 1, alignItems: 'center', mt: delta ? 1 : 0 }}>
										<CircularProgress size={14} />
										<Typography variant="caption" color="text.secondary">
											En cours…
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
										Réessayer
									</Button>
								)}
							</Alert>
						)}
					</Stack>
				)}
				<div ref={bottom} />
			</Box>
			{/^\/[^\s]*$/.test(draft) && (
				<Box
					sx={{
						px: 2,
						borderTop: 1,
						borderColor: 'divider',
						maxHeight: '35%',
						minHeight: 0,
						overflowY: 'auto',
						flexShrink: 1,
					}}
				>
					<ChatAIShortcuts
						draft={draft}
						shortcuts={company.shortcuts || []}
						language={interfaceLanguage}
						choose={setDraft}
					/>
				</Box>
			)}
			<Box className={styles.composer} sx={{ flexShrink: 0 }}>
				<Stack direction="row" className={styles.input} sx={{ gap: 1, alignItems: 'center' }}>
					<InputBase
						fullWidth
						multiline
						maxRows={4}
						placeholder="Décrivez votre recherche…"
						value={draft}
						disabled={busy}
						slotProps={{ input: { maxLength: 4000, dir: 'auto', 'aria-label': 'Votre message' } }}
						onChange={(e) => setDraft(e.target.value)}
						sx={{ fontSize: { xs: 16, sm: 13 }, py: 0, '& textarea': { p: 0, lineHeight: 1.5 } }}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
								e.preventDefault();
								void send();
							}
						}}
					/>
					{busy ? (
						<IconButton className={styles.send} aria-label="Annuler la réponse" onClick={cancelPending}>
							<Stop fontSize="small" />
						</IconButton>
					) : (
						<IconButton className={styles.send} aria-label="Envoyer" disabled={!draft.trim()} onClick={() => send()}>
							<Send fontSize="small" />
						</IconButton>
					)}
				</Stack>
				<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, fontSize: 10 }}>
					Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne · / raccourcis
				</Typography>
			</Box>
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
	const [open, setOpen] = useState(false);
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
		void chatRequest(`capabilities/?language=${language}`, token, { signal: controller.signal })
			.then((response) => response.json())
			.then((value) => {
				if (!controller.signal.aborted) setCapabilities(value);
			})
			.catch(() => {});
		return () => controller.abort();
	}, [token, profile.id, language]);
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
	if (!token || !profile.id || !capabilities || !pathname.startsWith('/dashboard')) return null;
	const companyControl = (
		<Box className={styles.company}>
			{(routeCompany || activeTabCompany) && company ? (
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
					<BusinessOutlined fontSize="small" color="action" />
					<Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12 }}>
						{company.name}
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ ml: 'auto !important', fontSize: 10 }}>
						Société active
					</Typography>
				</Stack>
			) : (
				<TextField
					select
					fullWidth
					size="small"
					label="Société"
					value={company?.id || ''}
					onChange={(event) => setPickedCompany(Number(event.target.value))}
				>
					{capabilities.companies.map((item) => (
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
			<ChatAIFloatingButton open={open} toggle={() => setOpen((value) => !value)} offset={offset} />
			<ChatAIPanel minimized={!open} close={() => setOpen(false)} offset={offset}>
				{company ? (
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
						<ChatAIHeader close={() => setOpen(false)} />
						{companyControl}
						<Box sx={{ p: 3 }}>
							<Typography>Choisissez une société autorisée pour commencer.</Typography>
						</Box>
					</>
				)}
			</ChatAIPanel>
		</Portal>
	);
};
