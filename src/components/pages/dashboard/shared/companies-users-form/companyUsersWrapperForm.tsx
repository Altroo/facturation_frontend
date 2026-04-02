import React from 'react';
import type { SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Box, Stack } from '@mui/material';
import { Protected } from '@/components/layouts/protected/protected';
import { useLanguage } from '@/utils/hooks';

interface Props<TFormikProps> extends SessionProps {
	id?: number;
	entityName: 'entreprise' | 'utilisateur';
	FormikComponent: React.FC<TFormikProps>;
	extraFormikProps?: Omit<TFormikProps, 'token' | 'id'>;
}

const CompanyUsersWrapperForm = <TFormikProps extends { id?: number }>(props: Props<TFormikProps>) => {
	const { t } = useLanguage();
	const { session, id, entityName, FormikComponent, extraFormikProps } = props;
	const token = useInitAccessToken(session);
	const isEditMode = id !== undefined;

	const titles: Record<'entreprise' | 'utilisateur', { add: string; edit: string }> = {
		entreprise: {
			add: t.companies.addTitle,
			edit: t.companies.editTitle,
		},
		utilisateur: {
			add: t.users.addTitle,
			edit: t.users.editTitle,
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
