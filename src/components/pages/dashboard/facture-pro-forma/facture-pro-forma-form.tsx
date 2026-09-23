'use client';

import { type FC } from 'react';
import type { TranslationDictionary } from '@/types/languageTypes';
import CompanyDocumentsWrapperForm from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentsWrapperForm';
import CompanyDocumentFormContent from '@/components/pages/dashboard/shared/company-documents-form/companyDocumentFormContent';
import { factureProformaAddSchema, factureProformaSchema } from '@/utils/formValidationSchemas';
import { FACTURE_PRO_FORMA_EDIT, FACTURE_PRO_FORMA_LIST } from '@/utils/routes';
import {
	useAddFactureProFormaMutation,
	useEditFactureProFormaMutation,
	useGetFactureProFormaQuery,
	useGetNumFactureProFormaQuery,
	usePatchStatutMutation,
} from '@/store/services/factureProForma';
import type {
	DocumentFormConfig,
	DocumentFormSchema,
	FactureDocumentData,
	FactureNumResponse,
	FactureProFormaFormFormikContentProps as FormikContentProps,
	FactureProFormaFormProps as Props,
} from '@/types/companyDocumentsTypes'; // Configuration for facture pro forma form
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import type { FactureClass } from '@/models/classes';
import { useAppDispatch, useLanguage } from '@/utils/hooks';
import { logistiqueApi } from '@/store/services/logistique';

// Configuration for facture pro forma form
const createFactureProFormaFormConfig = (t: TranslationDictionary): DocumentFormConfig<FactureClass> => ({
	documentType: 'facture-pro-forma',
	labels: {
		documentTypeName: 'facture pro-forma',
		listLabel: t.facturesProforma.backToList,
		dateLabel: t.facturesProforma.fieldDate,
		statusLabel: t.facturesProforma.fieldStatut,
		linesLabel: t.facturesProforma.linesTitle,
		deleteLineMessage: t.facturesProforma.deleteLineBody,
		addSuccessMessage: t.facturesProforma.addSuccess,
		updateSuccessMessage: t.facturesProforma.updateSuccess,
		addErrorMessage: t.facturesProforma.addError,
		updateErrorMessage: t.facturesProforma.updateError,
	},
	fields: {
		numeroField: 'numero_facture',
		dateField: 'date_facture',
		extraField: 'numero_bon_commande_client',
		extraFieldLabel: t.facturesProforma.fieldNumeroBonCommande,
	},
	routes: {
		listRoute: FACTURE_PRO_FORMA_LIST,
		editRoute: FACTURE_PRO_FORMA_EDIT,
	},
	validation: {
		editSchema: factureProformaSchema,
		addSchema: factureProformaAddSchema,
	},
});

const FormikContent: FC<FormikContentProps> = ({ token, company_id, id, isEditMode, role }) => {
	const { t } = useLanguage();
	const dispatch = useAppDispatch();
	const factureProFormaFormConfig = createFactureProFormaFormConfig(t);
	// Queries
	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetFactureProFormaQuery({ id: id! }, { skip: !token || !isEditMode });

	const {
		data: rawNumData,
		isLoading: isNumLoading,
		refetch: refetchNum,
	} = useGetNumFactureProFormaQuery(
		{ company_id },
		{
			skip: !token || isEditMode,
		},
	);

	// Mutations
	const [addDataMutation, { isLoading: isAddLoading, error: addError }] = useAddFactureProFormaMutation();
	const [updateDataMutation, { isLoading: isUpdateLoading, error: updateError }] = useEditFactureProFormaMutation();
	const [patchStatutMutation, { isLoading: isPatchLoading, error: patchError }] = usePatchStatutMutation();

	// Create wrapper functions that match the expected signature
	const addData = (params: { data: DocumentFormSchema }) => ({
		unwrap: () => addDataMutation({ data: params.data }).unwrap() as Promise<{ id?: number }>,
	});

	const updateData = (params: { data: DocumentFormSchema; id: number }) => ({
		unwrap: async () => {
			const response = await updateDataMutation({ data: params.data, id: params.id }).unwrap();
			dispatch(logistiqueApi.util.invalidateTags(['Logistique', 'Dashboard']));
			return response;
		},
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
			config={factureProFormaFormConfig}
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

const FactureProFormaForm: FC<Props> = ({ session, company_id, id }) => {
	const { t } = useLanguage();
	return (
		<CompanyDocumentsWrapperForm
			session={session}
			company_id={company_id}
			id={id}
			documentConfig={{
				addTitle: t.facturesProforma.addTitle,
				editTitle: t.facturesProforma.editTitle,
			}}
			FormComponent={FormikContent}
		/>
	);
};

export default FactureProFormaForm;
