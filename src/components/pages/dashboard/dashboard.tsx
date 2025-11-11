'use client';

import React from 'react';
import { Stack, ThemeProvider } from '@mui/material';
import { getDefaultTheme } from '@/utils/themes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import type { SessionProps } from '@/types/_initTypes';
// import {getAccessTokenFromSession} from "@/store/session";
import Styles from '@/styles/dashboard/dashboard.module.sass';
// import {useGetProfilQuery} from "@/store/services/account/account";

const DashboardClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
	console.log(session);
	// const token = getAccessTokenFromSession(session);
	// const { data: user, isLoading, error } = useGetProfilQuery(token, { skip: !token });
	return (
		<ThemeProvider theme={getDefaultTheme()}>
			<Stack direction="column" spacing={2} className={`${Styles.flexRootStack}`} mt="32px">
				<NavigationBar title="Tableau de bord">
					<p>Dashboard page</p>
				</NavigationBar>
			</Stack>
		</ThemeProvider>
	);
};

export default DashboardClient;
