'use client';

import React from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import type { SessionProps } from '@/types/_initTypes';
import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';
import CompanyDocumentFormContent from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent';
import { bonDeLivraisonSchema, bonDeLivraisonAddSchema } from '@/utils/formValidationSchemas';
import { BON_DE_LIVRAISON_LIST, BON_DE_LIVRAISON_EDIT } from '@/utils/routes';
import {
	useAddBonDeLivraisonMutation,
	useEditBonDeLivraisonMutation,
	useGetBonDeLivraisonQuery,
	usePatchStatutMutation,
	useGetNumBonDeLivraisonQuery,
} from '@/store/services/bonDeLivraison';
import type {
	DocumentFormConfig,
	DocumentFormSchema,
	BonDeLivraisonDocumentData,
	BonDeLivraisonNumResponse,
} from '@/types/companyDocumentsTypes';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import type { BonDeLivraisonClass } from '@/models/classes';
import { useLanguage } from '@/utils/hooks';

// Configuration for bon de livraison form
const createBonDeLivraisonFormConfig = (t: TranslationDictionary): DocumentFormConfig<BonDeLivraisonClass> => ({
	documentType: 'bon-de-livraison',
	labels: {
		documentTypeName: t.bonsLivraison.documentTypeName,
		listLabel: t.bonsLivraison.backToList,
		dateLabel: t.bonsLivraison.fieldDate,
		statusLabel: t.bonsLivraison.fieldStatut,
		linesLabel: t.bonsLivraison.linesTitle,
		deleteLineMessage: t.bonsLivraison.deleteLineBody,
		addSuccessMessage: t.bonsLivraison.addSuccess,
		updateSuccessMessage: t.bonsLivraison.updateSuccess,
		addErrorMessage: t.bonsLivraison.addError,
		updateErrorMessage: t.bonsLivraison.updateError,
	},
	fields: {
		numeroField: 'numero_bon_livraison',
		dateField: 'date_bon_livraison',
		extraField: 'numero_bon_commande_client',
		extraFieldLabel: t.bonsLivraison.fieldNumeroBonCommande,
	},
	routes: {
		listRoute: BON_DE_LIVRAISON_LIST,
		editRoute: BON_DE_LIVRAISON_EDIT,
	},
	validation: {
		editSchema: bonDeLivraisonSchema,
		addSchema: bonDeLivraisonAddSchema,
	},
});
type FormikContentProps = {
	token?: string;
	company_id: number;
	id?: number;
	isEditMode: boolean;
	role?: string;
};

const FormikContent: React.FC<FormikContentProps> = ({ token, company_id, id, isEditMode, role }) => {
	const { t } = useLanguage();
	const bonDeLivraisonFormConfig = React.useMemo(() => createBonDeLivraisonFormConfig(t), [t]);
	// Queries
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetBonDeLivraisonQuery({ id: id! }, { skip: !token || !isEditMode });

	const { data: rawNumData, isLoading: isNumLoading, refetch: refetchNum } = useGetNumBonDeLivraisonQuery({ company_id }, {
		skip: !token || isEditMode,
	});

	// Mutations
	const [addDataMutation, { isLoading: isAddLoading, error: addError }] = useAddBonDeLivraisonMutation();
	const [updateDataMutation, { isLoading: isUpdateLoading, error: updateError }] = useEditBonDeLivraisonMutation();
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
			config={bonDeLivraisonFormConfig}
			rawData={rawData as BonDeLivraisonDocumentData | undefined}
			isDataLoading={isDataLoading}
			dataError={dataError}
			rawNumData={rawNumData as BonDeLivraisonNumResponse | undefined}
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

const BonDeLivraisonForm: React.FC<Props> = ({ session, company_id, id }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: t.bonsLivraison.addTitle,
				editTitle: t.bonsLivraison.editTitle,
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default BonDeLivraisonForm;
