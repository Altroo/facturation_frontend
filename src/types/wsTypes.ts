import { WSMaintenanceAction, WSUserAvatarAction } from '@/store/actions/wsActions';

export type WSAction = ReturnType<typeof WSUserAvatarAction> | ReturnType<typeof WSMaintenanceAction>;

type WSMessage = {
	type: string;
	pk?: number;
	avatar?: string;
	maintenance?: boolean;
};

export type WSEnvelope = {
	message: WSMessage;
};

export interface WSMaintenanceBootstrap {
	maintenance: boolean;
}
