'use client';

import React from 'react';
import { Stack, Box } from '@mui/material';
import { getUserCompaniesState } from '@/store/selectors';
import { getAccessTokenFromSession } from '@/store/session';
import { useAppSelector } from '@/utils/hooks';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import type { SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NoPermission from '@/components/shared/noPermission/noPermission';

interface DocumentConfig {
	addTitle: string;
	editTitle: string;
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
		role?: string;
	}>;
}

const CompanyDocumentsWrapperForm: React.FC<Props> = (props: Props) => {
	const { session, company_id, id, documentConfig, FormComponent } = props;
	const token = getAccessTokenFromSession(session);
	const companies = useAppSelector(getUserCompaniesState);
	const company = companies?.find((comp) => comp.id === company_id);
	const isEditMode = !!id;

	const title = isEditMode ? documentConfig.editTitle : documentConfig.addTitle;
	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={title}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{company?.role === 'Caissier' || company?.role === 'Commercial' ? (
						<Box sx={{ width: '100%' }}>
							<FormComponent company_id={company_id} token={token} id={id} isEditMode={isEditMode} role={company?.role} />
						</Box>
					) : (
						<NoPermission />
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default CompanyDocumentsWrapperForm;
