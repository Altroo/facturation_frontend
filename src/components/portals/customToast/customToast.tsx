import React from 'react';
import { Stack, Snackbar, ThemeProvider, Slide } from '@mui/material';
import Styles from './customToast.module.sass';
import MuiAlert, { AlertProps, AlertColor } from '@mui/material/Alert';
import { customToastTheme } from '@/utils/themes';
import ErrorIconSVG from '@/public/assets/svgs/portals/error.svg';
import WarningIconSVG from '@/public/assets/svgs/portals/warning.svg';
import InfoIconSVG from '@/public/assets/svgs/portals/info.svg';
import SuccessIconSVG from '@/public/assets/svgs/portals/success.svg';
import Image from 'next/image';

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
							success: (
								<Image src={SuccessIconSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.alertIcon} />
							),
							error: (
								<Image src={ErrorIconSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.alertIcon} />
							),
							info: <Image src={InfoIconSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.alertIcon} />,
							warning: (
								<Image src={WarningIconSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.alertIcon} />
							),
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
