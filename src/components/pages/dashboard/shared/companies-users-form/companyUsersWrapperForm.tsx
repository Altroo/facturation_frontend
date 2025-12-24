import React from 'react';
import type { SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Box, Stack } from '@mui/material';
import { Protected } from '@/components/layouts/protected/protected';

interface Props<TFormikProps> extends SessionProps {
	id?: number;
	entityName: 'entreprise' | 'utilisateur';
	FormikComponent: React.FC<TFormikProps>;
	extraFormikProps?: Omit<TFormikProps, 'token' | 'id'>;
}

const CompanyUsersWrapperForm = <TFormikProps extends { id?: number }>(props: Props<TFormikProps>) => {
	const { session, id, entityName, FormikComponent, extraFormikProps } = props;
	const token = getAccessTokenFromSession(session);
	const isEditMode = id !== undefined;

	const titles: Record<'entreprise' | 'utilisateur', { add: string; edit: string }> = {
		entreprise: {
			add: 'Ajouter une entreprise',
			edit: "Modifier l'entreprise",
		},
		utilisateur: {
			add: 'Ajouter un utilisateur',
			edit: "Modifier l'utilisateur",
		},
	};

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? titles[entityName].edit : titles[entityName].add}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Protected>
						<Box sx={{ width: '100%' }}>
							<FormikComponent token={token} id={id} {...(extraFormikProps as TFormikProps)} />
						</Box>
					</Protected>
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default CompanyUsersWrapperForm;
