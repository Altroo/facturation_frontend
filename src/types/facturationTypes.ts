// Notification types for the facturation system

export type NotificationTypeValue =
	| 'overdue_invoice'
	| 'expiring_quote'
	| 'uninvoiced_bdl'
	| 'status_change';

export type QuoteExpiryDaysValue = 0 | 1 | 3 | 7 | 14 | 30;

export interface NotificationType {
	id: number;
	title: string;
	message: string;
	notification_type: NotificationTypeValue;
	object_id: number | null;
	is_read: boolean;
	date_created: string;
}

export interface NotificationPreferenceType {
	id: number;
	notify_overdue_invoice: boolean;
	notify_expiring_quote: boolean;
	notify_uninvoiced_bdl: boolean;
	quote_expiry_days: QuoteExpiryDaysValue;
	date_created: string;
	date_updated: string;
}

export interface NotificationPreferenceFormValues {
	notify_overdue_invoice: boolean;
	notify_expiring_quote: boolean;
	notify_uninvoiced_bdl: boolean;
	quote_expiry_days: QuoteExpiryDaysValue;
	globalError: string;
}
