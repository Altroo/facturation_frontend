import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatAIHeader, ChatAIInterface, ChatAIMessageBox, ChatAIWelcome } from './chat-ai-interface';

afterEach(() => jest.restoreAllMocks());

it.each([
	['fr', 'Fermer', 'Nouvelle conversation', 'Historique'],
	['en', 'Close', 'New conversation', 'History'],
] as const)('provides translated header actions in %s', (language, closeLabel, newLabel, historyLabel) => {
	const close = jest.fn();
	const newConversation = jest.fn();
	const history = jest.fn();
	render(
		<ChatAIHeader
			appName="Facturation"
			language={language}
			close={close}
			newConversation={newConversation}
			history={history}
			historyExpanded
		/>,
	);
	expect(screen.getByText(/Facturation/)).toBeVisible();
	fireEvent.click(screen.getByRole('button', { name: closeLabel }));
	fireEvent.click(screen.getByRole('button', { name: newLabel }));
	const historyButton = screen.getByRole('button', { name: historyLabel });
	expect(historyButton).toHaveAttribute('aria-expanded', 'true');
	fireEvent.click(historyButton);
	expect(close).toHaveBeenCalledTimes(1);
	expect(newConversation).toHaveBeenCalledTimes(1);
	expect(history).toHaveBeenCalledTimes(1);
});

it('sends only displayed suggestions and prevents selection while busy', () => {
	const send = jest.fn();
	const suggestions = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
	const { rerender } = render(<ChatAIWelcome language="en" suggestions={suggestions} busy={false} send={send} />);
	expect(screen.getAllByRole('button')).toHaveLength(4);
	expect(screen.queryByText('Fifth')).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Second' }));
	expect(send).toHaveBeenCalledWith('Second');
	rerender(<ChatAIWelcome language="en" suggestions={suggestions} busy send={send} />);
	fireEvent.click(screen.getByRole('button', { name: 'First' }));
	expect(send).toHaveBeenCalledTimes(1);
	expect(screen.getByRole('button', { name: 'First' })).toBeDisabled();
});

it('keeps message text literal and labels user and assistant content', () => {
	const { container, rerender } = render(
		<ChatAIMessageBox role="user" language="en" text={'<img src=x onerror=alert(1)>\nNext line'} />,
	);
	expect(screen.getByRole('article', { name: 'Your message' })).toHaveTextContent('<img src=x onerror=alert(1)>');
	expect(container.querySelector('img')).toBeNull();
	rerender(
		<ChatAIMessageBox role="assistant" text="Answer">
			<button>Open result</button>
		</ChatAIMessageBox>,
	);
	expect(screen.getByRole('article', { name: 'AI Assistant' })).toHaveTextContent('Answer');
	expect(screen.getByRole('button', { name: 'Open result' })).toBeVisible();
});

it('contains keyboard focus on mobile and restores the launcher after Escape', () => {
	const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
	Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn(() => ({ matches: true })) });
	jest
		.spyOn(HTMLElement.prototype, 'getClientRects')
		.mockReturnValue([new DOMRect(0, 0, 100, 30)] as unknown as DOMRectList);
	function Harness() {
		const [open, setOpen] = useState(false);
		return (
			<ChatAIInterface open={open} onOpenChange={setOpen}>
				<button>First control</button>
				<button>Last control</button>
			</ChatAIInterface>
		);
	}
	try {
		render(<Harness />);
		const launcher = screen.getByRole('button', { name: 'Ask AI Assistant' });
		launcher.focus();
		fireEvent.click(launcher);
		const dialog = screen.getByRole('dialog', { name: 'AI Assistant' });
		expect(dialog).toHaveFocus();
		fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
		expect(screen.getByRole('button', { name: 'Last control' })).toHaveFocus();
		fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
		expect(screen.getByRole('button', { name: 'First control' })).toHaveFocus();
		fireEvent.keyDown(dialog, { key: 'Escape' });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(launcher).toHaveFocus();
	} finally {
		if (original) Object.defineProperty(window, 'matchMedia', original);
		else Reflect.deleteProperty(window, 'matchMedia');
	}
});
