'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';

import { getAccessTokenFromSession } from '@/store/session';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { COMPANIES_ADD } from '@/utils/routes';

import type { SessionProps } from '@/types/_initTypes';

type CompanyLike = {
	id: number;
	raison_sociale: string;
	role: string;
};

export type CompanyDocumentsListProps = SessionProps & {
	title: string;
	children: (args: { company_id: number; role: string }) => React.ReactNode;
};

const CompanyDocumentsWrapperList: React.FC<CompanyDocumentsListProps> = ({ session, title, children }) => {
	const token = getAccessTokenFromSession(session);
	const router = useRouter();
	const { data: companiesData, isLoading } = useGetUserCompaniesQuery(undefined, { skip: !token });
	
	// Load saved company index from localStorage
	const [selectedIndex, setSelectedIndex] = useState(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('selectedCompanyIndex');
			return saved !== null ? parseInt(saved, 10) : 0;
		}
		return 0;
	});
	
	const companies = useMemo(() => (companiesData ?? []) as CompanyLike[], [companiesData]);
	const selectedCompany = useMemo(() => companies?.[selectedIndex] ?? null, [companies, selectedIndex]);

	// Validate and adjust selectedIndex if it's out of bounds
	useEffect(() => {
		if (companies.length > 0 && selectedIndex >= companies.length) {
			setSelectedIndex(0);
			localStorage.setItem('selectedCompanyIndex', '0');
		}
	}, [companies, selectedIndex]);

	const handleChange = (_: React.SyntheticEvent, newValue: number) => {
		setSelectedIndex(newValue);
		// Save to localStorage
		localStorage.setItem('selectedCompanyIndex', String(newValue));
	};

	if (isLoading) {
		return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
	}

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			mt="40px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title={title}>
				{!companies || companies.length === 0 ? (
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
							<Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
								Aucune entreprise trouvée
							</Typography>
						{selectedCompany?.role === 'Caissier' ? (
								<>
									<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
										Vous n&#39;avez pas encore d&#39;entreprises associées à votre compte. Veuillez créer une nouvelle
										entreprise.
									</Typography>
									<Button
										variant="contained"
										size="large"
										sx={{ mt: 2, borderRadius: 2, px: 4 }}
										onClick={() => router.push(COMPANIES_ADD)}
									>
										Créer une entreprise
									</Button>
								</>
							) : (
								<Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
									Vous n&#39;avez pas encore d&#39;entreprises associées à votre compte. Veuillez contacter votre
									administrateur.
								</Typography>
							)}
						</Paper>
					</Container>
				) : (
					<>
						<Paper
							elevation={0}
							sx={{
								width: '100%',
								borderBottom: 1,
								borderColor: 'divider',
								mb: 2,
								bgcolor: 'background.paper',
								borderRadius: '8px 8px 0 0',
							}}
						>
							<Tabs
								value={selectedIndex}
								onChange={handleChange}
								variant="scrollable"
								allowScrollButtonsMobile
								scrollButtons="auto"
								aria-label="companies tabs"
								sx={{
									'& .MuiTabs-indicator': {
										height: 3,
										borderRadius: '3px 3px 0 0',
									},
									'& .MuiTab-root': {
										textTransform: 'none',
										fontSize: '0.95rem',
										fontWeight: 500,
										minHeight: 56,
										px: 3,
										transition: 'all 0.2s ease',
										'&:hover': {
											backgroundColor: 'action.hover',
										},
										'&.Mui-selected': {
											fontWeight: 600,
										},
									},
									'& .MuiTabs-scrollButtons': {
										'&.Mui-disabled': {
											opacity: 0.3,
										},
									},
								}}
							>
								{companies.map((company) => (
									<Tab key={company.id} label={company.raison_sociale} />
								))}
							</Tabs>
						</Paper>
						{selectedCompany ? children({ company_id: selectedCompany.id, role: selectedCompany.role }) : null}
					</>
				)}
			</NavigationBar>
		</Stack>
	);
};

export default CompanyDocumentsWrapperList;
