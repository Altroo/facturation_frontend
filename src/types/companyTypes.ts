import type { SagaPayloadType, SessionProps } from '@/types/_initTypes';
import type { FC, ReactNode, SyntheticEvent } from 'react';
import type { SxProps, Theme } from '@mui/system';
import type { DropDownType } from '@/types/accountTypes';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { UserCompaniesType } from '@/types/usersTypes';

export type NbrEmployeType = '' | '1 à 5' | '5 à 10' | '10 à 50' | '50 à 100' | 'plus que 100';
export type CiviliteType = '' | 'Mme' | 'Mlle' | 'M.';

//!- Companies State
export interface CompaniesStateInterface {
	user_companies: Array<CompaniesUserCompaniesType>;
}

export type ManagedByType = {
	id: number;
	first_name: string | null;
	last_name: string | null;
	role: string | null;
	can_validate_factures?: boolean;
	can_change_document_status?: boolean;
};

export type ManagedByWriteOnlyType = {
	pk: number;
	role: string | null;
	can_validate_factures?: boolean;
	can_change_document_status?: boolean;
};

type ManagedByEntry = {
	pk: number;
	first_name: string | null;
	last_name: string | null;
	role: string | null;
	can_validate_factures?: boolean;
	can_change_document_status?: boolean;
};

export type CompanyFormValuesType = {
	raison_sociale: string;
	email: string;
	nbr_employe: string;
	civilite_responsable: string;
	nom_responsable: string;
	gsm_responsable: string;
	adresse: string;
	telephone: string;
	fax: string;
	site_web: string;
	numero_du_compte: string;
	ICE: string;
	registre_de_commerce: string;
	identifiant_fiscal: string;
	tax_professionnelle: string;
	CNSS: string;
	logo: string | ArrayBuffer;
	logo_cropped: string | ArrayBuffer;
	cachet: string | ArrayBuffer;
	cachet_cropped: string | ArrayBuffer;
	managed_by: ManagedByEntry[];
	uses_foreign_currency: boolean;
	stock_management_enabled: boolean;
	globalError?: string;
};

export type CompaniesUserCompaniesType = {
	id: number;
	raison_sociale: string;
	role: string;
	uses_foreign_currency: boolean;
	stock_management_enabled?: boolean;
	can_validate_factures?: boolean;
	can_change_document_status?: boolean;
};

export type setCompaniesUserSagatype = SagaPayloadType<Array<CompaniesUserCompaniesType>>;

export type CompaniesFormFormikContentProps = {
	token: string | undefined;
	first_name: string | null;
	last_name: string | null;
	id?: number;
};

export interface CompaniesFormProps extends SessionProps {
	id?: number;
}

export interface CompaniesViewInfoRowProps {
	icon: ReactNode;
	label: string;
	value: string | number | null | undefined | ReactNode;
}

export interface CompaniesViewProps extends SessionProps {
	id: number;
}

export interface CompanyUsersWrapperFormProps<TFormikProps> extends SessionProps {
	id?: number;
	entityName: 'entreprise' | 'utilisateur';
	FormikComponent: FC<TFormikProps>;
	extraFormikProps?: Omit<TFormikProps, 'token' | 'id'>;
}

export interface AddManagedBySectionProps {
	title: string;
	isMobile: boolean;
	selectId: string;
	selectLabel: string;
	selectItems: DropDownType[];
	selectValue: DropDownType | null;
	onSelectChange: (event: SyntheticEvent, value: DropDownType | null) => void;
	selectIcon: ReactNode;

	roleId: string;
	roleLabel: string;
	roleOptions: { value: string; code: string }[];
	roleValue: string;
	onRoleChange: (event: SelectChangeEvent) => void;
	roleIcon: ReactNode;

	onAdd: () => void;
	isAddDisabled: boolean;
	sx?: SxProps<Theme>;
}

export type ManagedByTableSectionProps = {
	title: string;
	icon: ReactNode;
	emptyIcon: ReactNode;
	emptyMessage: string;
	headers: string[];
	data: (ManagedByType | UserCompaniesType)[];
	isUserTable: boolean;
	currentUserId?: number;
	roleOptions: { value: string; code: string }[];
	onRoleChange: (index: number, newRole: string) => void;
	onInvoiceValidationChange?: (index: number, checked: boolean) => void;
	onDocumentStatusChangePermissionChange?: (index: number, checked: boolean) => void;
	onDelete: (index: number) => void;
	addSectionProps: AddManagedBySectionProps;
	showInvoiceValidationPermission?: boolean;
	showDocumentStatusChangePermission?: boolean;
};
