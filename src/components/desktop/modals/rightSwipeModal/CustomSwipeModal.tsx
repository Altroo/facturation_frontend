'use client';

import React, { useMemo } from 'react';
import Styles from './CustomSwipeModal.module.sass';
import { Dialog, Box, Slide, ThemeProvider } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseSVG from '../../../../../public/assets/svgs/navigationIcons/close.svg';
import Image from 'next/image';
import { customModalTheme } from '@/utils/themes';
import { Theme } from '@mui/material/styles';

// left
const DefaultTransition = React.forwardRef(function Transition(
	props: TransitionProps & {
		// eslint-disable-next-line
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return (
		<Slide direction="left" ref={ref} {...props}>
			{props.children}
		</Slide>
	);
});

// Up
const UpTransition = React.forwardRef(function Transition(
	props: TransitionProps & {
		// eslint-disable-next-line
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return (
		<Slide direction="up" ref={ref} {...props}>
			{props.children}
		</Slide>
	);
});

// Down
const DownTransition = React.forwardRef(function Transition(
	props: TransitionProps & {
		// eslint-disable-next-line
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return (
		<Slide direction="down" ref={ref} {...props}>
			{props.children}
		</Slide>
	);
});

// Right
const RightTransition = React.forwardRef(function Transition(
	props: TransitionProps & {
		// eslint-disable-next-line
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return (
		<Slide direction="right" ref={ref} {...props}>
			{props.children}
		</Slide>
	);
});

type Props = {
	open: boolean;
	handleClose?: () => void;
	fullScreen?: boolean;
	keepMounted?: boolean;
	waitShopSelector?: boolean;
	direction?: 'left' | 'right' | 'up' | 'down';
	transition: boolean;
	showCloseIcon?: boolean;
	cssClasse?: string;
	onBackdrop?: () => void;
	theme?: Theme;
	hideBackdrop?: boolean;
	disableScrollLock?: boolean;
	children?: React.ReactNode;
};

const CustomSwipeModal: React.FC<Props> = (props: Props) => {
	const {
		keepMounted,
		waitShopSelector,
		direction,
		showCloseIcon,
		handleClose,
		open,
		fullScreen,
		cssClasse,
		onBackdrop,
		theme,
		transition,
		disableScrollLock,
		hideBackdrop,
	} = props;

	// Derive mountDialog directly from props - no state or useEffect needed!
	const mountDialog = useMemo(() => {
		if (waitShopSelector) {
			return true;
		}
		if (typeof keepMounted === 'boolean') {
			return keepMounted;
		}
		return false;
	}, [keepMounted, waitShopSelector]);

	// Derive transition component based on direction
	const Transition = useMemo(() => {
		if (!transition) return undefined;

		if (direction === 'up') {
			return UpTransition;
		} else if (direction === 'down') {
			return DownTransition;
		} else if (direction === 'right') {
			return RightTransition;
		}
		return DefaultTransition;
	}, [transition, direction]);

	return (
		<ThemeProvider theme={theme ? theme : customModalTheme()}>
			<Dialog
				data-testid="custom-swipe-modal"
				keepMounted={mountDialog}
				open={open}
				slots={{ transition: Transition }}
				hideBackdrop={hideBackdrop}
				disableScrollLock={disableScrollLock}
				onClose={(_e, reason) => {
					if (onBackdrop) {
						if (reason) {
							onBackdrop();
						}
					} else {
						if (handleClose) {
							handleClose();
						}
					}
				}}
				aria-describedby="alert-dialog-slide-description"
				fullScreen={typeof fullScreen !== 'undefined' ? fullScreen : true}
				className={`${Styles.dialog} ${cssClasse && cssClasse}`}
			>
				{showCloseIcon && (
					<Box className={Styles.closeButtonWrapper}>
						<Image
							src={CloseSVG}
							alt=""
							width="40"
							height="40"
							sizes="100vw"
							loading="eager"
							onClick={handleClose}
							style={{ cursor: 'pointer' }}
						/>
					</Box>
				)}
				{props.children}
			</Dialog>
		</ThemeProvider>
	);
};

export default CustomSwipeModal;
