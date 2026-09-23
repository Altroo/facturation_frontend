'use client';

import { type FC } from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';
import CompanyDocumentFormContent from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent';
import { deviAddSchema, deviSchema } from '@/utils/formValidationSchemas';
import { DEVIS_EDIT, DEVIS_LIST } from '@/utils/routes';
import {
	useAddDeviMutation,
	useEditDeviMutation,
	useGetDeviQuery,
	useGetNumDevisQuery,
	usePatchStatutMutation,
} from '@/store/services/devi';
import type {
	DevisDocumentData,
	DevisFormFormikContentProps as FormikContentProps,
	DevisFormProps as Props,
	DevisNumResponse,
	DocumentFormConfig,
	DocumentFormSchema,
} from '@/types/companyDocumentsTypes'; // Configuration for devis form
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import type { DeviClass } from '@/models/classes';
import { useLanguage } from '@/utils/hooks';

// Configuration for devis form
const createDevisFormConfig = (t: TranslationDictionary): DocumentFormConfig<DeviClass> => ({
	documentType: 'devis',
	labels: {
		documentTypeName: 'devis',
		listLabel: t.devis.backToList,
		dateLabel: t.devis.fieldDate,
		statusLabel: t.devis.fieldStatut,
		linesLabel: t.devis.linesTitle,
		deleteLineMessage: t.devis.deleteLineBody,
		addSuccessMessage: t.devis.addSuccess,
		updateSuccessMessage: t.devis.updateSuccess,
		addErrorMessage: t.devis.addError,
		updateErrorMessage: t.devis.updateError,
	},
	fields: {
		numeroField: 'numero_devis',
		dateField: 'date_devis',
		extraField: 'numero_demande_prix_client',
		extraFieldLabel: t.devis.fieldNumeroDemandePrix,
	},
	routes: {
		listRoute: DEVIS_LIST,
		editRoute: DEVIS_EDIT,
	},
	validation: {
		editSchema: deviSchema,
		addSchema: deviAddSchema,
	},
});

const FormikContent: FC<FormikContentProps> = ({ token, company_id, id, isEditMode, role }) => {
	const { t } = useLanguage();
	const devisFormConfig = createDevisFormConfig(t);
	// Queries
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetDeviQuery({ id: id! }, { skip: !token || !isEditMode });

	const {
		data: rawNumData,
		isLoading: isNumLoading,
		refetch: refetchNum,
	} = useGetNumDevisQuery(
		{ company_id },
		{
			skip: !token || isEditMode,
		},
	);

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

const DevisForm: FC<Props> = ({ session, company_id, id }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: t.devis.addTitle,
				editTitle: t.devis.editTitle,
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default DevisForm;
