import {
	WSMaintenanceAction,
	WSNotificationAction,
	WSUserAvatarAction,
	WSReconnectedAction,
	WSLogisticsUpdatedAction,
} from '@/store/actions/wsActions';

export type WSAction =
	| ReturnType<typeof WSUserAvatarAction>
	| ReturnType<typeof WSMaintenanceAction>
	| ReturnType<typeof WSNotificationAction>
	| ReturnType<typeof WSReconnectedAction>
	| ReturnType<typeof WSLogisticsUpdatedAction>;

type WSMessage = {
	type: string;
	pk?: number;
	avatar?: string;
	maintenance?: boolean;
	version?: string;
	id?: number;
	company_id?: number;
	title?: string;
	message?: string;
	notification_type?: string;
	object_id?: number | null;
	target_url?: string;
	reservation_id?: number | null;
	is_read?: boolean;
	date_created?: string;
};

export type WSEnvelope = {
	message: WSMessage;
};

export interface WSMaintenanceBootstrap {
	maintenance: boolean;
	version?: string;
}
