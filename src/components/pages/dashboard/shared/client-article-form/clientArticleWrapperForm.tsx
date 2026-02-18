'use client';

import React from 'react';
import type { SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Box, Stack } from '@mui/material';
import { useAppSelector } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';
import NoPermission from '@/components/shared/noPermission/noPermission';

interface Props extends SessionProps {
	company_id: number;
	id?: number;
	entityName: 'article' | 'client';
	FormikComponent: React.FC<{ token?: string; id?: number; company_id: number }>;
}

const ClientArticleWrapperForm: React.FC<Props> = ({ session, company_id, id, entityName, FormikComponent }) => {
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);

	const isEditMode = id !== undefined;

	const titles: Record<string, { add: string; edit: string }> = {
		article: {
			add: 'Ajouter un article',
			edit: "Modifier l'article",
		},
		client: {
			add: 'Ajouter un client',
			edit: 'Modifier le client',
		},
	};

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? titles[entityName].edit : titles[entityName].add}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Caissier' || company?.role === 'Commercial' ? (
						<Box sx={{ width: '100%' }}>
							<FormikComponent token={token} id={id} company_id={company_id} />
						</Box>
					) : (
						<NoPermission />
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default ClientArticleWrapperForm;
