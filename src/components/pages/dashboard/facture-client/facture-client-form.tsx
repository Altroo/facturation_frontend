'use client';

import { type FC } from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';
import CompanyDocumentFormContent from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent';
import { factureClientProformaAddSchema, factureClientProformaSchema } from '@/utils/formValidationSchemas';
import { FACTURE_CLIENT_EDIT, FACTURE_CLIENT_LIST } from '@/utils/routes';
import {
	useAddFactureClientMutation,
	useEditFactureClientMutation,
	useGetFactureClientQuery,
	useGetNumFactureClientQuery,
	usePatchStatutMutation,
} from '@/store/services/factureClient';
import type {
	DocumentFormConfig,
	DocumentFormSchema,
	FactureClientFormFormikContentProps as FormikContentProps,
	FactureClientFormProps as Props,
	FactureDocumentData,
	FactureNumResponse,
} from '@/types/companyDocumentsTypes'; // Configuration for facture client form
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import type { FactureClass } from '@/models/classes';
import { useLanguage } from '@/utils/hooks';
import InvoicePaymentsSection from './invoice-payments-section';

// Configuration for facture client form
const createFactureClientFormConfig = (t: TranslationDictionary): DocumentFormConfig<FactureClass> => ({
	documentType: 'facture-client',
	labels: {
		documentTypeName: 'facture client',
		listLabel: t.facturesClient.backToList,
		dateLabel: t.facturesClient.fieldDate,
		statusLabel: t.facturesClient.fieldStatut,
		linesLabel: t.facturesClient.linesTitle,
		deleteLineMessage: t.facturesClient.deleteLineBody,
		addSuccessMessage: t.facturesClient.addSuccess,
		updateSuccessMessage: t.facturesClient.updateSuccess,
		addErrorMessage: t.facturesClient.addError,
		updateErrorMessage: t.facturesClient.updateError,
	},
	fields: {
		numeroField: 'numero_facture',
		dateField: 'date_facture',
		extraField: 'numero_bon_commande_client',
		extraFieldLabel: t.facturesClient.fieldNumeroBonCommande,
	},
	routes: {
		listRoute: FACTURE_CLIENT_LIST,
		editRoute: FACTURE_CLIENT_EDIT,
	},
	validation: {
		editSchema: factureClientProformaSchema,
		addSchema: factureClientProformaAddSchema,
	},
});

const FormikContent: FC<FormikContentProps> = ({ token, company_id, id, isEditMode, role }) => {
	const { t } = useLanguage();
	const factureClientFormConfig = createFactureClientFormConfig(t);
	// Queries
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetFactureClientQuery({ id: id! }, { skip: !token || !isEditMode });

	const {
		data: rawNumData,
		isLoading: isNumLoading,
		refetch: refetchNum,
	} = useGetNumFactureClientQuery(
		{ company_id },
		{
			skip: !token || isEditMode,
		},
	);

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
			extraSections={
				isEditMode && id ? (
					<InvoicePaymentsSection
						companyId={company_id}
						factureClientId={id}
						token={token}
						canManagePayments={Boolean((role === 'Caissier' || role === 'Commercial') && rawData?.statut === 'Accepté')}
					/>
				) : undefined
			}
		/>
	);
};

const FactureClientForm: FC<Props> = ({ session, company_id, id }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: t.facturesClient.addTitle,
				editTitle: t.facturesClient.editTitle,
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default FactureClientForm;
