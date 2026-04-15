import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { CurrencyType } from '@/types/articleTypes';
import AddArticleModal from './addArticleModal';

const mockUseGetArticlesListQuery = jest.fn();

jest.mock('@/store/services/article', () => ({
	useGetArticlesListQuery: (...args: unknown[]) => mockUseGetArticlesListQuery(...args),
}));

type Article = { id?: number; reference?: string; designation?: string };
type ArticleWithDevise = Article & { devise_prix_vente?: CurrencyType };

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
	rowCount?: number;
	paginationMode?: string;
	paginationModel?: unknown;
	filterMode?: string;
	filterModel?: unknown;
	onPaginationModelChange?: (model: unknown) => void;
	onFilterModelChange?: (model: unknown) => void;
}

// Capture the onRowSelectionModelChange for manual triggering in tests
let capturedOnRowSelectionModelChange: MockGridProps['onRowSelectionModelChange'] | null = null;

/* Mock DataGrid and frFR locale used by the component.
   The mock renders a simple list of rows with a checkbox to simulate selection.
*/
jest.mock('@mui/x-data-grid', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const ReactModule = require('react');
	const MockDataGrid: React.FC<MockGridProps> = (props) => {
		// Capture the callback for manual triggering
		capturedOnRowSelectionModelChange = props.onRowSelectionModelChange;
		
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

	beforeEach(() => {
		capturedOnRowSelectionModelChange = null;
		mockUseGetArticlesListQuery.mockReturnValue({
			data: { count: articles.length, next: null, previous: null, results: articles },
			isLoading: false,
		});
	});

	it('renders modal and shows all rows including existing ones', () => {
		const setSelectedArticles = jest.fn();
		const onAdd = jest.fn();
		const onClose = jest.fn();

		render(
			<AddArticleModal
				open={true}
				onClose={onClose}
				companyId={1}
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

		// all rows should be present; article 2 is already added but still shown
		expect(screen.getByTestId('row-1')).toBeInTheDocument();
		expect(screen.getByTestId('row-2')).toBeInTheDocument();
		expect(screen.getByTestId('row-3')).toBeInTheDocument();
	});

	it('selecting a row calls setSelectedArticles and enables Add after parent state update; calls onAdd and onClose', () => {
		const onAdd = jest.fn();
		const onClose = jest.fn();

		// start with parent-controlled selectedArticles empty
		const { rerender } = render(
			<AddArticleModal
				open={true}
				onClose={onClose}
				companyId={1}
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
				onClose={onClose}
				companyId={1}
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
				onClose={onClose}
				companyId={1}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
			/>,
		);

		const addButton = screen.getByRole('button', { name: /Ajouter/i });
		expect(addButton).toBeDisabled();
	});

	it('handles selection with include type object', () => {
		const setSelectedArticles = jest.fn();
		const onAdd = jest.fn();
		const onClose = jest.fn();

		render(
			<AddArticleModal
				open={true}
				onClose={onClose}
				companyId={1}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
			/>,
		);

		// Manually trigger with include type
		if (capturedOnRowSelectionModelChange) {
			capturedOnRowSelectionModelChange({ type: 'include', ids: new Set([1, 3]) });
		}

		expect(setSelectedArticles).toHaveBeenCalledWith(new Set([1, 3]));
	});

	it('handles selection with exclude type object', () => {
		const setSelectedArticles = jest.fn();
		const onAdd = jest.fn();
		const onClose = jest.fn();

		render(
			<AddArticleModal
				open={true}
				onClose={onClose}
				companyId={1}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
			/>,
		);

		// Manually trigger with exclude type - should select all except excluded
		if (capturedOnRowSelectionModelChange) {
			capturedOnRowSelectionModelChange({ type: 'exclude', ids: new Set([2]) });
		}

		// Should select all available (1, 2, 3) except 2 = [1, 3]
		expect(setSelectedArticles).toHaveBeenCalledWith(new Set([1, 3]));
	});

	it('handles selection with object without type (defaults to include)', () => {
		const setSelectedArticles = jest.fn();
		const onAdd = jest.fn();
		const onClose = jest.fn();

		render(
			<AddArticleModal
				open={true}
				onClose={onClose}
				companyId={1}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
			/>,
		);

		// Manually trigger without type (should default to include)
		if (capturedOnRowSelectionModelChange) {
			capturedOnRowSelectionModelChange({ ids: new Set([2]) });
		}

		expect(setSelectedArticles).toHaveBeenCalledWith(new Set([2]));
	});

	it('queries paginated non-archived articles for the selected company', () => {
		render(
			<AddArticleModal
				open={true}
				onClose={jest.fn()}
				companyId={42}
				selectedArticles={new Set<number>()}
				setSelectedArticles={jest.fn()}
				onAdd={jest.fn()}
				existingArticleIds={new Set<number>()}
			/>,
		);

		expect(mockUseGetArticlesListQuery).toHaveBeenCalledWith(
			expect.objectContaining({ company_id: 42, with_pagination: true, page: 1, pageSize: 10, archived: false }),
			expect.objectContaining({ skip: false }),
		);
	});

	it('filters out articles without id', () => {
		const setSelectedArticles = jest.fn();
		const onAdd = jest.fn();
		const onClose = jest.fn();

		const articlesWithNoId: Article[] = [
			{ id: 1, reference: 'REF-1' },
			{ reference: 'REF-NO-ID' }, // no id
			{ id: 3, reference: 'REF-3' },
		];
		mockUseGetArticlesListQuery.mockReturnValue({
			data: { count: articlesWithNoId.length, next: null, previous: null, results: articlesWithNoId },
			isLoading: false,
		});

		render(
			<AddArticleModal
				open={true}
				onClose={onClose}
				companyId={1}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
			/>,
		);

		// Only rows with id should appear
		expect(screen.getByTestId('row-1')).toBeInTheDocument();
		expect(screen.queryByTestId('row-no-id')).toBeNull();
		expect(screen.getByTestId('row-3')).toBeInTheDocument();
	});

	it('filters articles by documentDevise when set to non-MAD value', () => {
		const setSelectedArticles = jest.fn();
		const onAdd = jest.fn();
		const onClose = jest.fn();

		const articlesWithDevise: ArticleWithDevise[] = [
			{ id: 1, reference: 'REF-1', designation: 'Article EUR', devise_prix_vente: 'EUR' },
			{ id: 2, reference: 'REF-2', designation: 'Article MAD', devise_prix_vente: 'MAD' },
			{ id: 3, reference: 'REF-3', designation: 'Article EUR 2', devise_prix_vente: 'EUR' },
		];
		mockUseGetArticlesListQuery.mockReturnValue({
			data: { count: articlesWithDevise.length, next: null, previous: null, results: articlesWithDevise },
			isLoading: false,
		});

		render(
			<AddArticleModal
				open={true}
				onClose={onClose}
				companyId={1}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={onAdd}
				existingArticleIds={new Set<number>()}
				documentDevise="EUR"
			/>,
		);

		// Only EUR articles should be shown
		expect(screen.getByTestId('row-1')).toBeInTheDocument();
		expect(screen.queryByTestId('row-2')).toBeNull();
		expect(screen.getByTestId('row-3')).toBeInTheDocument();
	});

	it('shows all articles when documentDevise is MAD', () => {
		const setSelectedArticles = jest.fn();

		const articlesWithDevise: ArticleWithDevise[] = [
			{ id: 1, reference: 'REF-1', devise_prix_vente: 'EUR' },
			{ id: 2, reference: 'REF-2', devise_prix_vente: 'MAD' },
		];
		mockUseGetArticlesListQuery.mockReturnValue({
			data: { count: articlesWithDevise.length, next: null, previous: null, results: articlesWithDevise },
			isLoading: false,
		});

		render(
			<AddArticleModal
				open={true}
				onClose={jest.fn()}
				companyId={1}
				selectedArticles={new Set<number>()}
				setSelectedArticles={setSelectedArticles}
				onAdd={jest.fn()}
				existingArticleIds={new Set<number>()}
				documentDevise="MAD"
			/>,
		);

		// MAD doesn't filter, so all are shown
		expect(screen.getByTestId('row-1')).toBeInTheDocument();
		expect(screen.getByTestId('row-2')).toBeInTheDocument();
	});

	it('renders with pre-selected articles', () => {
		render(
			<AddArticleModal
				open={true}
				onClose={jest.fn()}
				companyId={1}
				selectedArticles={new Set<number>([1, 3])}
				setSelectedArticles={jest.fn()}
				onAdd={jest.fn()}
				existingArticleIds={new Set<number>()}
			/>,
		);

		expect(screen.getByText('Ajouter (2)')).toBeInTheDocument();
	});

	it('does not render when closed', () => {
		render(
			<AddArticleModal
				open={false}
				onClose={jest.fn()}
				companyId={1}
				selectedArticles={new Set<number>()}
				setSelectedArticles={jest.fn()}
				onAdd={jest.fn()}
				existingArticleIds={new Set<number>()}
			/>,
		);

		expect(screen.queryByText('Ajouter des articles')).not.toBeInTheDocument();
	});
});
