import React from 'react';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Close as CloseIcon } from '@mui/icons-material';

interface PdfLanguageModalProps {
	onSelectLanguage: (language: 'fr' | 'en') => void;
	onClose: () => void;
}

const PdfLanguageModal: React.FC<PdfLanguageModalProps> = ({ onSelectLanguage, onClose }) => {
	return (
		<ActionModals
			title="Génération du PDF"
			body="Choisissez la langue dans laquelle vous souhaitez générer le document PDF."
			actions={[
				{
					active: false,
					text: 'Annuler',
					onClick: onClose,
					icon: <CloseIcon />,
					color: '#6B6B6B',
				},
				{
					active: false,
					text: 'Français',
					onClick: () => onSelectLanguage('fr'),
					icon: <>🇫🇷</>,
					color: '#0D070B',
				},
				{
					active: true,
					text: 'English',
					onClick: () => onSelectLanguage('en'),
					icon: <>🇬🇧</>,
					color: '#0D070B',
				},
			]}
		/>
	);
};

export default PdfLanguageModal;