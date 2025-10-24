import { createTheme } from '@mui/material/styles';
import { hexToRGB } from './helpers';

export const CustomTheme = (primaryColor: string | undefined = undefined) => {
	let rippleColor = '#0D070B';
	if (primaryColor) {
		if (primaryColor !== '#FFFFFF') {
			rippleColor = hexToRGB(primaryColor, 0.5);
		} else {
			rippleColor = hexToRGB(rippleColor, 0.5);
		}
	}
	/*
	$mobile : (max-width: 767px)'
	$tablette : (min-width: 768px) and (max-width: 991px)'
	$tablette : (max-width: 991px)'
	$desktop : (min-width: 992px)'
	$large : (min-width: 1200px) and (max-width: 1919px)'
	$wide : (min-width: 1920px)'
	 */
	return createTheme({
		palette: {
			primary: {
				main: rippleColor,
			},
			success: {
				main: 'rgb(129, 199, 132)',
			},
			error: {
				main: 'rgb(229, 115, 115)',
			},
		},
		breakpoints: {
			values: {
				xs: 0,
				sm: 767,
				md: 991,
				lg: 1200,
				xl: 1920,
			},
		},
		// typography: {
		// 	fontFamily: 'Poppins',
		// },
	});
};

export const getDefaultTheme = (primaryColor: string | undefined = undefined) => {
	const defaultColor = '#0274D7';
	if (primaryColor) {
		return CustomTheme(primaryColor);
	} else {
		return CustomTheme(defaultColor);
	}
};