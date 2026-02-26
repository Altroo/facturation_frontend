import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock dependencies ──────────────────────────────────────────────
jest.mock('next/image', () => ({
	__esModule: true,
	// eslint-disable-next-line @next/next/no-img-element
	default: (props: Record<string, unknown>) => <img {...props} alt={(props.alt as string) ?? ''} />,
}));
jest.mock('@/utils/helpers', () => ({
	parseNumber: jest.fn((v: string) => {
		const n = Number(v);
		return isNaN(n) ? null : n;
	}),
	safeParseForInput: jest.fn((v: unknown) => (v == null ? '' : String(v))),
	formatNumberWithSpaces: jest.fn((v: number, d: number) => v.toFixed(d)),
}));
jest.mock('@/utils/themes', () => ({
	gridInputTheme: jest.fn(() => ({})),
	customGridDropdownTheme: jest.fn(() => ({})),
}));
jest.mock('@/utils/rawData', () => ({
	remiseTypeItemsList: [
		{ value: 'Pourcentage', label: 'Pourcentage' },
		{ value: 'Fixe', label: 'Fixe' },
	],
}));
jest.mock('@/components/formikElements/formattedNumberInput/formattedNumberInput', () => ({
	__esModule: true,
	default: (props: { id?: string; value?: unknown; error?: boolean; disabled?: boolean; onChange?: (e: unknown) => void }) => (
		<input
			data-testid={`formatted-input-${props.id}`}
			value={String(props.value ?? '')}
			data-error={String(!!props.error)}
			disabled={props.disabled}
			onChange={(e) => props.onChange?.(e)}
		/>
	),
}));
jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => ({
	__esModule: true,
	default: (props: { id?: string; value?: string; onChange?: (e: { target: { value: string } }) => void }) => (
		<select
			data-testid={`dropdown-${props.id}`}
			value={props.value}
			onChange={(e) => props.onChange?.({ target: { value: e.target.value } })}
		>
			<option value="">-</option>
			<option value="Pourcentage">Pourcentage</option>
			<option value="Fixe">Fixe</option>
		</select>
	),
}));
jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('./companyDocumentFormContent', () => ({
	generateRowId: (article: number | string, idx: number) => `${article}_${idx}`,
}));

import { useDocumentLinesColumns, type UseDocumentLinesColumnsParams } from './useDocumentLinesColumns';
import type { DeviFactureLineFormValues } from '@/types/companyDocumentsTypes';
import type { ArticleClass } from '@/models/classes';

// ── Helpers ────────────────────────────────────────────────────────
const makeLine = (overrides: Partial<DeviFactureLineFormValues> = {}): DeviFactureLineFormValues =>
	({
		article: 1,
		designation: 'Widget',
		reference: 'W-001',
		prix_achat: 10,
		prix_vente: 20,
		quantity: 5,
		remise_type: '',
		remise: 0,
		devise_prix_achat: 'MAD',
		devise_prix_vente: 'MAD',
		...overrides,
	}) as DeviFactureLineFormValues;

const makeArticle = (overrides: Partial<ArticleClass> = {}): Partial<ArticleClass> => ({
	id: 1,
	reference: 'W-001',
	designation: 'Widget',
	marque_name: 'BrandA',
	categorie_name: 'CatA',
	photo: null,
	unite_name: 'Kg',
	archived: false,
	...overrides,
});

/** Render hook columns via a DataGrid-like cell renderer test helper */
const HookRenderer: React.FC<{
	params: UseDocumentLinesColumnsParams;
	columnField: string;
	row: Record<string, unknown>;
	rowId: string;
}> = ({ params, columnField, row, rowId }) => {
	const { linesColumns } = useDocumentLinesColumns(params);
	const col = linesColumns.find((c) => c.field === columnField);
	if (!col?.renderCell) return <div data-testid="no-render-cell" />;
	const element = col.renderCell({
		id: rowId,
		row,
		value: row[columnField],
		field: columnField,
	} as never);
	return <>{element}</>;
};

const defaultLine = makeLine();
const defaultArticle = makeArticle();

const buildParams = (overrides: Partial<UseDocumentLinesColumnsParams> = {}): UseDocumentLinesColumnsParams => ({
	getLines: () => [defaultLine],
	validationErrors: {},
	role: undefined,
	devise: 'MAD',
	handleLineChangeRef: { current: jest.fn() } as unknown as React.RefObject<
		(index: number, field: keyof DeviFactureLineFormValues, value: string | number) => void
	>,
	handleDeleteLine: jest.fn(),
	getArticleById: () => defaultArticle,
	...overrides,
});

