import { type FC } from 'react';
import { Button } from '@mui/material';
import { ThemeProvider } from '@/providers/scopedThemeProvider';
import Styles from './primaryLoadingButton.module.sass';
import { getDefaultTheme } from '@/utils/themes';
import type { PrimaryLoadingButtonProps as Props } from '@/types/uiTypes';

const PrimaryLoadingButton: FC<Props> = (props: Props) => {
	return (
		<ThemeProvider theme={getDefaultTheme()}>
			<Button
				onClick={props.onClick}
				loading={props.loading}
				className={`${Styles.primaryButtonDisabled} 
			${props.active ? (props.inverted ? Styles.primaryButtonInverse : Styles.primaryButtonActive) : ''}
			${props.cssClass && `${props.cssClass}`}`}
				disabled={!props.active}
				type={props.type}
				color="primary"
				startIcon={props.startIcon}
			>
				{props.buttonText}
			</Button>
		</ThemeProvider>
	);
};

export default PrimaryLoadingButton;
