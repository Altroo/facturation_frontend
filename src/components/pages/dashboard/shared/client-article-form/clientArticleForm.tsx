'use client';

import React from 'react';
import { SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Box, Stack, Typography, Paper, Container } from '@mui/material';
import { BusinessOutlined as BusinessOutlinedIcon } from '@mui/icons-material';
import { useAppSelector } from '@/utils/hooks';
import { getUserCompaniesState } from '@/store/selectors';

interface ClientArticleFormWrapperProps extends SessionProps {
	company_id: number;
	id?: number;
	entityName: string; // "article" or "client"
	FormikComponent: React.FC<{ token?: string; id?: number; company_id: number }>;
}

const ClientArticleFormWrapper: React.FC<ClientArticleFormWrapperProps> = ({
	session,
	company_id,
	id,
	entityName,
	FormikComponent,
}) => {
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
					{company?.role === 'Admin' ? (
						<Box sx={{ width: '100%' }}>
							<FormikComponent token={token} id={id} company_id={company_id} />
						</Box>
					) : (
						<Container maxWidth="sm" sx={{ mt: 8 }}>
							<Paper
								elevation={3}
								sx={{
									p: 6,
									textAlign: 'center',
									borderRadius: 3,
									background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)',
								}}
							>
								<Box
									sx={{
										width: 80,
										height: 80,
										borderRadius: '50%',
										backgroundColor: 'rgba(13, 7, 11, 0.08)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										margin: '0 auto 24px',
									}}
								>
									<BusinessOutlinedIcon sx={{ fontSize: 48, color: '#0D070B', opacity: 0.6 }} />
								</Box>
								<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
									{isEditMode
										? `Vous n'avez pas le droit de modifier ce ${entityName}. Veuillez contacter votre administrateur.`
										: `Vous n'avez pas le droit d'ajouter un ${entityName}. Veuillez contacter votre administrateur.`}
								</Typography>
							</Paper>
						</Container>
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default ClientArticleFormWrapper;