afterEach(() => {
	cleanup();
	jest.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────

describe('useDocumentLinesColumns', () => {
	describe('returns correct column definitions', () => {
		it('produces all expected column fields', () => {
			const Wrapper = () => {
				const { linesColumns } = useDocumentLinesColumns(buildParams());
				return <div data-testid="fields">{linesColumns.map((c) => c.field).join(',')}</div>;
			};
			render(<Wrapper />);
			expect(screen.getByTestId('fields').textContent).toBe(
				'photo,reference,designation,marque,categorie,prix_achat,prix_vente,quantity,remise_type,remise,actions',
			);
		});
	});

	describe('photo column', () => {
		it('renders placeholder icon when article has no photo', () => {
			const params = buildParams({ getArticleById: () => makeArticle({ photo: null }) });
			const { container } = render(
				<HookRenderer params={params} columnField="photo" row={{ article: 1 }} rowId="1_0" />,
			);
			// Inventory2Icon renders as an SVG via MUI — in test env it renders the SVG element
			expect(container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders an image when article has a photo', () => {
			const params = buildParams({ getArticleById: () => makeArticle({ photo: 'https://img.test/photo.jpg' }) });
			const { container } = render(
				<HookRenderer params={params} columnField="photo" row={{ article: 1 }} rowId="1_0" />,
			);
			const img = container.querySelector('img');
			expect(img).toBeInTheDocument();
			expect(img?.getAttribute('src')).toBe('https://img.test/photo.jpg');
		});
	});

	describe('reference column', () => {
		it('displays reference from article lookup', () => {
			const params = buildParams({ getArticleById: () => makeArticle({ reference: 'REF-42' }) });
			render(<HookRenderer params={params} columnField="reference" row={{ article: 1 }} rowId="1_0" />);
			expect(screen.getByText('REF-42')).toBeInTheDocument();
		});

		it('shows archived badge when article is archived', () => {
			const params = buildParams({ getArticleById: () => makeArticle({ archived: true, reference: 'REF-X' }) });
			render(<HookRenderer params={params} columnField="reference" row={{ article: 1 }} rowId="1_0" />);
			expect(screen.getByText('(Archivé)')).toBeInTheDocument();
		});
	});

	describe('prix_vente column', () => {
		it('renders a read-only value for Commercial role', () => {
			const params = buildParams({ role: 'Commercial' });
			render(<HookRenderer params={params} columnField="prix_vente" row={{ article: 1 }} rowId="1_0" />);
			// Commercial role gets a plain Typography (no input)
			expect(screen.queryByTestId('formatted-input-prix_vente_0')).not.toBeInTheDocument();
		});

		it('renders an editable input for non-Commercial role', () => {
			const params = buildParams({ role: 'Admin' });
			render(<HookRenderer params={params} columnField="prix_vente" row={{ article: 1 }} rowId="1_0" />);
			expect(screen.getByTestId('formatted-input-prix_vente_0')).toBeInTheDocument();
		});
	});

	describe('quantity column', () => {
		it('renders editable quantity input', () => {
			const params = buildParams();
			render(<HookRenderer params={params} columnField="quantity" row={{ article: 1 }} rowId="1_0" />);
			expect(screen.getByTestId('formatted-input-quantity_0')).toBeInTheDocument();
		});
	});

	describe('remise column', () => {
		it('renders disabled when remise_type is empty', () => {
			const params = buildParams({ getLines: () => [makeLine({ remise_type: '' })] });
			render(<HookRenderer params={params} columnField="remise" row={{ article: 1 }} rowId="1_0" />);
			expect(screen.getByTestId('formatted-input-remise_0')).toBeDisabled();
		});

		it('renders enabled when remise_type is set', () => {
			const params = buildParams({ getLines: () => [makeLine({ remise_type: 'Pourcentage' })] });
			render(<HookRenderer params={params} columnField="remise" row={{ article: 1 }} rowId="1_0" />);
			expect(screen.getByTestId('formatted-input-remise_0')).not.toBeDisabled();
		});
	});

	describe('actions column', () => {
		it('calls handleDeleteLine when delete button is clicked', () => {
			const handleDeleteLine = jest.fn();
			const params = buildParams({ handleDeleteLine });
			render(<HookRenderer params={params} columnField="actions" row={{ article: 1 }} rowId="1_0" />);
			fireEvent.click(screen.getByLabelText('Supprimer la ligne'));
			expect(handleDeleteLine).toHaveBeenCalledWith(0);
		});
	});

	describe('validation errors', () => {
		it('shows error state on prix_vente when validation error exists', () => {
			const params = buildParams({ validationErrors: { ligne_0_prix_vente: 'Required' }, role: 'Admin' });
			render(<HookRenderer params={params} columnField="prix_vente" row={{ article: 1 }} rowId="1_0" />);
			expect(screen.getByTestId('formatted-input-prix_vente_0')).toHaveAttribute('data-error', 'true');
		});

		it('shows error state on quantity when validation error exists', () => {
			const params = buildParams({ validationErrors: { ligne_0_quantity: 'Required' } });
			render(<HookRenderer params={params} columnField="quantity" row={{ article: 1 }} rowId="1_0" />);
			expect(screen.getByTestId('formatted-input-quantity_0')).toHaveAttribute('data-error', 'true');
		});
	});
});
