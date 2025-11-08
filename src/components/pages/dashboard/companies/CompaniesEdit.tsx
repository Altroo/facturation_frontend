'use client';

import React, { useState, useTransition } from 'react';
import type { AppSession } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useEditCompanyMutation, useGetCompanyQuery } from '@/store/services/company';
import Styles from '@/styles/dashboard/companies/companies.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Stack } from '@mui/material';
import CustomToast from '@/components/portals/customToast/customToast';
import Portal from '@/contexts/Portal';

type formikContentType = {
	token: string | undefined;
	id: number;
	onSuccess: () => void;
};

const FormikContent: React.FC<formikContentType> = (props: formikContentType) => {
	const { token, onSuccess, id } = props;
	const { data: companyData, isLoading: isCompanyLoading } = useGetCompanyQuery({ token, id }, { skip: !token });
	const [updateCompany, { isLoading: isUpdateLoading }] = useEditCompanyMutation();

	console.log(companyData);

	return <div>COMPANY EDIT DATA GOES HERE</div>;
};

type Props = {
	session?: AppSession;
	id: number;
};

const CompaniesEditClient: React.FC<Props> = ({ session, id }: Props) => {
	const token = getAccessTokenFromSession(session);
	const [showDataUpdated, setShowDataUpdated] = useState<boolean>(false);

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			mt="32px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title="Modifier l'entreprise">
				<FormikContent token={token} id={id} onSuccess={() => setShowDataUpdated(true)} />
			</NavigationBar>
			<Portal id="snackbar_portal">
				<CustomToast
					type="success"
					message="Entreprise mis à jour"
					setShow={setShowDataUpdated}
					show={showDataUpdated}
				/>
			</Portal>
		</Stack>
	);
};

export default CompaniesEditClient;
