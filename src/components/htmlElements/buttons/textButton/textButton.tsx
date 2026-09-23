import { type FC } from 'react';
import Button from '@mui/material/Button';
import Styles from './textButton.module.sass';
import type { TextButtonProps as Props } from '@/types/uiTypes';

const TextButton: FC<Props> = (props: Props) => {
	return (
		<Button
			className={`${Styles.button} ${props.cssClass && `${props.cssClass}`}`}
			disabled={props.disabled}
			onClick={props.onClick}
			variant="text"
			startIcon={props.startIcon}
		>
			{props.buttonText}
		</Button>
	);
};

export default TextButton;
