import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PdfLanguageModal from './pdfLanguageModal';

interface ModalAction {
	active?: boolean;
	text: string;
	onClick: () => void;
	icon?: React.ReactNode;
	color?: string;
}

interface ActionModalsProps {
	title: string;
	body: string;
	actions: ModalAction[];
}

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const React = require('react');
	const Mock: React.FC<ActionModalsProps> = ({ title, body, actions }) => (
		<div data-testid="action-modals">
			<h1>{title}</h1>
			<p>{body}</p>
			<div>
				{actions.map((a, i) => (
					<button key={i} data-testid={`action-${i}`} onClick={a.onClick} aria-pressed={!!a.active}>
						{a.icon ? <span data-testid={`icon-${i}`}>{a.icon}</span> : null}
						<span>{a.text}</span>
					</button>
				))}
			</div>
		</div>
	);

	return {
		__esModule: true,
		default: Mock,
	};
});

describe('PdfLanguageModal', () => {
	test('renders title, body and buttons; clicking buttons calls callbacks', () => {
		const onClose = jest.fn();
		const onSelectLanguage = jest.fn();

		render(<PdfLanguageModal onClose={onClose} onSelectLanguage={onSelectLanguage} />);

		expect(screen.getByText('Génération du PDF')).toBeInTheDocument();
		expect(
			screen.getByText('Choisissez la langue dans laquelle vous souhaitez générer le document PDF.'),
		).toBeInTheDocument();

		const cancelBtn = screen.getByTestId('action-0');
		const frBtn = screen.getByTestId('action-1');
		const enBtn = screen.getByTestId('action-2');

		fireEvent.click(cancelBtn);
		expect(onClose).toHaveBeenCalledTimes(1);

		fireEvent.click(frBtn);
		expect(onSelectLanguage).toHaveBeenCalledWith('fr');

		fireEvent.click(enBtn);
		expect(onSelectLanguage).toHaveBeenCalledWith('en');

		expect(enBtn).toHaveAttribute('aria-pressed', 'true');
	});
});
