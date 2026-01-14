'use client';

import React from 'react';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';
import CompanyDocumentFormContent from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent';
import { factureClientProformaSchema, factureClientProformaAddSchema } from '@/utils/formValidationSchemas';
import { FACTURE_CLIENT_LIST, FACTURE_CLIENT_EDIT } from '@/utils/routes';
import {
	useGetFactureClientQuery,
	useAddFactureClientMutation,
	useEditFactureClientMutation,
	usePatchStatutMutation,
	useGetNumFactureClientQuery,
} from '@/store/services/factureClient';
import type {
	DocumentFormConfig,
	FactureDocumentData,
	FactureNumResponse,
	DocumentFormSchema,
} from '@/types/companyDocumentsTypes';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import { FactureClass } from '@/models/classes';

// Configuration for facture client form
const factureClientFormConfig: DocumentFormConfig<FactureClass> = {
	documentType: 'facture-client',
	labels: {
		documentTypeName: 'facture client',
		listLabel: 'Liste des factures client',
		dateLabel: 'Date de la facture',
		statusLabel: 'Statut de la facture',
		linesLabel: 'Lignes de la facture',
		deleteLineMessage: 'Êtes-vous sûr de vouloir supprimer cette ligne de la facture ?',
		addSuccessMessage: 'Facture client créée avec succès.',
		updateSuccessMessage: 'Facture client mise à jour avec succès.',
		addErrorMessage: 'Échec de la création de la facture client.',
		updateErrorMessage: 'Échec de la mise à jour de la facture client.',
	},
	fields: {
		numeroField: 'numero_facture',
		dateField: 'date_facture',
		extraField: 'numero_bon_commande_client',
		extraFieldLabel: 'N° bon de commande client',
	},
	routes: {
		listRoute: FACTURE_CLIENT_LIST,
		editRoute: FACTURE_CLIENT_EDIT,
	},
	validation: {
		editSchema: factureClientProformaSchema,
		addSchema: factureClientProformaAddSchema,
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
	} = useGetFactureClientQuery({ id: id! }, { skip: !token || !isEditMode });

	const { data: rawNumData, isLoading: isNumLoading, refetch: refetchNum } = useGetNumFactureClientQuery(undefined, {
		skip: !token || isEditMode,
	});

	// Mutations
	const [addDataMutation, { isLoading: isAddLoading, error: addError }] = useAddFactureClientMutation();
	const [updateDataMutation, { isLoading: isUpdateLoading, error: updateError }] = useEditFactureClientMutation();
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
			config={factureClientFormConfig}
			rawData={rawData as FactureDocumentData | undefined}
			isDataLoading={isDataLoading}
			dataError={dataError}
			rawNumData={rawNumData as FactureNumResponse | undefined}
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

const FactureClientForm: React.FC<Props> = ({ session, company_id, id }) => {
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: 'Ajouter une facture client',
				editTitle: 'Modifier facture client',
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default FactureClientForm;
