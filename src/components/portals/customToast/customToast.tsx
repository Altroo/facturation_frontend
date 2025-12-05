import React from 'react';
import { Stack, Snackbar, ThemeProvider, Slide } from '@mui/material';
import Styles from './customToast.module.sass';
import MuiAlert, { AlertProps, AlertColor } from '@mui/material/Alert';
import { customToastTheme } from '@/utils/themes';
import {
	CheckCircleOutline as CheckCircleOutlineIcon,
	ErrorOutline as ErrorOutlineIcon,
	InfoOutline as InfoOutlineIcon,
	WarningAmberOutlined as WarningAmberOutlinedIcon,
} from '@mui/icons-material';

type Props = {
	type: AlertColor;
	show: boolean;
	setShow: React.Dispatch<React.SetStateAction<boolean>>;
	message: string;
	children?: React.ReactNode;
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
	return <MuiAlert elevation={6} ref={ref} variant="outlined" {...props} />;
});

const CustomToast: React.FC<Props> = (props) => {
	const { type } = props;

	const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') return;
		props.setShow(false);
	};
	return (
		<ThemeProvider theme={customToastTheme()}>
			<Stack spacing={2} className={Styles.rootStack}>
				<Snackbar
					style={{ width: 'max-content' }}
					open={props.show}
					autoHideDuration={6000}
					onClose={handleClose}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
					slots={{ transition: Slide }}
					slotProps={{ transition: { direction: 'up' } }}
				>
					<Alert
						onClose={handleClose}
						severity={type}
						className={Styles.alert}
						iconMapping={{
							success: <CheckCircleOutlineIcon className={Styles.alertIcon} color="success" />,
							error: <ErrorOutlineIcon className={Styles.alertIcon} color="error" />,
							info: <InfoOutlineIcon className={Styles.alertIcon} color="info" />,
							warning: <WarningAmberOutlinedIcon className={Styles.alertIcon} color="warning" />,
						}}
					>
						{props.message}
					</Alert>
				</Snackbar>
			</Stack>
		</ThemeProvider>
	);
};

export default CustomToast;
