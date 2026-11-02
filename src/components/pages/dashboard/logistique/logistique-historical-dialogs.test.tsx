import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { translations } from '@/translations';
import { LogistiqueHistoricalPaymentValidationDialog } from './logistique-historical-dialogs';
import type { LogistiqueHistoricalPaymentValidationDialogProps } from '@/types/logistiqueTypes';

jest.mock('@/providers/themeProvider', () => ({ useColorMode: () => ({ mode: 'light' }) }));
jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', t: jest.requireActual('@/translations').translations.fr }),
}));
const t = translations.fr;
const props = (): LogistiqueHistoricalPaymentValidationDialogProps => ({
	t,
	setShowValidateModal: jest.fn(),
	setSelectedInstallment: jest.fn(),
	setSwiftProofFile: jest.fn(),
	swiftProofFile: null,
	handleValidatePayment: jest.fn().mockResolvedValue(undefined),
	swiftProofInputRef: createRef<HTMLInputElement>(),
});

it('requires a banking proof before validation and calls the existing save handler', () => {
	const state = props();
	const { rerender } = render(<LogistiqueHistoricalPaymentValidationDialog {...state} />);
	expect(screen.getByRole('button', { name: t.logistique.validatePayment })).toBeDisabled();
	rerender(
		<LogistiqueHistoricalPaymentValidationDialog
			{...state}
			swiftProofFile={new File(['proof'], 'proof.pdf', { type: 'application/pdf' })}
		/>,
	);
	fireEvent.click(screen.getByRole('button', { name: t.logistique.validatePayment }));
	expect(state.handleValidatePayment).toHaveBeenCalledTimes(1);
});

it('clears the selected payment and proof when cancelling the dialog', () => {
	const state = props();
	render(<LogistiqueHistoricalPaymentValidationDialog {...state} />);
	fireEvent.click(screen.getByRole('button', { name: t.common.cancel }));
	expect(state.setShowValidateModal).toHaveBeenCalledWith(false);
	expect(state.setSelectedInstallment).toHaveBeenCalledWith(null);
	expect(state.setSwiftProofFile).toHaveBeenCalledWith(null);
});
