import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useAddLogistiqueSupplierMutation,
	useEditLogistiqueSupplierMutation,
	useGetLogistiqueSupplierQuery,
} from '@/store/services/logistique';
import { useAppSelector } from '@/utils/hooks';
import { LOGISTIQUE_SUPPLIERS, LOGISTIQUE_SUPPLIER_VIEW } from '@/utils/routes';
import { translations } from '@/translations';
import LogistiqueSuppliersForm from './logistique-suppliers-form';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockOnSuccess = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }) }));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: jest.fn() }));
jest.mock('@/store/selectors', () => ({ getUserCompaniesState: jest.fn() }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
	useToast: () => ({ onSuccess: mockOnSuccess }),
}));
jest.mock('@/store/services/parameter', () => ({ useGetMarqueListQuery: () => ({ data: [] }) }));
jest.mock('@/store/services/logistique', () => ({
	useGetLogistiqueSupplierQuery: jest.fn(),
	useAddLogistiqueSupplierMutation: jest.fn(),
	useEditLogistiqueSupplierMutation: jest.fn(),
}));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ title, children }: { title: string; children: ReactNode }) => (
		<>
			<h1>{title}</h1>
			{children}
		</>
	),
}));
jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <p>Accès refusé</p>,
}));
jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div role="progressbar" />,
}));

const t = translations.fr;
const mockRefetch = jest.fn();
const mockUnwrap = jest.fn();
const mockAdd = jest.fn(() => ({ unwrap: mockUnwrap }));
const mockEdit = jest.fn(() => ({ unwrap: mockUnwrap }));
const nameInput = () => screen.getByRole('textbox', { name: t.logistique.supplierName });
const emailInput = () => screen.getByRole('textbox', { name: t.logistique.colSupplierEmail });
const submit = () => fireEvent.click(screen.getByRole('button', { name: t.common.save }));

beforeEach(() => {
	jest.clearAllMocks();
	window.sessionStorage.clear();
	(useInitAccessToken as jest.Mock).mockReturnValue('token');
	(useAppSelector as jest.Mock).mockReturnValue([{ id: 12, role: 'Logistique' }]);
	(useGetLogistiqueSupplierQuery as jest.Mock).mockReturnValue({ refetch: mockRefetch });
	(useAddLogistiqueSupplierMutation as jest.Mock).mockReturnValue([mockAdd]);
	(useEditLogistiqueSupplierMutation as jest.Mock).mockReturnValue([mockEdit]);
	mockUnwrap.mockResolvedValue({ id: 7 });
});

