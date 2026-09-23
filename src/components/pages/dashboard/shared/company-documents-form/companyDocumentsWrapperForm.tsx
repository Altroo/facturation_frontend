'use client';

import { type FC } from 'react';
import { Box, Stack } from '@mui/material';
import { getUserCompaniesState } from '@/store/selectors';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAppSelector } from '@/utils/hooks';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NoPermission from '@/components/shared/noPermission/noPermission';
import type { CompanyDocumentsWrapperFormProps as Props } from '@/types/companyDocumentsTypes';

const CompanyDocumentsWrapperForm: FC<Props> = (props: Props) => {
	const { session, company_id, id, documentConfig, FormComponent } = props;
	const token = useInitAccessToken(session);
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
							<FormComponent
								company_id={company_id}
								token={token}
								id={id}
								isEditMode={isEditMode}
								role={company?.role}
							/>
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
