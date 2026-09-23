import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import type { ReactNode } from 'react';

export type StockState = 'disponible' | 'minimum' | 'a_approvisionner';
export type StockMovementType = 'opening' | 'adjustment' | 'receipt' | 'delivery' | 'inventory' | 'reversal';
export type StockListFilters = Record<string, string>;

export type StockBalance = {
	id: number;
	company: number;
	article: number;
	article_reference: string;
	article_designation: string;
	emplacement: number;
	emplacement_name: string;
	physical_quantity: string;
	reserved_quantity: string;
	available_quantity: string;
	incoming_quantity: string;
	projected_quantity: string;
	stock_minimum: string;
	stock_state: StockState;
	date_updated: string;
};

export type StockMovement = {
	id: number;
	balance: number;
	article_reference: string;
	article_designation: string;
	emplacement_name: string;
	movement_type: StockMovementType;
	movement_type_display: string;
	quantity: string;
	balance_after: string;
	source_type: string;
	source_id: number | null;
	note: string;
	actor_name: string | null;
	date_created: string;
};

export type StockReceiptLine = {
	id: number;
	logistics_line: number;
	article: number;
	article_reference: string;
	article_designation: string;
	emplacement: number;
	emplacement_name: string;
	quantity: string;
};

export type StockReceipt = {
	id: number;
	company: number;
	logistics_order: number;
	logistics_order_number: string;
	status: 'draft' | 'validated' | 'cancelled';
	reference: string;
	note: string;
	created_by_name: string;
	validated_by_name: string | null;
	date_created: string;
	date_validated: string | null;
	lines: StockReceiptLine[];
};

export type InventoryLine = {
	id: number;
	article: number;
	article_reference: string;
	article_designation: string;
	expected_quantity: string;
	counted_quantity: string;
	difference: string;
};

export type InventorySession = {
	id: number;
	company: number;
	emplacement: number;
	emplacement_name: string;
	status: 'draft' | 'validated' | 'cancelled';
	reference: string;
	note: string;
	created_by_name: string;
	validated_by_name: string | null;
	date_created: string;
	date_validated: string | null;
	lines: InventoryLine[];
};

export type StockAdjustmentFormValues = {
	movement_type: Extract<StockMovementType, 'opening' | 'adjustment'>;
	article: number | null;
	emplacement: number | null;
	quantity: string | number;
	reason: string;
	globalError: string;
};

export type StockReceiptFormValues = {
	logistics_order: number | null;
	logistics_line: number | null;
	emplacement: number | null;
	quantity: string | number;
	reference: string;
	note: string;
	globalError: string;
};

export type StockInventoryFormValues = {
	article: number | null;
	emplacement: number | null;
	counted_quantity: string | number;
	reference: string;
	note: string;
	globalError: string;
};

export type StockBalanceResponse = PaginationResponseType<StockBalance>;
export type StockMovementResponse = PaginationResponseType<StockMovement>;
export type StockReceiptResponse = PaginationResponseType<StockReceipt>;
export type InventoryResponse = PaginationResponseType<InventorySession>;

export type StockFormWrapperProps = SessionProps & {
	company_id: number;
	title: string;
	allowedRoles: string[];
	children: (token?: string) => ReactNode;
};

export type StockFormContentProps = {
	token?: string;
	company_id: number;
	balance_id?: number;
};

export type StockFormProps = SessionProps & {
	company_id: number;
	balance_id?: number;
};

export type StockInventoryFormContentProps = {
	token?: string;
	company_id: number;
};

export type StockInventoryFormProps = SessionProps & { company_id: number };

export type StockInventoryViewInfoRowProps = {
	icon: ReactNode;
	label: string;
	value: ReactNode | string | number | null | undefined;
};

export type StockInventoryViewProps = SessionProps & { company_id: number; id: number };

export type StockMovementViewInfoRowProps = {
	icon: ReactNode;
	label: string;
	value: ReactNode | string | number | null | undefined;
};

export type StockMovementViewProps = SessionProps & { company_id: number; id: number };

export type StockReceiptFormContentProps = {
	token?: string;
	company_id: number;
};

export type StockReceiptFormProps = SessionProps & { company_id: number };

export type StockReceiptViewInfoRowProps = {
	icon: ReactNode;
	label: string;
	value: ReactNode | string | number | null | undefined;
};

export type StockReceiptViewProps = SessionProps & { company_id: number; id: number };

export type PendingAction = 'validate' | 'cancel' | null;

export type StockViewInfoRowProps = {
	icon: ReactNode;
	label: string;
	value: ReactNode | string | number | null | undefined;
};

export type StockViewProps = SessionProps & { company_id: number; id: number };