describe('LogistiqueSuppliersForm', () => {
	it.each(['Caissier', 'Commercial', 'Logistique'])('allows %s to create a supplier with localized hints', (role) => {
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 12, role }]);
		render(<LogistiqueSuppliersForm company_id={12} />);

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.logistique.supplierAddTitle);
		expect(nameInput()).toBeRequired();
		expect(nameInput()).toHaveAttribute('placeholder', t.logistique.placeholders.nom);
		expect(emailInput()).toHaveAttribute('placeholder', t.logistique.placeholders.email);
		expect(useGetLogistiqueSupplierQuery).toHaveBeenCalledWith({ id: 0, company_id: 12 }, { skip: true });
	});

	it.each(['Lecture', 'Comptable'])('denies form access for %s', (role) => {
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 12, role }]);
		render(<LogistiqueSuppliersForm company_id={12} />);

		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
		expect(useGetLogistiqueSupplierQuery).not.toHaveBeenCalled();
	});

	it('denies access to a company outside the user memberships', () => {
		render(<LogistiqueSuppliersForm company_id={34} />);

		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});

	it('waits for authentication before loading an existing supplier', () => {
		(useInitAccessToken as jest.Mock).mockReturnValue(undefined);
		render(<LogistiqueSuppliersForm company_id={12} id={7} />);

		expect(useGetLogistiqueSupplierQuery).toHaveBeenCalledWith({ id: 7, company_id: 12 }, { skip: true });
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});

	it('loads current supplier data for editing and submits a company-scoped update', async () => {
		(useGetLogistiqueSupplierQuery as jest.Mock).mockReturnValue({
			currentData: { nom: 'Fournisseur existant', email: 'supplier@example.com', marques: [] },
			refetch: mockRefetch,
		});
		render(<LogistiqueSuppliersForm company_id={12} id={7} />);

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.logistique.supplierEditTitle);
		expect(nameInput()).toHaveValue('Fournisseur existant');
		expect(emailInput()).toHaveValue('supplier@example.com');
		fireEvent.change(nameInput(), { target: { value: 'Nouveau nom' } });
		submit();

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(LOGISTIQUE_SUPPLIER_VIEW(7, 12)));
		expect(mockEdit).toHaveBeenCalledWith({
			id: 7,
			company_id: 12,
			nom: 'Nouveau nom',
			email: 'supplier@example.com',
			marques: [],
		});
		expect(mockAdd).not.toHaveBeenCalled();
	});

	it('creates a supplier using trimmed inputs and keeps the company in the return URL', async () => {
		render(<LogistiqueSuppliersForm company_id={12} />);
		fireEvent.change(nameInput(), { target: { value: '  Fournisseur Test  ' } });
		fireEvent.change(emailInput(), { target: { value: ' supplier@example.com ' } });
		submit();

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(LOGISTIQUE_SUPPLIER_VIEW(7, 12)));
		expect(mockAdd).toHaveBeenCalledWith({
			company_id: 12,
			nom: 'Fournisseur Test',
			email: 'supplier@example.com',
			marques: [],
		});
		expect(mockOnSuccess).toHaveBeenCalledWith(t.logistique.supplierSaved);
		expect(mockEdit).not.toHaveBeenCalled();
	});

	it('requires a supplier name and validates the optional email before saving', async () => {
		render(<LogistiqueSuppliersForm company_id={12} />);
		submit();
		expect(await screen.findByText(t.logistique.supplierRequired)).toBeInTheDocument();

		fireEvent.change(nameInput(), { target: { value: 'Fournisseur Test' } });
		fireEvent.change(emailInput(), { target: { value: 'invalid-email' } });
		submit();
		expect(await screen.findByText(t.logistique.supplierInvalidEmail)).toBeInTheDocument();
		expect(mockAdd).not.toHaveBeenCalled();
	});

	it('shows API field errors without losing inputs or navigating away', async () => {
		mockUnwrap.mockRejectedValueOnce({ data: { details: { nom: ['Ce fournisseur existe déjà.'] } } });
		render(<LogistiqueSuppliersForm company_id={12} />);
		fireEvent.change(nameInput(), { target: { value: 'Fournisseur Test' } });
		submit();

		expect(await screen.findByRole('alert')).toHaveTextContent('Ce fournisseur existe déjà.');
		expect(nameInput()).toHaveValue('Fournisseur Test');
		expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
		expect(mockReplace).not.toHaveBeenCalled();
		expect(mockOnSuccess).not.toHaveBeenCalled();
	});

	it('disables the form while saving and restores it after the request completes', async () => {
		let resolveSave!: (value: { id: number }) => void;
		mockUnwrap.mockReturnValueOnce(new Promise((resolve) => (resolveSave = resolve)));
		render(<LogistiqueSuppliersForm company_id={12} />);
		fireEvent.change(nameInput(), { target: { value: 'Fournisseur Test' } });
		submit();

		await waitFor(() => expect(mockAdd).toHaveBeenCalledTimes(1));
		expect(nameInput()).toBeDisabled();
		expect(screen.getByRole('button', { name: t.common.save })).toBeDisabled();
		expect(screen.getByRole('button', { name: t.logistique.supplierBackToList })).toBeDisabled();
		await act(async () => resolveSave({ id: 7 }));
		expect(nameInput()).toBeEnabled();
	});

	it('allows retrying a failed supplier load', () => {
		(useGetLogistiqueSupplierQuery as jest.Mock).mockReturnValue({ error: { status: 500 }, refetch: mockRefetch });
		render(<LogistiqueSuppliersForm company_id={12} id={7} />);

		expect(screen.getByRole('alert')).toHaveTextContent(t.logistique.supplierLoadError);
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: t.common.retry }));
		expect(mockRefetch).toHaveBeenCalledTimes(1);
	});

	it('returns to the company supplier list', () => {
		render(<LogistiqueSuppliersForm company_id={12} />);
		fireEvent.click(screen.getByRole('button', { name: t.logistique.supplierBackToList }));

		expect(mockPush).toHaveBeenCalledWith(`${LOGISTIQUE_SUPPLIERS}?company_id=12`);
	});
});
