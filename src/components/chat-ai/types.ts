export type NavigationTarget = {
	application: 'facturation';
	resource: string;
	identifier: number | null;
	company_id: number;
	path: string;
};
export type ChatRecordLine = {
	id: number;
	reference: string;
	product_name: string;
	location?: string | null;
	client?: string;
	quantity?: string;
	received_quantity?: string;
	expected_quantity?: string;
	counted_quantity?: string;
};
export type ChatRecord = {
	id: number;
	number?: string;
	name?: string;
	code?: string;
	client?: string;
	date?: string;
	status?: string;
	payment_status?: string;
	currency?: string;
	total_ttc?: string;
	paid?: string;
	outstanding?: string;
	amount?: string;
	designation?: string;
	type_article?: string;
	archived?: boolean;
	sale_amount?: string;
	sale_label?: 'selling_price' | 'price_excl_tax';
	sale_currency?: string;
	purchase_amount?: string;
	purchase_currency?: string;
	email?: string;
	is_active?: boolean;
	is_staff?: boolean;
	product_name?: string;
	location?: string;
	physical_quantity?: string;
	reserved_quantity?: string;
	available_quantity?: string;
	incoming_quantity?: string;
	projected_quantity?: string;
	stock_minimum?: string;
	quantity?: string;
	balance_after?: string;
	logistics_number?: string;
	supplier?: string;
	global_status?: string;
	date_validated?: string | null;
	date_expected?: string | null;
	date_received?: string | null;
	lines?: ChatRecordLine[];
	has_more_lines?: boolean;
	navigation?: NavigationTarget;
};
export type ChatCard = {
	type:
		| 'record_list'
		| 'invoice'
		| 'client'
		| 'financial_summary'
		| 'navigation'
		| 'knowledge'
		| 'clarification'
		| 'confirmation'
		| 'confirmation_status'
		| 'pdf';
	action_id?: string;
	status?: 'confirmed_update' | 'confirmed_delete' | 'expired' | 'stale' | 'unavailable';
	message?: string;
	operation?: 'update' | 'delete';
	record_id?: number;
	label?: string;
	company_id?: number;
	changes?: Record<string, string | null>;
	before?: Record<string, string | null>;
	warning?: string;
	invoice_id?: number;
	number?: string;
	resource?: string;
	items?: ChatRecord[];
	has_more?: boolean;
	next_offset?: number | null;
	metric?: string;
	value?: string;
	currency?: string;
	period?: { from: string; to: string };
	basis?: string;
	target?: NavigationTarget;
	documents?: { document_id: string; version: string; title: string; content: string }[];
};
export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; cards?: ChatCard[] };
export type ChatCapabilities = {
	companies: {
		id: number;
		name: string;
		can_update: boolean;
		can_delete: boolean;
		can_create: boolean;
		can_print: boolean;
		suggestions: string[];
	}[];
	languages: string[];
};
