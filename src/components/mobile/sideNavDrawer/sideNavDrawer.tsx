import React from 'react';
import Styles from './sideNavDrawer.module.sass';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import { createTheme, ThemeProvider } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

const customTheme = createTheme({
	components: {
		MuiDialog: {
			styleOverrides: {
				root: {
					'& .MuiPaper-root': {
						overflowX: 'hidden',
					}
				}
			}
		}
	}
});

const Transition = React.forwardRef(function Transition(
	props: TransitionProps & {
		// eslint-disable-next-line
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return <Slide direction="right" ref={ref} {...props}>{props.children}</Slide>;
});

type Props = {
	open: boolean;
	handleClose: () => void;
	keepMounted?: boolean;
	disablePortal?: boolean;
	children?: React.ReactNode;
};

const SideNavDrawer: React.FC<Props> = (props: Props) => {

	return (
		<ThemeProvider theme={customTheme}>
			<Dialog
				keepMounted={props.keepMounted}
				open={props.open}
				slots={{ transition: Transition }}
				onClose={props.handleClose}
				aria-describedby="alert-dialog-slide-description"
				fullScreen={true}
				className={Styles.dialog}
				disablePortal={props.disablePortal}
			>
				{props.children}
			</Dialog>
		</ThemeProvider>
	);
};

export default SideNavDrawer;
