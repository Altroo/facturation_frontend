'use client';

import React from 'react';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Close as CloseIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';

interface PdfLanguageModalProps {
	onSelectLanguage: (language: 'fr' | 'en') => void;
	onClose: () => void;
}

const PdfLanguageModal: React.FC<PdfLanguageModalProps> = ({ onSelectLanguage, onClose }) => {
	const { t } = useLanguage();

	return (
		<ActionModals
			onClose={onClose}
			title={t.pdf.generatePdf}
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
					icon: <>🇫🇷</>,
					color: '#0D070B',
				},
				{
					active: true,
					text: t.pdf.english,
					onClick: () => onSelectLanguage('en'),
					icon: <>🇬🇧</>,
					color: '#0D070B',
				},
			]}
		/>
	);
};

export default PdfLanguageModal;