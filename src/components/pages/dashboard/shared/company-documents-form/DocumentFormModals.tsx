'use client';

import { type JSX } from 'react';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import AddArticleModal from '@/components/shared/addArticleModal/addArticleModal';
import GlobalRemiseModal from '@/components/shared/globalRemiseModal/globalRemiseModal';
import type { DocumentFormModalsProps, DocumentListClass } from '@/types/companyDocumentsTypes';
import { useLanguage } from '@/utils/hooks';

const DocumentFormModals = <TDocument extends DocumentListClass = DocumentListClass>({
	isEditMode,
	companyId,
	showAddArticleModal,
	setShowAddArticleModal,
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
	disableRemise = false,
	showDeleteConfirm,
	setShowDeleteConfirm,
	confirmDeleteLine,
}: DocumentFormModalsProps<TDocument>): JSX.Element => {
	const { t } = useLanguage();
	return (
		<>
			{/* Add Article Modal - only in edit mode */}
			{isEditMode && (
				<AddArticleModal
					open={showAddArticleModal}
					onClose={() => {
						setShowAddArticleModal(false);
						setSelectedArticles(new Set());
					}}
					companyId={companyId}
					selectedArticles={selectedArticles}
					setSelectedArticles={setSelectedArticles}
					onAdd={handleAddArticles}
					existingArticleIds={existingArticleIds}
					existingArticleLineValues={existingArticleLineValues}
					documentDevise={documentDevise}
					disableRemise={disableRemise}
				/>
			)}

			{/* Global Remise Modal - only in edit mode */}
			{isEditMode && !disableRemise && (
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
					title={t.documentForm.deleteLineTitle}
					body={t.documentForm.deleteLineBody}
					actions={[
						{
							active: false,
							text: t.common.no,
							onClick: () => setShowDeleteConfirm(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{ active: true, text: t.common.yes, onClick: confirmDeleteLine, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
		</>
	);
};

export default DocumentFormModals;
