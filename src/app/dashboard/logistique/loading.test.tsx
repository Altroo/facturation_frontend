import { render, screen } from '@testing-library/react';
import LogistiqueLoading from './loading';

describe('LogistiqueLoading', () => {
	it('shows the app loader while the authenticated page resolves, without dossier data', () => {
		render(<LogistiqueLoading />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});
});
