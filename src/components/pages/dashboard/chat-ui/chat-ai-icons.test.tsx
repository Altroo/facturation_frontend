import { render, screen } from '@testing-library/react';
import { ArrowRight, Bot, Clock3, MessageSquarePlus, Send, Square, X } from './chat-ai-icons';

it.each([
	['Bot', Bot],
	['ArrowRight', ArrowRight],
	['Clock3', Clock3],
	['MessageSquarePlus', MessageSquarePlus],
	['Send', Send],
	['Square', Square],
	['X', X],
] as const)('%s supports decorative and accessible usage', (name, Icon) => {
	const { container, rerender } = render(<Icon />);
	const decorative = container.querySelector('svg');
	expect(decorative).toHaveAttribute('aria-hidden', 'true');
	expect(screen.queryByRole('img')).not.toBeInTheDocument();
	rerender(<Icon titleAccess={name} size={18} className="chatIcon" />);
	const accessible = screen.getByRole('img', { name });
	expect(accessible).toHaveClass('chatIcon');
	expect(accessible).toHaveStyle({ fontSize: '18px' });
});
