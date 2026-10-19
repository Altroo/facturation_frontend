import { render, screen } from '@testing-library/react';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetLogistiqueQuery } from '@/store/services/logistique';
import type { LogistiqueFormProps as Props } from '@/types/logistiqueTypes';
import PurchaseRoute from './logistique-form';

jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: jest.fn() }));
jest.mock('@/store/services/logistique', () => ({ useGetLogistiqueQuery: jest.fn() }));
jest.mock('./logistique-historical-form', () => ({
	__esModule: true,
	default: ({ company_id, id }: Props) => (
		<p>
			Historique : {company_id}/{id}
		</p>
	),
}));
jest.mock('./supplier-purchase-form', () => ({
	__esModule: true,
	default: ({ company_id, id }: Props) => (
		<p>
			Fournisseur : {company_id}/{id ?? 'new'}
		</p>
	),
}));

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(useInitAccessToken).mockReturnValue('token');
	(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ currentData: { workflow_version: 1 } });
});

describe('Logistique form workflow selection', () => {
	it.each([{ workflow_version: 2 }, { workflow_version: 1, can_adopt_supplier_workflow: true }])(
		'loads the supplier screen for %j and preserves the company and dossier',
		async (record) => {
			(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ currentData: record });
			render(<PurchaseRoute company_id={12} id={7} />);
			expect(await screen.findByText('Fournisseur : 12/7')).toBeInTheDocument();
			expect(screen.queryByText(/Historique/)).not.toBeInTheDocument();
		},
	);

	it('loads the historical screen for a dossier that cannot adopt the supplier workflow', async () => {
		render(<PurchaseRoute company_id={12} id={7} />);
		expect(await screen.findByText('Historique : 12/7')).toBeInTheDocument();
		expect(screen.queryByText(/Fournisseur/)).not.toBeInTheDocument();
	});

	it('waits for the current dossier instead of using a previously cached dossier', () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ data: { workflow_version: 1 }, isFetching: true });
		render(<PurchaseRoute company_id={34} id={8} />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(screen.queryByText(/Historique|Fournisseur/)).not.toBeInTheDocument();
		expect(useGetLogistiqueQuery).toHaveBeenCalledWith({ id: 8 }, { skip: false });
	});

	it('waits for authentication before loading either screen', () => {
		jest.mocked(useInitAccessToken).mockReturnValue(undefined);
		render(<PurchaseRoute company_id={12} id={7} />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(screen.queryByText(/Historique|Fournisseur/)).not.toBeInTheDocument();
		expect(useGetLogistiqueQuery).toHaveBeenCalledWith({ id: 7 }, { skip: true });
	});

	it('uses the page session when resolving the access token', async () => {
		const session = {
			expires: '2026-10-25T12:00:00Z',
			accessToken: 'session-token',
			refreshToken: 'refresh-token',
			accessTokenExpiration: '2026-10-25T12:00:00Z',
			refreshTokenExpiration: '2026-10-25T12:00:00Z',
			user: {
				id: '27',
				pk: 27,
				email: 'logistique@example.com',
				emailVerified: null,
				name: 'Test User',
				first_name: 'Test',
				last_name: 'User',
			},
		};
		render(<PurchaseRoute company_id={12} id={7} session={session} />);
		expect(await screen.findByText('Historique : 12/7')).toBeInTheDocument();
		expect(useInitAccessToken).toHaveBeenCalledWith(session);
	});

	it('lets the supplier screen handle dossier query errors', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({ error: { status: 403 } });
		render(<PurchaseRoute company_id={12} id={7} />);
		expect(await screen.findByText('Fournisseur : 12/7')).toBeInTheDocument();
	});

	it('opens new dossiers in the supplier workflow without fetching a dossier', async () => {
		(useGetLogistiqueQuery as jest.Mock).mockReturnValue({});
		render(<PurchaseRoute company_id={12} />);
		expect(await screen.findByText('Fournisseur : 12/new')).toBeInTheDocument();
		expect(useGetLogistiqueQuery).toHaveBeenCalledWith({ id: 0 }, { skip: true });
	});
});
