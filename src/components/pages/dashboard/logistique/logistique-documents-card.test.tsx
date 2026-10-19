import { fireEvent, render, screen, within } from '@testing-library/react';
import type { LogistiqueDocumentItem } from '@/types/logistiqueTypes';
import { translations } from '@/translations';
import { LogistiqueDocumentsFormCard, LogistiqueDocumentsViewCard } from './logistique-documents-card';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
}));

const t = translations.fr;
const items: LogistiqueDocumentItem[] = [
	{ field: 'titre_importation_file', label: 'Titre d’importation' },
	{ field: 'justificatifs_file', label: 'Justificatif' },
];
const onSelectedFieldChangeAction = jest.fn();
const onFileChangeAction = jest.fn();
const onClearFileAction = jest.fn();
const props = {
	items,
	selectedField: 'titre_importation_file' as const,
	onSelectedFieldChangeAction,
	onFileChangeAction,
	onClearFileAction,
};

beforeEach(() => jest.clearAllMocks());

describe('LogistiqueDocumentsFormCard', () => {
	it('shows an empty state and updates the selected document category', () => {
		render(<LogistiqueDocumentsFormCard {...props} />);
		expect(screen.getByText(t.logistique.noAttachments)).toBeInTheDocument();
		fireEvent.mouseDown(screen.getByRole('combobox'));
		fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Justificatif' }));
		expect(onSelectedFieldChangeAction).toHaveBeenCalledWith('justificatifs_file');
	});

	it('uploads only the first selected file to the selected category and resets the file input', () => {
		const { container } = render(<LogistiqueDocumentsFormCard {...props} accept="application/pdf" />);
		const input = container.querySelector('input[type="file"]')!;
		const file = new File(['invoice'], 'titre.pdf', { type: 'application/pdf' });
		fireEvent.change(input, { target: { files: [file, new File(['other'], 'other.pdf')] } });

		expect(input).toHaveAttribute('accept', 'application/pdf');
		expect(input).toHaveValue('');
		expect(onFileChangeAction).toHaveBeenCalledTimes(1);
		expect(onFileChangeAction).toHaveBeenCalledWith('titre_importation_file', file);
	});

	it('supports dropping a file onto the upload zone', () => {
		render(<LogistiqueDocumentsFormCard {...props} selectedField="justificatifs_file" />);
		const file = new File(['proof'], 'proof.png', { type: 'image/png' });
		fireEvent.drop(screen.getByRole('button', { name: new RegExp(t.logistique.dropFiles) }), {
			dataTransfer: { files: [file] },
		});
		expect(onFileChangeAction).toHaveBeenCalledWith('justificatifs_file', file);
	});

	it('shows a pending attachment and clears it without removing an existing remote file', () => {
		const file = new File(['pdf'], 'nouveau.pdf', { type: 'application/pdf' });
		render(<LogistiqueDocumentsFormCard {...props} items={[{ ...items[0], file, currentUrl: '/ancien.pdf' }]} />);

		expect(screen.getByText(t.logistique.pendingUpload)).toBeInTheDocument();
		expect(screen.getByText(/nouveau.pdf/)).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: t.common.delete }));
		expect(onClearFileAction).toHaveBeenCalledWith('titre_importation_file');
	});

	it('disables file selection and clearing while a request is pending', () => {
		const { container } = render(
			<LogistiqueDocumentsFormCard
				{...props}
				isLoading
				items={[{ ...items[0], file: new File(['pdf'], 'titre.pdf') }]}
			/>,
		);
		expect(container.querySelector('input[type="file"]')).toBeDisabled();
		expect(screen.getByRole('button', { name: t.common.delete })).toBeDisabled();
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});
});

describe('LogistiqueDocumentsViewCard', () => {
	it('lists persisted attachments with decoded filenames and safe download links', () => {
		const url = '/documents/titre%20import.pdf?signature=test';
		render(<LogistiqueDocumentsViewCard items={[{ ...items[0], currentUrl: url }, items[1]]} />);

		expect(screen.getByText('titre import.pdf')).toBeInTheDocument();
		expect(screen.getAllByRole('link')).toHaveLength(1);
		expect(screen.getByRole('link')).toHaveAttribute('href', url);
		expect(screen.getByRole('link')).toHaveAttribute('download', 'titre import.pdf');
		expect(screen.getByRole('link')).toHaveAttribute('rel', 'noreferrer');
	});

	it('does not present unsaved files as downloadable attachments', () => {
		render(<LogistiqueDocumentsViewCard items={[{ ...items[0], file: new File(['pdf'], 'unsaved.pdf') }]} />);
		expect(screen.getByText(t.logistique.noAttachments)).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('shows a loading indicator before the empty state', () => {
		render(<LogistiqueDocumentsViewCard items={[]} isLoading />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(screen.queryByText(t.logistique.noAttachments)).not.toBeInTheDocument();
	});
});
