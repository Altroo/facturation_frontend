'use client';

import React from 'react';
import { Box } from '@mui/material';
import {
	AccountBalanceWallet as AccountBalanceWalletIcon,
	LocalOffer as LocalOfferIcon,
	Percent as PercentIcon,
	ReceiptLong as ReceiptLongIcon,
	ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import DashboardStatCard from '@/components/shared/dashboardStatCard/dashboardStatCard';
import { formatNumberWithSpaces } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';

interface TotalsCardProps {
	totals: {
		totalHT: number;
		totalPrixAchat: number;
		totalPrixAchatDevise?: string | null;
		totalTVA: number;
		totalTTC: number;
		totalTTCApresRemise: number;
	};
	devise?: string;
	isMobile?: boolean;
	isLoading?: boolean;
	showDiscountTotal?: boolean;
}

const FactureDevisTotalsCard: React.FC<TotalsCardProps> = ({
	totals,
	devise = 'MAD',
	isMobile = false,
	isLoading = false,
	showDiscountTotal = true,
}) => {
	const { t } = useLanguage();
	const totalPrixAchatDevise = totals.totalPrixAchatDevise?.trim() || null;
	const items = [
		{
			label: t.totalsCard.totalHT,
			value: `${formatNumberWithSpaces(totals.totalHT, 2)} ${devise}`,
			icon: <ReceiptLongIcon />,
			color: '#1565C0',
		},
		{
			label: t.totalsCard.totalPrixAchat,
			value: totalPrixAchatDevise ? `${formatNumberWithSpaces(totals.totalPrixAchat, 2)} ${totalPrixAchatDevise}` : '',
			icon: <ShoppingCartIcon />,
			color: '#6A1B9A',
		},
		{
			label: t.totalsCard.totalTVA,
			value: `${formatNumberWithSpaces(totals.totalTVA, 2)} ${devise}`,
			icon: <PercentIcon />,
			color: '#EF6C00',
		},
		{
			label: t.totalsCard.totalTTC,
			value: `${formatNumberWithSpaces(totals.totalTTC, 2)} ${devise}`,
			icon: <AccountBalanceWalletIcon />,
			color: '#00897B',
			valueColor: 'primary.main',
		},
		{
			label: t.totalsCard.totalTTCApresRemise,
			value: `${formatNumberWithSpaces(totals.totalTTCApresRemise, 2)} ${devise}`,
			icon: <LocalOfferIcon />,
			color: '#5D4037',
			valueColor: 'primary.main',
		},
	].filter((item) => showDiscountTotal || item.label !== t.totalsCard.totalTTCApresRemise);

	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: isMobile
					? '1fr'
					: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr', xl: '1fr 1fr 1fr 1fr 1fr' },
				gap: 2,
			}}
		>
			{items.map((item) => (
				<DashboardStatCard
					key={item.label}
					icon={item.icon}
					label={item.label}
					value={item.value}
					color={item.color}
					valueColor={item.valueColor}
					isLoading={isLoading}
				/>
			))}
		</Box>
	);
};

export default FactureDevisTotalsCard;
