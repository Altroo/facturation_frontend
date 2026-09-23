import { type FC } from 'react';
import { CircularProgress, Backdrop } from '@mui/material';
import type { ApiProgressProps as Props } from '@/types/uiTypes';

// '#FFFFFF'
const ApiProgress: FC<Props> = (props: Props) => {
	return (
		<Backdrop sx={{ backgroundColor: props.backdropColor, zIndex: (theme) => theme.zIndex.drawer + 1 }} open>
			<CircularProgress data-testid="api-loader" sx={{ color: props.circularColor }} />
		</Backdrop>
	);
};

export default ApiProgress;
