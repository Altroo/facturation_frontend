'use client';

import React from 'react';
import {
	Delete as DeleteIcon,
	Close as CloseIcon,
	Payment as PaymentIcon,
	LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import AddArticleModal from '@/components/shared/addArticleModal/addArticleModal';
import GlobalRemiseModal from '@/components/shared/globalRemiseModal/globalRemiseModal';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import { textInputTheme } from '@/utils/themes';
import type { ArticleClass } from '@/models/classes';
import type { TypeRemiseType } from '@/types/devisTypes';
import type { DocumentFormConfig, DocumentListClass } from '@/types/companyDocumentsTypes';
import type { SelectedArticlePopupValues } from '@/components/shared/addArticleModal/addArticleModal';

const inputFieldTheme = textInputTheme();

export interface DocumentFormModalsProps<TDocument extends DocumentListClass = DocumentListClass> {
	isEditMode: boolean;
	config: DocumentFormConfig<TDocument>;
	// Add Article modal
	showAddArticleModal: boolean;
	setShowAddArticleModal: (v: boolean) => void;
	isArticlesLoading: boolean;
	articlesData: Array<Partial<ArticleClass>> | undefined;
	selectedArticles: Set<number>;
	setSelectedArticles: (v: Set<number>) => void;
	handleAddArticles: (selectedArticlesData: SelectedArticlePopupValues[]) => void;
	existingArticleIds: Set<number>;
	existingArticleLineValues?: Record<number, { quantity: string | number; remise_type: TypeRemiseType; remise: string | number }>;
	documentDevise: string;
	// Global Remise modal
	showGlobalRemiseModal: boolean;
	setShowGlobalRemiseModal: (v: boolean) => void;
	currentRemiseType: string;
	currentRemiseValue: number;
	handleApplyGlobalRemise: (type: 'Pourcentage' | 'Fixe' | '', value: number) => void;
	// Delete Confirm modal
	showDeleteConfirm: boolean;
	setShowDeleteConfirm: (v: boolean) => void;
	confirmDeleteLine: () => void;
	// Mode Paiement modal
	openModePaiementModal: boolean;
	setOpenModePaiementModal: (v: boolean) => void;
	addModePaiement: (args: { data: { nom: string } }) => Promise<unknown>;
	onModePaiementSuccess: (newId: number) => void;
	// Livre Par modal (bon de livraison only)
	openLivreParModal: boolean;
	setOpenLivreParModal: (v: boolean) => void;
	addLivrePar: (args: { data: { nom: string } }) => Promise<unknown>;
	onLivreParSuccess: (newId: number) => void;
}

const DocumentFormModals = <TDocument extends DocumentListClass = DocumentListClass>({
	isEditMode,
	config,
	showAddArticleModal,
	setShowAddArticleModal,
	isArticlesLoading,
	articlesData,
	selectedArticles,
	setSelectedArticles,
	handleAddArticles,
	existingArticleIds,
	existingArticleLineValues = {},
	documentDevise,
	showGlobalRemiseModal,
	setShowGlobalRemiseModal,
	currentRemiseType,
	currentRemiseValue,
	handleApplyGlobalRemise,
	showDeleteConfirm,
	setShowDeleteConfirm,
	confirmDeleteLine,
	openModePaiementModal,
	setOpenModePaiementModal,
	addModePaiement,
	onModePaiementSuccess,
	openLivreParModal,
	setOpenLivreParModal,
	addLivrePar,
	onLivreParSuccess,
}: DocumentFormModalsProps<TDocument>): React.JSX.Element => {
	return (
		<>
			{/* Add Article Modal - only in edit mode */}
			{isEditMode && (
				<AddArticleModal
					open={showAddArticleModal}
					loading={isArticlesLoading}
					onClose={() => {
						setShowAddArticleModal(false);
						setSelectedArticles(new Set());
					}}
					articles={(articlesData || []).map((a) => ({
						...a,
						designation: a.designation ?? undefined,
						reference: a.reference ?? undefined,
						marque_name: a.marque_name ?? undefined,
						categorie_name: a.categorie_name ?? undefined,
					}))}
					selectedArticles={selectedArticles}
					setSelectedArticles={setSelectedArticles}
					onAdd={handleAddArticles}
					existingArticleIds={existingArticleIds}
					existingArticleLineValues={existingArticleLineValues}
					documentDevise={documentDevise}
				/>
			)}

			{/* Global Remise Modal - only in edit mode */}
			{isEditMode && (
				<GlobalRemiseModal
					open={showGlobalRemiseModal}
					onClose={() => setShowGlobalRemiseModal(false)}
					currentType={currentRemiseType}
					currentValue={currentRemiseValue}
					onApply={handleApplyGlobalRemise}
					devise={documentDevise}
				/>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<ActionModals
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					title="Supprimer la ligne"
					body="Êtes-vous sûr de vouloir supprimer cette ligne ?"
					actions={[
						{
							active: false,
							text: 'Non',
							onClick: () => setShowDeleteConfirm(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{ active: true, text: 'Oui', onClick: confirmDeleteLine, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}

			<AddEntityModal
				open={openModePaiementModal}
				setOpen={setOpenModePaiementModal}
				label="mode de paiement"
				icon={<PaymentIcon fontSize="small" />}
				inputTheme={inputFieldTheme}
				mutationFn={addModePaiement}
				onSuccess={onModePaiementSuccess}
			/>
			{config.documentType === 'bon-de-livraison' && (
				<AddEntityModal
					open={openLivreParModal}
					setOpen={setOpenLivreParModal}
					label="livreur"
					icon={<LocalShippingIcon fontSize="small" />}
					inputTheme={inputFieldTheme}
					mutationFn={addLivrePar}
					onSuccess={onLivreParSuccess}
				/>
			)}
		</>
	);
};

export default DocumentFormModals;
