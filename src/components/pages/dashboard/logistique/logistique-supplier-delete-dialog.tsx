'use client';

import { useState } from 'react';
import { Alert } from '@mui/material';
import { Close, Delete } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { useDeleteLogistiqueSupplierMutation } from '@/store/services/logistique';
import { useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage } from '@/utils/helpers';
import type { LogistiqueSupplier } from '@/types/logistiqueTypes';

export default function SupplierDeleteDialog({
	supplier,
	onClose,
	onDeleted,
	beforeDelete,
}: {
	supplier: LogistiqueSupplier;
	onClose: () => void;
	onDeleted: () => void;
	beforeDelete?: () => void;
}) {
	const { t } = useLanguage();
	const { onSuccess } = useToast();
	const [remove, { isLoading }] = useDeleteLogistiqueSupplierMutation();
	const [error, setError] = useState('');
	const confirm = async () => {
		setError('');
		beforeDelete?.();
		try {
			await remove({ id: supplier.id, company_id: supplier.company }).unwrap();
			onSuccess(t.logistique.supplierDeleted);
			onDeleted();
		} catch (e) {
			setError(extractApiErrorMessage(e, t.logistique.supplierDeleteError));
		}
	};
	if (supplier.total_dossiers > 0)
		return (
			<ActionModals
				title={t.logistique.supplierDeleteTitle}
				titleIcon={<Delete />}
				titleIconColor="#D32F2F"
				body={t.logistique.supplierInUse}
				onClose={onClose}
				actions={[{ text: t.common.close, active: false, icon: <Close />, onClick: onClose }]}
			/>
		);
	return (
		<ActionModals
			title={t.logistique.supplierDeleteTitle}
			titleIcon={<Delete />}
			titleIconColor="#D32F2F"
			body={`${supplier.nom}. ${t.logistique.supplierDeleteBody}`}
			onClose={() => {
				if (!isLoading) onClose();
			}}
			actions={[
				{ text: t.common.cancel, active: false, icon: <Close />, disabled: isLoading, onClick: onClose },
				{
					text: isLoading ? t.common.loading : t.common.delete,
					active: true,
					icon: <Delete />,
					color: '#D32F2F',
					disabled: isLoading,
					onClick: confirm,
				},
			]}
		>
			{error && <Alert severity="error">{error}</Alert>}
		</ActionModals>
	);
}
