import { act, render, screen } from '@testing-library/react';
import axios from 'axios';
import { fetchPdfBlob } from '@/utils/apiHelpers';
import PdfLoadingIndicator from './pdfLoadingIndicator';

jest.mock('@/utils/hooks', () => ({ useLanguage: () => ({ t: { pdf: { preparingPdf: 'Préparation du PDF en cours…' } } }) }));
jest.mock('axios', () => {
	const actual = jest.requireActual('axios');
	return { ...actual, __esModule: true, default: { ...actual.default, create: jest.fn() } };
});

it('shows loading until the PDF request completes, then removes it', async () => {
	let finish!: (value: { data: Blob }) => void;
	const pending = new Promise<{ data: Blob }>((resolve) => { finish = resolve; });
	jest.mocked(axios.create).mockReturnValue({ get: jest.fn().mockReturnValue(pending) } as unknown as ReturnType<typeof axios.create>);
	render(<PdfLoadingIndicator />);
	expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
	let request!: Promise<Blob>;
	act(() => { request = fetchPdfBlob('/pdf/nl/1/', 'token'); });
	expect(screen.getByRole('progressbar', { name: 'Préparation du PDF en cours…' })).toBeInTheDocument();
	expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
	await act(async () => { finish({ data: new Blob(['%PDF']) }); await request; });
	expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

it('removes loading after failure', async () => {
	jest.mocked(axios.create).mockReturnValue({ get: jest.fn().mockRejectedValue(new Error('offline')) } as unknown as ReturnType<typeof axios.create>);
	render(<PdfLoadingIndicator />);
	await act(async () => { await expect(fetchPdfBlob('/pdf/nl/1/', 'token')).rejects.toThrow('offline'); });
	expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
