'use client';

import React from 'react';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';
import CompanyDocumentFormContent from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent';
import { factureClientProformaSchema, factureClientProformaAddSchema } from '@/utils/formValidationSchemas';
import { FACTURE_PRO_FORMA_LIST, FACTURE_PRO_FORMA_EDIT } from '@/utils/routes';
import {
	useAddFactureProFormaMutation,
	useEditFactureProFormaMutation,
	useGetFactureProFormaQuery,
	usePatchStatutMutation,
	useGetNumFactureProFormaQuery,
} from '@/store/services/factureProForma';
import type {
	DocumentFormConfig,
	FactureDocumentData,
	FactureNumResponse,
	DocumentFormSchema,
} from '@/types/companyDocumentsTypes';
import type { TypeFactureDevisStatus } from '@/types/devisTypes';

// Configuration for facture pro forma form
const factureProFormaFormConfig: DocumentFormConfig = {
	documentType: 'facture-pro-forma',
	labels: {
		documentTypeName: 'facture pro-forma',
		listLabel: 'Liste des factures pro-forma',
		dateLabel: 'Date de la facture',
		statusLabel: 'Statut de la facture',
		linesLabel: 'Lignes de la facture',
		deleteLineMessage: 'Êtes-vous sûr de vouloir supprimer cette ligne de la facture ?',
		addSuccessMessage: 'Facture pro-forma créée avec succès.',
		updateSuccessMessage: 'Facture pro-forma mise à jour avec succès.',
		addErrorMessage: 'Échec de la création de la facture pro-forma.',
		updateErrorMessage: 'Échec de la mise à jour de la facture pro-forma.',
	},
	fields: {
		numeroField: 'numero_facture',
		dateField: 'date_facture',
		extraField: 'numero_bon_commande_client',
		extraFieldLabel: 'N° bon de commande client',
	},
	routes: {
		listRoute: FACTURE_PRO_FORMA_LIST,
		editRoute: FACTURE_PRO_FORMA_EDIT,
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
};

const FormikContent: React.FC<FormikContentProps> = ({ token, company_id, id, isEditMode }) => {
	// Queries
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetFactureProFormaQuery({ id: id! }, { skip: !token || !isEditMode });

	const { data: rawNumData, isLoading: isNumLoading } = useGetNumFactureProFormaQuery(undefined, {
		skip: !token || isEditMode,
	});

	// Mutations
	const [addDataMutation, { isLoading: isAddLoading, error: addError }] = useAddFactureProFormaMutation();
	const [updateDataMutation, { isLoading: isUpdateLoading, error: updateError }] = useEditFactureProFormaMutation();
	const [patchStatutMutation, { isLoading: isPatchLoading, error: patchError }] = usePatchStatutMutation();

	// Create wrapper functions that match the expected signature
	const addData = (params: { data: DocumentFormSchema }) => ({
		unwrap: () => addDataMutation({ data: params.data }).unwrap() as Promise<{ id?: number }>,
	});

	const updateData = (params: { data: DocumentFormSchema; id: number }) => ({
		unwrap: () => updateDataMutation({ data: params.data, id: params.id }).unwrap(),
	});

	const patchStatut = (params: { id: number; data: { statut: TypeFactureDevisStatus } }) => ({
		unwrap: () => patchStatutMutation({ id: params.id, data: params.data }).unwrap(),
	});

	return (
		<CompanyDocumentFormContent
			token={token}
			company_id={company_id}
			id={id}
			isEditMode={isEditMode}
			config={factureProFormaFormConfig}
			rawData={rawData as FactureDocumentData | undefined}
			isDataLoading={isDataLoading}
			dataError={dataError}
			rawNumData={rawNumData as FactureNumResponse | undefined}
			isNumLoading={isNumLoading}
			addData={addData}
			isAddLoading={isAddLoading}
			addError={addError}
			updateData={updateData}
			isUpdateLoading={isUpdateLoading}
			updateError={updateError}
			patchStatut={patchStatut}
			isPatchLoading={isPatchLoading}
			patchError={patchError}
		/>
	);
};

interface Props extends SessionProps {
	company_id: number;
	id?: number;
}

const FactureProFormaForm: React.FC<Props> = ({ session, company_id, id }) => {
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: 'Ajouter une facture pro-forma',
				editTitle: 'Modifier facture pro-forma',
				addDeniedMessage:
					"Vous n'avez pas le droit d'ajouter une facture pro-forma. Veuillez contacter votre administrateur.",
				editDeniedMessage:
					"Vous n'avez pas le droit de modifier cette facture pro-forma. Veuillez contacter votre administrateur.",
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default FactureProFormaForm;
