import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock child components ──────────────────────────────────────────
jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: (props: { title?: string; actions?: Array<{ text: string; onClick: () => void }> }) => (
		<div data-testid="action-modal">
			<span data-testid="action-modal-title">{props.title}</span>
			{props.actions?.map((a, i) => (
				<button key={i} data-testid={`action-modal-btn-${a.text}`} onClick={a.onClick}>
					{a.text}
				</button>
			))}
		</div>
	),
}));
jest.mock('@/components/shared/addArticleModal/addArticleModal', () => ({
	__esModule: true,
	default: (props: { open?: boolean; onClose?: () => void; onAdd?: () => void }) => (
		<div data-testid="add-article-modal" data-open={String(!!props.open)}>
			<button data-testid="add-article-close" onClick={props.onClose}>
				close
			</button>
			<button data-testid="add-article-add" onClick={props.onAdd}>
				add
			</button>
		</div>
	),
}));
jest.mock('@/components/shared/globalRemiseModal/globalRemiseModal', () => ({
	__esModule: true,
	default: (props: { open?: boolean; onClose?: () => void }) => (
		<div data-testid="global-remise-modal" data-open={String(!!props.open)}>
			<button data-testid="global-remise-close" onClick={props.onClose}>
				close
			</button>
		</div>
	),
}));
jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

import DocumentFormModals, { type DocumentFormModalsProps } from './DocumentFormModals';
import type { DocumentFormConfig, DocumentListClass } from '@/types/companyDocumentsTypes';

// ── Helpers ────────────────────────────────────────────────────────
const baseConfig: DocumentFormConfig<DocumentListClass> = {
	documentType: 'devis',
	// supply just enough config to satisfy the generic type
} as DocumentFormConfig<DocumentListClass>;

const defaultProps: DocumentFormModalsProps = {
	isEditMode: true,
	config: baseConfig,
	showAddArticleModal: false,
	setShowAddArticleModal: jest.fn(),
	isArticlesLoading: false,
	articlesData: [],
	selectedArticles: new Set(),
	setSelectedArticles: jest.fn(),
	handleAddArticles: jest.fn(),
	existingArticleIds: new Set(),
	documentDevise: 'MAD',
	showGlobalRemiseModal: false,
	setShowGlobalRemiseModal: jest.fn(),
	currentRemiseType: '',
	currentRemiseValue: 0,
	handleApplyGlobalRemise: jest.fn(),
	showDeleteConfirm: false,
	setShowDeleteConfirm: jest.fn(),
	confirmDeleteLine: jest.fn(),
};

afterEach(() => {
	cleanup();
	jest.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────

describe('DocumentFormModals', () => {
	describe('Add Article Modal', () => {
		it('renders AddArticleModal when in edit mode', () => {
			render(<DocumentFormModals {...defaultProps} isEditMode={true} showAddArticleModal={true} />);
			const modal = screen.getByTestId('add-article-modal');
			expect(modal).toBeInTheDocument();
			expect(modal).toHaveAttribute('data-open', 'true');
		});

		it('does not render AddArticleModal when not in edit mode', () => {
			render(<DocumentFormModals {...defaultProps} isEditMode={false} showAddArticleModal={true} />);
			expect(screen.queryByTestId('add-article-modal')).not.toBeInTheDocument();
		});

		it('calls setShowAddArticleModal(false) and clears selected articles on close', () => {
			const setShowAddArticleModal = jest.fn();
			const setSelectedArticles = jest.fn();
			render(
				<DocumentFormModals
					{...defaultProps}
					isEditMode={true}
					showAddArticleModal={true}
					setShowAddArticleModal={setShowAddArticleModal}
					setSelectedArticles={setSelectedArticles}
				/>,
			);
			fireEvent.click(screen.getByTestId('add-article-close'));
			expect(setShowAddArticleModal).toHaveBeenCalledWith(false);
			expect(setSelectedArticles).toHaveBeenCalledWith(new Set());
		});

		it('calls handleAddArticles when add button is clicked', () => {
			const handleAddArticles = jest.fn();
			render(
				<DocumentFormModals
					{...defaultProps}
					isEditMode={true}
					showAddArticleModal={true}
					handleAddArticles={handleAddArticles}
				/>,
			);
			fireEvent.click(screen.getByTestId('add-article-add'));
			expect(handleAddArticles).toHaveBeenCalledTimes(1);
		});
	});

	describe('Global Remise Modal', () => {
		it('renders GlobalRemiseModal when in edit mode', () => {
			render(<DocumentFormModals {...defaultProps} isEditMode={true} showGlobalRemiseModal={true} />);
			expect(screen.getByTestId('global-remise-modal')).toHaveAttribute('data-open', 'true');
		});

		it('does not render GlobalRemiseModal when not in edit mode', () => {
			render(<DocumentFormModals {...defaultProps} isEditMode={false} showGlobalRemiseModal={true} />);
			expect(screen.queryByTestId('global-remise-modal')).not.toBeInTheDocument();
		});
	});

	describe('Delete Confirmation Modal', () => {
		it('renders delete ActionModal when showDeleteConfirm is true', () => {
			render(<DocumentFormModals {...defaultProps} showDeleteConfirm={true} />);
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByTestId('action-modal-title')).toHaveTextContent('Supprimer la ligne');
		});

		it('does not render delete ActionModal when showDeleteConfirm is false', () => {
			render(<DocumentFormModals {...defaultProps} showDeleteConfirm={false} />);
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('calls confirmDeleteLine when "Oui" button is clicked', () => {
			const confirmDeleteLine = jest.fn();
			render(<DocumentFormModals {...defaultProps} showDeleteConfirm={true} confirmDeleteLine={confirmDeleteLine} />);
			fireEvent.click(screen.getByTestId('action-modal-btn-Oui'));
			expect(confirmDeleteLine).toHaveBeenCalledTimes(1);
		});

		it('calls setShowDeleteConfirm(false) when "Non" button is clicked', () => {
			const setShowDeleteConfirm = jest.fn();
			render(<DocumentFormModals {...defaultProps} showDeleteConfirm={true} setShowDeleteConfirm={setShowDeleteConfirm} />);
			fireEvent.click(screen.getByTestId('action-modal-btn-Non'));
			expect(setShowDeleteConfirm).toHaveBeenCalledWith(false);
		});
	});

});
