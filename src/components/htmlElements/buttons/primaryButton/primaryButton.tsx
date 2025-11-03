import React from 'react';
import Styles from './primaryButton.module.sass';
import { ThemeProvider, Button } from '@mui/material';
import { getDefaultTheme } from '@/utils/themes';

type Props = {
	buttonText: string;
	active: boolean;
	type?: 'submit' | 'reset' | 'button' | undefined;
	onClick?: () => void;
	cssClass?: string;
	children?: React.ReactNode;
};

const PrimaryButton: React.FC<Props> = (props: Props) => {
	return (
		<ThemeProvider theme={getDefaultTheme()}>
			<Button
				onClick={props.onClick}
				className={`${Styles.primaryButtonDisabled} 
			${props.active ? `${Styles.primaryButtonActive}` : ''}
			${props.cssClass && `${props.cssClass}`}`}
				disabled={!props.active}
				type={props.type}
				color="primary"
			>
				{props.buttonText}
			</Button>
		</ThemeProvider>
	);
};

export default PrimaryButton;
