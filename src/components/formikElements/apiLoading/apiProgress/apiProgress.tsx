import React, { CSSProperties } from 'react';
import { Box, CircularProgress, Backdrop } from '@mui/material';

type Props = {
	cssStyle?: CSSProperties;
	children?: React.ReactNode;
	backdropColor: string;
	circularColor: string;
};

// '#FFFFFF'
const ApiProgress: React.FC<Props> = (props: Props) => {
	return (
		<Box sx={props.cssStyle}>
			<Backdrop sx={{ backgroundColor: props.backdropColor, zIndex: (theme) => theme.zIndex.drawer + 1 }} open>
				<CircularProgress sx={{color: props.circularColor}} />
			</Backdrop>
		</Box>
	);
};

export default ApiProgress;
