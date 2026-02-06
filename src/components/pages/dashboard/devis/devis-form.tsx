'use client';

import React from 'react';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';
import CompanyDocumentFormContent from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent';
import { deviAddSchema, deviSchema } from '@/utils/formValidationSchemas';
import { DEVIS_LIST, DEVIS_EDIT } from '@/utils/routes';
import {
	useAddDeviMutation,
	useEditDeviMutation,
	useGetDeviQuery,
	usePatchStatutMutation,
	useGetNumDevisQuery,
} from '@/store/services/devi';
import type {
	DocumentFormConfig,
	DevisDocumentData,
	DevisNumResponse,
	DocumentFormSchema,
} from '@/types/companyDocumentsTypes';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import { DeviClass } from '@/models/classes';

// Configuration for devis form
const devisFormConfig: DocumentFormConfig<DeviClass> = {
	documentType: 'devis',
	labels: {
		documentTypeName: 'devis',
		listLabel: 'Liste des devis',
		dateLabel: 'Date du devis',
		statusLabel: 'Statut du devis',
		linesLabel: 'Lignes du devis',
		deleteLineMessage: 'Êtes-vous sûr de vouloir supprimer cette ligne du devis ?',
		addSuccessMessage: 'Devis créé avec succès.',
		updateSuccessMessage: 'Devis mis à jour avec succès.',
		addErrorMessage: 'Échec de la création du devis.',
		updateErrorMessage: 'Échec de la mise à jour du devis.',
	},
	fields: {
		numeroField: 'numero_devis',
		dateField: 'date_devis',
		extraField: 'numero_demande_prix_client',
		extraFieldLabel: 'N° demande de prix client',
	},
	routes: {
		listRoute: DEVIS_LIST,
		editRoute: DEVIS_EDIT,
	},
	validation: {
		editSchema: deviSchema,
		addSchema: deviAddSchema,
	},
};

type FormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

const FormikContent: React.FC<FormikContentProps> = ({ token, company_id, id, isEditMode, role }) => {
	// Queries
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetDeviQuery({ id: id! }, { skip: !token || !isEditMode });

	const { data: rawNumData, isLoading: isNumLoading, refetch: refetchNum } = useGetNumDevisQuery({ company_id }, {
		skip: !token || isEditMode,
	});

	// Mutations
	const [addDataMutation, { isLoading: isAddLoading, error: addError }] = useAddDeviMutation();
	const [updateDataMutation, { isLoading: isUpdateLoading, error: updateError }] = useEditDeviMutation();
	const [patchStatutMutation, { isLoading: isPatchLoading, error: patchError }] = usePatchStatutMutation();

	// Create wrapper functions that match the expected signature
	const addData = (params: { data: DocumentFormSchema }) => ({
		unwrap: () => addDataMutation({ data: params.data }).unwrap() as Promise<{ id?: number }>,
	});

	const updateData = (params: { data: DocumentFormSchema; id: number }) => ({
		unwrap: () => updateDataMutation({ data: params.data, id: params.id }).unwrap(),
	});

	const patchStatut = (params: { id: number; data: { statut: TypeFactureLivraisonDevisStatus } }) => ({
		unwrap: () => patchStatutMutation({ id: params.id, data: params.data }).unwrap(),
	});

	return (
		<CompanyDocumentFormContent
			token={token}
			company_id={company_id}
			id={id}
			isEditMode={isEditMode}
			config={devisFormConfig}
			rawData={rawData as DevisDocumentData | undefined}
			isDataLoading={isDataLoading}
			dataError={dataError}
			rawNumData={rawNumData as DevisNumResponse | undefined}
			isNumLoading={isNumLoading}
			refetchNum={refetchNum}
			addData={addData}
			isAddLoading={isAddLoading}
			addError={addError}
			updateData={updateData}
			isUpdateLoading={isUpdateLoading}
			updateError={updateError}
			patchStatut={patchStatut}
			isPatchLoading={isPatchLoading}
			patchError={patchError}
			role={role}
		/>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const DevisForm: React.FC<Props> = ({ session, company_id, id }) => {
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: 'Ajouter un devis',
				editTitle: 'Modifier devis',
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default DevisForm;
