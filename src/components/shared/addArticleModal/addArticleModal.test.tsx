import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddArticleModal from './addArticleModal';

type Article = { id?: number; reference?: string; designation?: string };

interface MockGridProps {
	rows: Article[];
	onRowSelectionModelChange?: (selection: number[] | { type?: string; ids: Set<number> }) => void;
	loading?: boolean;
	columns?: unknown;
	checkboxSelection?: boolean;
	rowSelectionModel?: unknown;
	showToolbar?: boolean;
	slotProps?: unknown;
	localeText?: unknown;
	pageSizeOptions?: number[];
	initialState?: unknown;
	sx?: unknown;
}

/* Mock DataGrid and frFR locale used by the component.
   The mock renders a simple list of rows with a checkbox to simulate selection.
*/
jest.mock('@mui/x-data-grid', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const ReactModule = require('react');
	const MockDataGrid: React.FC<MockGridProps> = (props) => {
		const rows = props.rows ?? [];
		return ReactModule.createElement(
			'div',
			{ 'data-testid': 'mock-datagrid' },
			rows.map((r) => {
				const id = r.id ?? 'no-id';
				return ReactModule.createElement(
					'div',
					{ key: String(id), 'data-testid': `row-${id}`, style: { display: 'flex', gap: 8, alignItems: 'center' } },
					ReactModule.createElement('input', {
						type: 'checkbox',
						'data-testid': `row-checkbox-${id}`,
						onClick: () => {
							// emulate DataGrid calling onRowSelectionModelChange with an array of ids
							props.onRowSelectionModelChange?.([id as number]);
						},
					}),
					ReactModule.createElement('span', {}, String(r.reference ?? r.designation ?? `#${id}`)),
				);
			}),
		);
	};

	const frFR = { components: { MuiDataGrid: { defaultProps: { localeText: {} } } } };

	return { DataGrid: MockDataGrid, GridColDef: () => ({}), GridRowId: Number, GridRowSelectionModel: Object, frFR };
});

describe('AddArticleModal', () => {
	const articles: Article[] = [
		{ id: 1, reference: 'REF-1', designation: 'Article 1' },
		{ id: 2, reference: 'REF-2', designation: 'Article 2' },
		{ id: 3, reference: 'REF-3', designation: 'Article 3' },
	];

	it('renders modal, excludes existingArticleIds and shows rows', () => {
		const setSelectedArticles = jest.fn();
		const onAdd = jest.fn();
		const onClose = jest.fn();

		render(
			<AddArticleModal
				open={true}
				loading={false}
				onClose={onClose}
				articles={articles}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={onAdd}
				existingArticleIds={new Set<number>([2])}
			/>,
		);

		expect(screen.getByText('Ajouter des articles')).toBeInTheDocument();
		expect(screen.getByText('Annuler')).toBeInTheDocument();
		// Add button shows count from prop
		expect(screen.getByText('Ajouter (0)')).toBeInTheDocument();

		// rows 1 and 3 should be present, 2 excluded
		expect(screen.getByTestId('row-1')).toBeInTheDocument();
		expect(screen.queryByTestId('row-2')).toBeNull();
		expect(screen.getByTestId('row-3')).toBeInTheDocument();
	});

	it('selecting a row calls setSelectedArticles and enables Add after parent state update; calls onAdd and onClose', () => {
		const onAdd = jest.fn();
		const onClose = jest.fn();

		// start with parent-controlled selectedArticles empty
		const { rerender } = render(
			<AddArticleModal
				open={true}
				loading={false}
				onClose={onClose}
				articles={articles}
				selectedArticles={new Set<number>()}
				setSelectedArticles={(s: Set<number>) => {
					// this mock setter isn't used to update the prop automatically in this test;
					// instead the test will assert it was called and then rerender with updated set.
					// Keep a spy-like function to assert it was called.
					// To allow assertion, wrap in jest.fn via closure:
					(setSelectedSpy as jest.Mock).mockImplementation(() => {});
					setSelectedSpy(s);
				}}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
			/>,
		);

		const setSelectedSpy = jest.fn();
		// click checkbox for row-1 to trigger DataGrid mock selection handler
		const checkbox = screen.getByTestId('row-checkbox-1');
		fireEvent.click(checkbox);

		// ensure the mocked setter was invoked with a Set containing 1
		expect(setSelectedSpy).toHaveBeenCalledTimes(1);
		const calledWith = setSelectedSpy.mock.calls[0][0] as Set<number>;
		expect(calledWith.has(1)).toBe(true);
		expect(calledWith.size).toBe(1);

		// simulate parent updating selectedArticles prop to reflect selection
		rerender(
			<AddArticleModal
				open={true}
				loading={false}
				onClose={onClose}
				articles={articles}
				selectedArticles={new Set<number>([1])}
				setSelectedArticles={() => {}}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
			/>,
		);

		// Add button should be enabled now (since selectedArticles.size === 1)
		const addButton = screen.getByRole('button', { name: /Ajouter/i });
		expect(addButton).not.toBeDisabled();

		// click Add -> calls onAdd
		fireEvent.click(addButton);
		expect(onAdd).toHaveBeenCalledTimes(1);

		// click Annuler -> calls onClose
		const cancelButton = screen.getByText('Annuler');
		fireEvent.click(cancelButton);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('Add button remains disabled when no selection', () => {
		const setSelectedArticles = jest.fn();
		const onAdd = jest.fn();
		const onClose = jest.fn();

		render(
			<AddArticleModal
				open={true}
				loading={false}
				onClose={onClose}
				articles={articles}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
			/>,
		);

		const addButton = screen.getByRole('button', { name: /Ajouter/i });
		expect(addButton).toBeDisabled();
	});
});
