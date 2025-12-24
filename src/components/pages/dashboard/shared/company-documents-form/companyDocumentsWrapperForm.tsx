'use client';

import React from 'react';
import { Stack, Box, Container, Paper, Typography } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { getUserCompaniesState } from '@/store/selectors';
import { getAccessTokenFromSession } from '@/store/session';
import { useAppSelector } from '@/utils/hooks';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

interface DocumentConfig {
	singular: string;
	addTitle: string;
	editTitle: string;
	addDeniedMessage: string;
	editDeniedMessage: string;
}

interface Props extends SessionProps {
	company_id: number;
	id?: number;
	documentConfig: DocumentConfig;
	FormComponent: React.ComponentType<{
		company_id: number;
		token?: string;
		id?: number;
		isEditMode: boolean;
	}>;
}

const CompanyDocumentsWrapperForm: React.FC<Props> = (props: Props) => {
	const { session, company_id, id, documentConfig, FormComponent } = props;
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);
	const isEditMode = !!id;

	const title = isEditMode ? documentConfig.editTitle : documentConfig.addTitle;
	const deniedMessage = isEditMode ? documentConfig.editDeniedMessage : documentConfig.addDeniedMessage;

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={title}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Admin' ? (
						<Box sx={{ width: '100%' }}>
							<FormComponent company_id={company_id} token={token} id={id} isEditMode={isEditMode} />
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
									<BusinessIcon sx={{ fontSize: 48, color: '#0D070B', opacity: 0.6 }} />
								</Box>
								<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
									{deniedMessage}
								</Typography>
							</Paper>
						</Container>
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default CompanyDocumentsWrapperForm;
