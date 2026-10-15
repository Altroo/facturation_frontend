'use client';

import { ButtonBase } from '@mui/material';
import { type CSSProperties, type ReactNode, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { ArrowRight, Bot, Clock3, MessageSquarePlus, X } from './chat-ai-icons';
import styles from '@/styles/dashboard/chat-ui/chat-ui.module.sass';
import { useDraggableLauncher } from './use-draggable-launcher';
import type { ChatAILanguage } from '@/types/chatAiTypes';

export const ChatAIFloatingButton = ({
	open,
	toggleAction,
}: {
	open: boolean;
	toggleAction: () => void;
	offset?: boolean;
}) => {
	const launcher = useDraggableLauncher(toggleAction);
	const helpId = useId();
	return (
		<>
			<ButtonBase
				{...launcher}
				disableRipple
				type="button"
				className={styles.floating}
				aria-label="Ask AI Assistant"
				title={open ? undefined : 'Ask AI Assistant · Drag to move'}
				aria-describedby={helpId}
				aria-expanded={open}
				aria-controls="chat-ai-panel"
				hidden={open}
				style={{
					position: 'fixed',
					width: 56,
					height: 56,
					...launcher.style,
				}}
			>
				<Bot size={26} aria-hidden="true" />
			</ButtonBase>
			<span id={helpId} className={styles.srOnly}>
				Drag to move. Arrow keys move the button; Home resets its position.
			</span>
		</>
	);
};

export const ChatAIPanel = ({
	children,
	closeAction,
	minimized,
	offset = false,
}: {
	children: ReactNode;
	closeAction: () => void;
	minimized: boolean;
	offset?: boolean;
}) => {
	const panel = useRef<HTMLElement>(null);
	const [viewport, setViewport] = useState<{
		height: number;
		top: number;
	} | null>(null);
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
	const onClose = useEffectEvent(closeAction);
	useEffect(() => {
		if (minimized) return;
		const previous = document.activeElement as HTMLElement | null;
		panel.current?.focus();
		const keydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.defaultPrevented) onClose();
			if (
				event.key !== 'Tab' ||
				event.defaultPrevented ||
				!panel.current?.contains(event.target as Node) ||
				!window.matchMedia('(max-width: 640px)').matches
			)
				return;
			const controls = Array.from(
				panel.current.querySelectorAll<HTMLElement>(
					'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
				),
			).filter((item) => item.getClientRects().length > 0);
			const first = controls[0],
				last = controls.at(-1);
			if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		};
		document.addEventListener('keydown', keydown);
		return () => {
			document.removeEventListener('keydown', keydown);
			previous?.focus();
		};
	}, [minimized]);
	return (
		<aside
			ref={panel}
			id="chat-ai-panel"
			role="dialog"
			aria-label="AI Assistant"
			tabIndex={-1}
			className={styles.panel}
			hidden={minimized}
			style={
				{
					display: minimized ? 'none' : undefined,
					'--chat-ai-bottom': offset ? '96px' : '24px',
					...(viewport
						? {
								'--assistant-height': `${viewport.height}px`,
								'--assistant-top': `${viewport.top}px`,
							}
						: {}),
				} as CSSProperties
			}
		>
			{children}
		</aside>
	);
};

export const ChatAIInterface = ({
	children,
	open,
	onOpenChangeAction,
	suppressed = false,
	offset = false,
}: {
	children: ReactNode;
	open: boolean;
	onOpenChangeAction: (open: boolean) => void;
	suppressed?: boolean;
	offset?: boolean;
}) => (
	<div data-chat-ai-shell style={{ display: suppressed ? 'none' : 'contents' }}>
		<ChatAIFloatingButton open={open} toggleAction={() => onOpenChangeAction(!open)} offset={offset} />
		<ChatAIPanel minimized={!open || suppressed} closeAction={() => onOpenChangeAction(false)} offset={offset}>
			{children}
		</ChatAIPanel>
	</div>
);

export const ChatAIHeader = ({
	closeAction,
	newConversationAction,
	historyAction,
	historyExpanded,
	appName,
	language = 'fr',
}: {
	closeAction: () => void;
	newConversationAction?: () => void;
	historyAction?: () => void;
	historyExpanded?: boolean;
	appName: string;
	language?: ChatAILanguage;
}) => (
	<>
		<header className={styles.header}>
			<span className={styles.botIcon}>
				<Bot size={23} aria-hidden="true" />
			</span>
			<div>
				<h2 className={styles.srOnly}>AI Assistant</h2>
				<p>
					{language === 'en' ? 'Your help in' : 'Votre aide dans'} {appName}
				</p>
			</div>
			<ButtonBase
				disableRipple
				type="button"
				className={styles.iconButton}
				aria-label={language === 'en' ? 'Close' : 'Fermer'}
				title={language === 'en' ? 'Close assistant' : 'Fermer l’assistant'}
				onClick={closeAction}
			>
				<X size={20} />
			</ButtonBase>
		</header>
		{newConversationAction && (
			<nav className={styles.toolbar} aria-label={language === 'en' ? 'Conversations' : 'Conversations'}>
				<ButtonBase disableRipple type="button" onClick={newConversationAction}>
					<MessageSquarePlus size={17} aria-hidden="true" />
					{language === 'en' ? 'New conversation' : 'Nouvelle conversation'}
				</ButtonBase>
				<ButtonBase disableRipple type="button" onClick={historyAction} aria-expanded={historyExpanded}>
					<Clock3 size={17} aria-hidden="true" />
					{language === 'en' ? 'History' : 'Historique'}
				</ButtonBase>
			</nav>
		)}
	</>
);

export const ChatAIWelcome = ({
	language,
	suggestions,
	busy,
	sendAction,
}: {
	language: ChatAILanguage;
	suggestions: string[];
	busy: boolean;
	sendAction: (question: string) => void;
}) => (
	<div className={styles.welcome}>
		<span className={styles.botIcon}>
			<Bot size={28} aria-hidden="true" />
		</span>
		<h3>{language === 'en' ? 'What would you like to do?' : 'Que souhaitez-vous faire ?'}</h3>
		<p>
			{language === 'en'
				? 'Select a question to send it, or describe what you need.'
				: 'Cliquez sur une question pour l’envoyer, ou décrivez votre besoin.'}
		</p>
		<div className={styles.suggestions}>
			{suggestions.slice(0, 4).map((question) => (
				<ButtonBase disableRipple type="button" key={question} disabled={busy} onClick={() => sendAction(question)}>
					<ArrowRight size={18} aria-hidden="true" />
					{question}
				</ButtonBase>
			))}
		</div>
	</div>
);

export const ChatAIMessageBox = ({
	role,
	text,
	children,
	language = 'fr',
}: {
	role: 'user' | 'assistant';
	text?: string;
	children?: ReactNode;
	language?: ChatAILanguage;
}) => (
	<article
		className={role === 'user' ? styles.userMessage : styles.assistantMessage}
		aria-label={role === 'user' ? (language === 'en' ? 'Your message' : 'Message de vous') : 'AI Assistant'}
	>
		<div className={styles.messageAuthor}>
			{role === 'assistant' && <Bot size={17} aria-hidden="true" />}
			<strong>{role === 'user' ? (language === 'en' ? 'You' : 'Vous') : 'AI Assistant'}</strong>
		</div>
		{text && (
			<p dir="auto" className={styles.messageText}>
				{text}
			</p>
		)}
		{children}
	</article>
);
