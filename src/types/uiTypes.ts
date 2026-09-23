import type {
	CSSProperties,
	ChangeEvent,
	ClipboardEvent,
	ComponentType,
	Dispatch,
	FocusEvent,
	HTMLAttributes,
	HTMLInputTypeAttribute,
	InputEvent,
	InputHTMLAttributes,
	Key,
	KeyboardEvent,
	MouseEvent,
	MouseEventHandler,
	ReactNode,
	Ref,
	SetStateAction,
	SyntheticEvent,
} from 'react';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField';
import type { DropDownType } from '@/types/accountTypes';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { UrlObject } from 'url';
import type { DialogProps } from '@mui/material/Dialog';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import type { AlertColor } from '@mui/material/Alert';
import type { GridColDef, GridFilterInputValueProps, GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import type { Language } from '@/types/languageTypes';

export type ToastContextType = {
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
};

export interface PortalProps {
	id: string;
	children: ReactNode;
}

export type ApiAlertProps = {
	errorDetails?: Record<string, string[] | string> | string | null;
	cssStyle?: SxProps<Theme>;
	children?: ReactNode;
};

export type ApiProgressProps = {
	cssStyle?: CSSProperties;
	children?: ReactNode;
	backdropColor: string;
	circularColor: string;
};

export type CustomAutoCompleteSelectProps = {
	id: string;
	label: string;
	items: Array<DropDownType>;
	theme: Theme;
	value: DropDownType | null;
	noOptionsText: string;
	size?: 'small' | 'medium';
	fullWidth?: boolean;
	onChange?: (event: SyntheticEvent, newValue: DropDownType | null) => void;
	onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
	helperText?: string;
	error?: boolean;
	disabled?: boolean;
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	slotProps?: TextFieldProps['slotProps'];
	required?: boolean;
	renderOption?: (props: HTMLAttributes<HTMLLIElement> & { key: Key }, option: DropDownType) => ReactNode;
};

export type CustomDropDownSelectProps = {
	id: string;
	label: string;
	items: Array<DropDownType> | Array<string>;
	theme: Theme;
	value: string | null;
	size?: 'small' | 'medium';
	onChange?: (event: SelectChangeEvent) => void;
	onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
	helperText?: string;
	error?: boolean;
	disabled?: boolean;
	cssClass?: string;
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	children?: ReactNode;
	required?: boolean;
};

export type CustomOutlinedTextProps = {
	ref?: Ref<HTMLInputElement>;
	type: HTMLInputTypeAttribute;
	id: string;
	value: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	onInput?: (e: InputEvent<HTMLInputElement>) => void;
	onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
	onPaste?: (e: ClipboardEvent<HTMLInputElement>) => void;
	theme: Theme;
	cssClass?: string;
	helperText?: string;
	error?: boolean;
	placeholder?: string;
	label?: string;
	fullWidth?: boolean;
	size?: 'small' | 'medium';
	disabled?: boolean;
	onClick?: () => void;
	autoFocus?: boolean;
	slotProps?: TextFieldProps['slotProps'] & { htmlInput?: InputHTMLAttributes<HTMLInputElement> };
	inputRef?: Ref<HTMLInputElement | null>;
};

export type CustomPasswordInputProps = {
	ref?: Ref<HTMLInputElement>;
	id: string;
	value: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	theme: Theme;
	onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
	cssClass?: string;
	helperText?: string;
	error?: boolean;
	placeholder?: string;
	label?: string;
	fullWidth?: boolean;
	size?: 'small' | 'medium';
	disabled?: boolean;
	startIcon?: ReactNode;
	onClick?: () => void;
};

export type CustomSquareImageUploadingProps = {
	image: string | ArrayBuffer | null;
	croppedImage?: string | ArrayBuffer | null;
	onChange: (image: string | ArrayBuffer | null) => void;
	onCrop: (data: string | null) => void;
	cssClasse?: string;
};

export type CustomTextInputProps = {
	ref?: Ref<HTMLInputElement>;
	type: HTMLInputTypeAttribute;
	id: string;
	value: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	theme: Theme;
	onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
	cssClass?: string;
	helperText?: string;
	error?: boolean;
	placeholder?: string;
	label?: string;
	fullWidth?: boolean;
	size?: 'small' | 'medium';
	disabled?: boolean;
	variant?: 'filled' | 'standard' | 'outlined';
	onClick?: () => void;
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	slotProps?: TextFieldProps['slotProps'];
	name?: string;
	required?: boolean;
	autoComplete?: string;
	maxLength?: number;
};

export type FormattedNumberInputProps = {
	ref?: Ref<HTMLInputElement>;
	type: HTMLInputTypeAttribute;
	id: string;
	value: string | number;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	theme: Theme;
	decimals?: number; // Number of decimal places (default: 2)
	onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
	cssClass?: string;
	helperText?: string;
	error?: boolean;
	placeholder?: string;
	label?: string;
	fullWidth?: boolean;
	size?: 'small' | 'medium';
	disabled?: boolean;
	variant?: 'filled' | 'standard' | 'outlined';
	onClick?: () => void;
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	slotProps?: TextFieldProps['slotProps'];
	required?: boolean;
};

export type CircularAvatarInputFileProps = {
	preview: string | ArrayBuffer | null;
	active: boolean;
	setAvatar?: (file: File | null) => void;
	children?: ReactNode;
	showText?: boolean;
};

export type PrimaryAnchorButtonProps = {
	ref?: Ref<HTMLAnchorElement>;
	buttonText: string;
	active: boolean;
	nextPage: string | UrlObject;
	startIcon?: ReactNode;
	onClick?: () => void;
	anchorcssClass?: string;
	cssClass?: string;
	scroll?: boolean;
	shallow?: boolean;
	replace?: boolean;
	type?: 'submit' | 'reset' | 'button' | undefined;
	children?: ReactNode;
};

export type PrimaryButtonProps = {
	buttonText: string;
	active: boolean;
	type?: 'submit' | 'reset' | 'button' | undefined;
	onClick?: () => void;
	cssClass?: string;
	children?: ReactNode;
};

export type PrimaryLoadingButtonProps = {
	buttonText: string;
	loading: boolean;
	onClick?: MouseEventHandler<HTMLButtonElement> | (() => void);
	active?: boolean;
	type?: 'submit' | 'reset' | 'button' | undefined;
	startIcon?: ReactNode;
	cssClass?: string;
	children?: ReactNode;
	inverted?: boolean;
};

export type SquareImageInputFileProps = {
	onImageUpload: () => void;
	children?: ReactNode;
};

export type TextButtonProps = {
	buttonText: string;
	startIcon?: ReactNode;
	onClick?: () => void;
	cssClass?: string;
	disabled?: boolean;
	children?: ReactNode;
};

export type Action = {
	active: boolean;
	text: string;
	onClick: () => void;
	color?: string;
	icon?: ReactNode;
	disabled?: boolean;
};

export type ActionModalsProps = {
	title: string;
	actions: Action[];
	actionsStyle?: string[];
	body?: string;
	children?: ReactNode;
	titleIcon?: ReactNode;
	titleIconColor?: string;
	/** Called when the dialog is dismissed via backdrop click or Escape key. */
	onClose?: () => void;
	maxWidth?: DialogProps['maxWidth'];
	fullWidth?: boolean;
};

export type AuthLayoutProps = {
	ref?: Ref<HTMLElement>;
	children?: ReactNode;
};

export type svgImageType = {
	src: string;
	height: number;
	width: number;
};

export interface AppBarProps extends MuiAppBarProps {
	open?: boolean;
}

export type NavigationBarProps = {
	title: string;
	children: ReactNode;
};

export interface ProtectedProps {
	children: ReactNode;
}

export type CustomToastProps = {
	type: AlertColor;
	show: boolean;
	setShow: Dispatch<SetStateAction<boolean>>;
	message: string;
	children?: ReactNode;
};

export type AddEntityModalProps = {
	open: boolean;
	setOpen: (val: boolean) => void;
	label: string;
	icon: ReactNode;
	inputTheme: Theme;
	mutationFn: (args: { data: { nom: string } }) => Promise<unknown>;
	onSuccess?: (newEntityId: number) => void;
};

export interface ChipSelectOption {
	id: number | string;
	nom: string;
}

export interface ChipSelectFilterProps {
	label: string;
	options: ChipSelectOption[];
	selectedIds: Array<number | string>;
	onChange: (ids: Array<number | string>) => void;
	placeholder?: string;
	theme?: Theme;
}

export interface ChipFilterConfig {
	key: string;
	label: string;
	paramName: string;
	options: ChipSelectOption[];
}

export interface ChipSelectFilterBarProps {
	filters: ChipFilterConfig[];
	onFilterChange: (params: Record<string, string>) => void;
	columns?: number;
}

export interface CurrencyToggleProps {
	selectedDevise: 'MAD' | 'EUR' | 'USD';
	onDeviseChange: (devise: 'MAD' | 'EUR' | 'USD') => void;
	usesForeignCurrency: boolean;
}

export interface DateRangeValue {
	from?: string;
	to?: string;
}

export interface DropdownFilterOption {
	value: string;
	label: string;
	color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export interface DropdownFilterProps extends GridFilterInputValueProps {
	options: DropdownFilterOption[];
	placeholder?: string;
	showChips?: boolean;
}

export type EntityCrudControlsProps = {
	label: string;
	icon: ReactNode;
	inputTheme: Theme;
	selectedItem: DropDownType | null;
	addEntity: (args: { data: { nom: string } }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	editEntity: (args: { id: number; data: { nom: string } }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	deleteEntity: (args: { id: number }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	onAddSuccess: (id: number) => void;
	onDeleteSuccess?: () => void;
	disabled?: boolean;
};

export interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

export interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export interface DateRangeFilterValue {
	from?: string;
	to?: string;
}

export type CustomFilterValue = string | DateRangeFilterValue;

export interface CustomFilterItem {
	id: string;
	field: string;
	operator: string;
	value: CustomFilterValue;
}

export interface CustomFilterModel {
	items: CustomFilterItem[];
	logicOperator: GridLogicOperator;
}

export interface CustomFilterPanelProps {
	columns: GridColDef[];
	filterModel: CustomFilterModel;
	onChange: (model: CustomFilterModel) => void;
}

export interface FilterValueInputProps {
	item: CustomFilterItem;
	applyValue: (item: CustomFilterItem) => void;
}

export interface OperatorInfo {
	value: string;
	label: string;
	InputComponent?: ComponentType<FilterValueInputProps>;
}

export interface GlobalRemiseModalProps {
	open: boolean;
	onClose: () => void;
	currentType: string;
	currentValue: number;
	onApply: (type: 'Pourcentage' | 'Fixe' | '', value: number) => void;
	devise?: string;
}

export interface ModalState {
	type: 'Pourcentage' | 'Fixe' | '';
	value: number;
	error: string;
}

export type LanguageFlagProps = {
	language: Language;
	size?: number;
};

export type ActionItem = {
	label: string;
	icon: ReactNode;
	onClick: (event?: MouseEvent<HTMLElement>) => void;
	color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
	show?: boolean;
	disabled?: boolean;
};

export type MobileActionsMenuProps = {
	actions: ActionItem[];
	desktopGap?: number;
};

export type PaginatedDataGridProps<T> = {
	queryHook?: (params: { page: number; pageSize: number; search: string; [key: string]: string | number }) => {
		data?: { count: number; results: T[] };
		isLoading: boolean;
	};
	data?: { count: number; results: T[] };
	isLoading?: boolean;
	columns: GridColDef[];
	paginationModel: { page: number; pageSize: number };
	setPaginationModel: Dispatch<SetStateAction<{ page: number; pageSize: number }>>;
	searchTerm: string;
	setSearchTerm: Dispatch<SetStateAction<string>>;
	filterModel?: GridFilterModel;
	onFilterModelChange?: (model: GridFilterModel) => void;
	/** Callback emitting backend-ready filter params whenever custom filters change */
	onCustomFilterParamsChange?: (params: Record<string, string>) => void;
	toolbar?: {
		quickFilter?: boolean;
		debounceMs?: number;
	};
	/** Extra toolbar action buttons (CSV import, etc.) shown alongside filter/column buttons */
	toolbarActions?: ReactNode;
	/** Enable checkbox row selection */
	checkboxSelection?: boolean;
	/** Callback fired with the list of selected row IDs (as numbers) whenever selection changes */
	onSelectionChange?: (ids: number[]) => void;
	/** Currently selected IDs – used to compute controlled row selection and banner visibility */
	selectedIds?: number[];
	/** Total matching count shown in the ‘select all matching’ banner */
	totalMatchingCount?: number;
	/** Called when the user clicks ‘Select all N matching’ */
	onSelectAllMatchingClick?: () => void;
	/** Whether the select-all-matching fetch is in progress */
	selectAllMatchingLoading?: boolean;
	/** Whether all matching items across all pages are currently selected */
	isAllMatchingSelected?: boolean;
	/** Called when the user clears the all-matching selection */
	onClearAllMatchingSelected?: () => void;
	/** Maximum content width for the grid wrapper. Defaults to full-width; pass a number/string to cap a compact grid. */
	gridMaxWidth?: number | string | false;
	/** Removes page-level spacing when the grid is rendered inside a view card. */
	embedded?: boolean;
};

export interface PdfLanguageModalProps {
	onSelectLanguage: (language: 'fr' | 'en') => void;
	onClose: () => void;
}
