import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogistiqueParameterSelect from './logistique-parameter-select';
import type { LogisticsParameterKind } from '@/types/parameterTypes';

const mockAdd = jest.fn();
const mockEdit = jest.fn();
const mockRemove = jest.fn();
const mockQuery = jest.fn();
const mockMemberships = jest.fn();
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'local-test' }));
jest.mock('@/store/services/company', () => ({ useGetUserCompaniesQuery: () => mockMemberships() }));
jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
}));
jest.mock('@/store/services/parameter', () => ({
	useGetLogisticsParameterListQuery: (...args: unknown[]) => mockQuery(...args),
	useAddLogisticsParameterMutation: () => [mockAdd],
	useEditLogisticsParameterMutation: () => [mockEdit],
	useDeleteLogisticsParameterMutation: () => [mockRemove],
}));

const Harness = ({ kind }: { kind: LogisticsParameterKind }) => {
	const [value, setValue] = useState('EXW');
	return <LogistiqueParameterSelect kind={kind} companyId={1} value={value} onChange={setValue} />;
};

beforeEach(() => {
	jest.clearAllMocks();
	mockQuery.mockReturnValue({ currentData: [{ id: 1, nom: 'EXW', company: 1 }] });
	mockMemberships.mockReturnValue({ data: [{ id: 1, role: 'Logistique' }] });
	mockAdd.mockReturnValue({ unwrap: async () => ({ id: 2, nom: 'AAA', company: 1 }) });
	mockEdit.mockReturnValue({ unwrap: async () => ({ id: 2, nom: 'BBB', company: 1 }) });
	mockRemove.mockReturnValue({ unwrap: async () => undefined });
});

it.each<LogisticsParameterKind>(['incoterm', 'origine_marchandise', 'nature_marchandise'])(
	'adds, renames and deletes unused %s entries in its company',
	async (kind) => {
		const user = userEvent.setup();
		render(<Harness kind={kind} />);
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));
		let dialog = screen.getByRole('dialog');
		await user.type(within(dialog).getByRole('textbox'), 'AAA');
		await user.click(within(dialog).getByRole('button', { name: 'Ajouter' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(screen.getByRole('combobox')).toHaveValue('AAA');
		expect(mockAdd).toHaveBeenCalledWith({ kind, data: { nom: 'AAA', company: 1 } });
		await user.click(screen.getByTitle('Mettre à jour'));
		dialog = screen.getByRole('dialog');
		await user.clear(within(dialog).getByRole('textbox'));
		await user.type(within(dialog).getByRole('textbox'), 'BBB');
		await user.click(within(dialog).getByRole('button', { name: 'Mettre à jour' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(screen.getByRole('combobox')).toHaveValue('BBB');
		expect(mockEdit).toHaveBeenCalledWith({ kind, id: 2, data: { nom: 'BBB', company: 1 } });
		await user.click(screen.getByTitle('Supprimer'));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(screen.getByRole('combobox')).toHaveValue('');
		expect(mockRemove).toHaveBeenCalledWith({ kind, id: 2 });
	},
);

it('retains a used value when deletion is rejected and explains why', async () => {
	mockRemove.mockReturnValue({
		unwrap: async () => {
			return Promise.reject({
				data: { details: { nom: ['Cet Incoterm est déjà utilisé dans un dossier et ne peut pas être supprimé.'] } },
			});
		},
	});
	render(<Harness kind="incoterm" />);
	fireEvent.click(screen.getByTitle('Supprimer'));
	fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }));
	expect(await screen.findByRole('alert')).toHaveTextContent('déjà utilisé dans un dossier');
	expect(screen.getByRole('combobox', { hidden: true })).toHaveValue('EXW');
	expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('shows legacy values and hides management controls for accounting', () => {
	mockMemberships.mockReturnValue({ data: [{ id: 1, role: 'Comptable' }] });
	mockQuery.mockReturnValue({ currentData: [] });
	render(<Harness kind="incoterm" />);
	expect(screen.getByRole('combobox')).toHaveValue('EXW');
	expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
});
