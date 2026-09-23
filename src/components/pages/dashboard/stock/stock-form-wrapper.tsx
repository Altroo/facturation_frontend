'use client';

import { type FC } from 'react';
import { Box, Stack } from '@mui/material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import NoPermission from '@/components/shared/noPermission/noPermission';
import { useInitAccessToken } from '@/contexts/InitContext';
import { getUserCompaniesState } from '@/store/selectors';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import { useAppSelector } from '@/utils/hooks';
import type { StockFormWrapperProps } from '@/types/stockTypes';

const StockFormWrapper: FC<StockFormWrapperProps> = ({ session, company_id, title, allowedRoles, children }) => {
	const token = useInitAccessToken(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((item) => item.id === company_id);
	const hasPermission = company?.role ? allowedRoles.includes(company.role) : false;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={title}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{hasPermission ? <Box sx={{ width: '100%' }}>{children(token)}</Box> : <NoPermission />}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default StockFormWrapper;
