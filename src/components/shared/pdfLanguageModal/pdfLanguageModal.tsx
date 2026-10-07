'use client';

import { Box } from '@mui/material';
import styles from './pdfLanguageModal.module.scss';
import { type FC } from 'react';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Close as CloseIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';
import { LanguageFlag } from '@/components/shared/languageSwitcher/languageSwitcher';
import type { PdfLanguageModalProps } from '@/types/uiTypes';

const PdfLanguageModal: FC<PdfLanguageModalProps> = ({ onSelectLanguage, onClose }) => {
	const { t } = useLanguage();

	return (
		<ActionModals
			onClose={onClose}
			title={t.pdf.generatePdf}
			maxWidth="sm"
			fullWidth
			actionsStyle={[styles.actions]}
			body={t.pdf.chooseLanguage}
			actions={[
				{
					active: false,
					text: t.common.cancel,
					onClick: onClose,
					icon: <CloseIcon />,
					color: '#6B6B6B',
				},
				{
					active: false,
					text: t.pdf.french,
					onClick: () => onSelectLanguage('fr'),
					icon: <LanguageFlag language="fr" />,
					color: '#0D070B',
				},
				{
					active: true,
					text: t.pdf.english,
					onClick: () => onSelectLanguage('en'),
					icon: <LanguageFlag language="en" />,
					color: '#0D070B',
				},
				{
					active: false,
					text: t.pdf.dutch,
					onClick: () => onSelectLanguage('nl'),
					icon: (
						<Box
							aria-hidden="true"
							sx={{
								width: 22,
								height: 15,
								borderRadius: '2px',
								background: 'linear-gradient(to bottom, #ae1c28 0 33.33%, #fff 33.33% 66.66%, #21468b 66.66% 100%)',
								border: '1px solid #ddd',
							}}
						/>
					),
					color: '#0D070B',
				},
			]}
		/>
	);
};

export default PdfLanguageModal;
