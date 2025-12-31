import { Theme, Components } from '@mui/material/styles';
import {
	CustomTheme,
	getDefaultTheme,
	textInputTheme,
	gridInputTheme,
	navigationBarTheme,
	codeTextInputTheme,
	customToastTheme,
	customDropdownTheme,
	customGridDropdownTheme,
} from './themes';
import * as helpers from './helpers';

// Mock the hexToRGB helper
jest.mock('./helpers', () => ({
	hexToRGB: jest.fn((color: string, alpha: number) => `rgba(${color}, ${alpha})`),
}));

type InputBaseOverrides = NonNullable<Components<Theme>['MuiInputBase']>;
type InputBaseRoot = NonNullable<InputBaseOverrides['styleOverrides']>['root'];
type InputBaseInput = NonNullable<InputBaseOverrides['styleOverrides']>['input'];

type FormControlOverrides = NonNullable<Components<Theme>['MuiFormControl']>;
type FormControlRoot = NonNullable<FormControlOverrides['styleOverrides']>['root'];

type AppBarOverrides = NonNullable<Components<Theme>['MuiAppBar']>;
type AppBarRoot = NonNullable<AppBarOverrides['styleOverrides']>['root'];

type AccordionSummaryOverrides = NonNullable<Components<Theme>['MuiAccordionSummary']>;
type AccordionSummaryContent = NonNullable<AccordionSummaryOverrides['styleOverrides']>['content'];

type ListItemTextOverrides = NonNullable<Components<Theme>['MuiListItemText']>;
type ListItemTextPrimary = NonNullable<ListItemTextOverrides['styleOverrides']>['primary'];

type OutlinedInputOverrides = NonNullable<Components<Theme>['MuiOutlinedInput']>;
type OutlinedInputNotchedOutline = NonNullable<OutlinedInputOverrides['styleOverrides']>['notchedOutline'];

type SnackbarOverrides = NonNullable<Components<Theme>['MuiSnackbar']>;
type SnackbarRoot = NonNullable<SnackbarOverrides['styleOverrides']>['root'];

type PaperOverrides = NonNullable<Components<Theme>['MuiPaper']>;
type PaperRoot = NonNullable<PaperOverrides['styleOverrides']>['root'];

type MenuItemOverrides = NonNullable<Components<Theme>['MuiMenuItem']>;
type MenuItemGutters = NonNullable<MenuItemOverrides['styleOverrides']>['gutters'];

interface FieldsetStyles {
	'& fieldset': {
		borderRadius?: string;
		border?: string;
		borderTop?: string;
		borderRight?: string;
		borderLeft?: string;
		borderBottom?: string;
	};
	'& fieldset > legend'?: {
		fontFamily?: string;
		fontSize?: string;
	};
}

interface FormLabelStyles {
	'& .MuiFormLabel-root': {
		fontFamily?: string;
		fontSize?: string;
		color?: string;
	};
	'& .MuiFormLabel-root.Mui-focused': {
		fontFamily?: string;
		fontSize?: string;
		color?: string;
	};
}

interface AlertStyles {
	'&.MuiAlert-outlinedWarning'?: { border?: string };
	'&.MuiAlert-outlinedSuccess'?: { border?: string };
	'&.MuiAlert-outlinedError'?: { border?: string };
	'&.MuiAlert-outlinedInfo'?: { border?: string };
}

interface InputStyles {
	textAlign?: string;
	fontFamily?: string;
	fontSize?: string;
	caretColor?: string;
}

interface PaperStyles {
	border?: string;
	borderBottomLeftRadius?: string;
	borderBottomRightRadius?: string;
	borderRadius?: string;
	boxShadow?: string;
}

interface AppBarStyles {
	backgroundColor?: string;
	color?: string;
	boxShadow?: string;
}

interface SnackbarStyles {
	width?: string;
	backgroundColor?: string;
	borderRadius?: string;
	position?: string;
	margin?: string;
}

interface MenuItemStyles {
	fontFamily?: string;
	fontSize?: string;
	paddingTop?: string;
	paddingBottom?: string;
}

describe('CustomTheme', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should create theme with default ripple color when no primary color provided', () => {
		const theme = CustomTheme();
		expect(theme.palette.primary.main).toBe('#0D070B');
	});

	it('should create theme with converted primary color', () => {
		const primaryColor = '#FF0000';
		const theme = CustomTheme(primaryColor);
		expect(helpers.hexToRGB).toHaveBeenCalledWith(primaryColor, 0.5);
		expect(theme.palette.primary.main).toBe(`rgba(${primaryColor}, 0.5)`);
	});

	it('should handle white primary color specially', () => {
		const theme = CustomTheme('#FFFFFF');
		expect(helpers.hexToRGB).toHaveBeenCalledWith('#0D070B', 0.5);
	});

	it('should have correct success color', () => {
		const theme = CustomTheme();
		expect(theme.palette.success.main).toBe('rgb(129, 199, 132)');
	});

	it('should have correct error color', () => {
		const theme = CustomTheme();
		expect(theme.palette.error.main).toBe('rgb(229, 115, 115)');
	});

	it('should have custom breakpoints', () => {
		const theme = CustomTheme();
		expect(theme.breakpoints.values).toEqual({
			xs: 0,
			sm: 600,
			md: 992,
			lg: 1200,
			xl: 1536,
		});
	});

	it('should use Poppins font family', () => {
		const theme = CustomTheme();
		expect(theme.typography.fontFamily).toBe('Poppins');
	});
});

describe('getDefaultTheme', () => {
	it('should return theme with provided primary color', () => {
		const primaryColor = '#00FF00';
		const theme = getDefaultTheme(primaryColor);
		expect(helpers.hexToRGB).toHaveBeenCalledWith(primaryColor, 0.5);
	});

	it('should return theme with default color when no color provided', () => {
		const theme = getDefaultTheme();
		expect(helpers.hexToRGB).toHaveBeenCalledWith('#0274D7', 0.5);
	});
});

describe('textInputTheme', () => {
	it('should create theme with input customizations', () => {
		const theme = textInputTheme();

		expect(theme.components?.MuiInputBase?.styleOverrides?.root).toBeDefined();
		expect(theme.components?.MuiFormControl?.styleOverrides?.root).toBeDefined();
	});

	it('should have correct input border radius', () => {
		const theme = textInputTheme();
		const inputRoot = theme.components?.MuiInputBase?.styleOverrides?.root as InputBaseRoot & FieldsetStyles;
		expect(inputRoot['& fieldset'].borderRadius).toBe('16px');
		expect(inputRoot['& fieldset'].border).toBe('1px solid #A3A3AD');
	});

	it('should use blue caret color', () => {
		const theme = textInputTheme();
		const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
		expect(inputBase.caretColor).toBe('#0274d7');
	});

	it('should have Poppins font with correct size', () => {
		const theme = textInputTheme();
		const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
		expect(inputBase.fontFamily).toBe('Poppins');
		expect(inputBase.fontSize).toBe('19px');
	});

	it('should have focused label color', () => {
		const theme = textInputTheme();
		const formControl = theme.components?.MuiFormControl?.styleOverrides?.root as FormControlRoot & FormLabelStyles;
		expect(formControl['& .MuiFormLabel-root.Mui-focused'].color).toBe('#0274d7');
	});
});

describe('gridInputTheme', () => {
	it('should create theme with no border on fieldset', () => {
		const theme = gridInputTheme();
		const inputRoot = theme.components?.MuiInputBase?.styleOverrides?.root as InputBaseRoot & FieldsetStyles;
		expect(inputRoot['& fieldset'].border).toBe('none');
	});

	it('should use smaller font size (0.875rem)', () => {
		const theme = gridInputTheme();
		const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
		expect(inputBase.fontSize).toBe('0.875rem');
	});

	it('should have Poppins font family', () => {
		const theme = gridInputTheme();
		const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
		expect(inputBase.fontFamily).toBe('Poppins');
	});
});

describe('navigationBarTheme', () => {
	it('should have white background', () => {
		const theme = navigationBarTheme();
		const appBar = theme.components?.MuiAppBar?.styleOverrides?.root as AppBarRoot & AppBarStyles;
		expect(appBar.backgroundColor).toBe('white');
	});

	it('should have dark text color', () => {
		const theme = navigationBarTheme();
		const appBar = theme.components?.MuiAppBar?.styleOverrides?.root as AppBarRoot & AppBarStyles;
		expect(appBar.color).toBe('#0D070B');
	});

	it('should have box shadow', () => {
		const theme = navigationBarTheme();
		const appBar = theme.components?.MuiAppBar?.styleOverrides?.root as AppBarRoot & AppBarStyles;
		expect(appBar.boxShadow).toBe('0px 0px 24px rgba(13, 7, 11, 0.2)');
	});

	it('should have accordion summary font size', () => {
		const theme = navigationBarTheme();
		const accordionSummary = theme.components?.MuiAccordionSummary?.styleOverrides
			?.content as AccordionSummaryContent & { fontSize?: string };
		expect(accordionSummary.fontSize).toBe('15px');
	});

	it('should have list item font size', () => {
		const theme = navigationBarTheme();
		const listItemText = theme.components?.MuiListItemText?.styleOverrides?.primary as ListItemTextPrimary & {
			fontSize?: string;
		};
		expect(listItemText.fontSize).toBe('15px');
	});
});

describe('codeTextInputTheme', () => {
	it('should use default border color when no error', () => {
		const theme = codeTextInputTheme(false);
		const inputRoot = theme.components?.MuiInputBase?.styleOverrides?.root as InputBaseRoot & FieldsetStyles;
		expect(inputRoot['& fieldset'].borderBottom).toBe('2px solid #D9D9DD');
	});

	it('should use error border color when error is true', () => {
		const theme = codeTextInputTheme(true);
		const inputRoot = theme.components?.MuiInputBase?.styleOverrides?.root as InputBaseRoot & FieldsetStyles;
		expect(inputRoot['& fieldset'].borderBottom).toBe('2px solid #E12D3D');
	});

	it('should have centered text', () => {
		const theme = codeTextInputTheme(false);
		const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
		expect(inputBase.textAlign).toBe('center');
	});

	it('should have large font size for code input', () => {
		const theme = codeTextInputTheme(false);
		const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
		expect(inputBase.fontSize).toBe('42px');
	});

	it('should use valid color for caret', () => {
		const theme = codeTextInputTheme(false);
		const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
		expect(inputBase.caretColor).toBe('#07CBAD');
	});

	it('should have no border radius', () => {
		const theme = codeTextInputTheme(false);
		const outlinedInput = theme.components?.MuiOutlinedInput?.styleOverrides
			?.notchedOutline as OutlinedInputNotchedOutline & { borderRadius?: string };
		expect(outlinedInput.borderRadius).toBe('0px !important');
	});
});

describe('customToastTheme', () => {
	it('should have correct snackbar width', () => {
		const theme = customToastTheme();
		const snackbar = theme.components?.MuiSnackbar?.styleOverrides?.root as SnackbarRoot & SnackbarStyles;
		expect(snackbar.width).toBe('20%');
	});

	it('should have white background', () => {
		const theme = customToastTheme();
		const snackbar = theme.components?.MuiSnackbar?.styleOverrides?.root as SnackbarRoot & SnackbarStyles;
		expect(snackbar.backgroundColor).toBe('white');
	});

	it('should have rounded corners', () => {
		const theme = customToastTheme();
		const snackbar = theme.components?.MuiSnackbar?.styleOverrides?.root as SnackbarRoot & SnackbarStyles;
		const paper = theme.components?.MuiPaper?.styleOverrides?.root as PaperRoot & PaperStyles;
		expect(snackbar.borderRadius).toBe('20px');
		expect(paper.borderRadius).toBe('20px');
	});

	it('should have box shadow on paper', () => {
		const theme = customToastTheme();
		const paper = theme.components?.MuiPaper?.styleOverrides?.root as PaperRoot & PaperStyles;
		expect(paper.boxShadow).toBe('0px 0px 24px rgba(13, 7, 11, 0.1)');
	});

	it('should have correct alert variant borders', () => {
		const theme = customToastTheme();
		const paper = theme.components?.MuiPaper?.styleOverrides?.root as PaperRoot & AlertStyles;
		expect(paper['&.MuiAlert-outlinedWarning']?.border).toBe('1px solid rgba(255, 45, 61, 0.2)');
		expect(paper['&.MuiAlert-outlinedSuccess']?.border).toBe('1px solid rgba(7, 203, 173, 0.2)');
		expect(paper['&.MuiAlert-outlinedError']?.border).toBe('1px solid rgba(255, 45, 61, 0.2)');
		expect(paper['&.MuiAlert-outlinedInfo']?.border).toBe('1px solid rgba(2, 116, 215, 0.2)');
	});
});

describe('customDropdownTheme', () => {
	it('should have rounded border', () => {
		const theme = customDropdownTheme();
		const inputRoot = theme.components?.MuiInputBase?.styleOverrides?.root as InputBaseRoot & FieldsetStyles;
		expect(inputRoot['& fieldset'].borderRadius).toBe('16px');
	});

	it('should have menu item customizations', () => {
		const theme = customDropdownTheme();
		const menuItem = theme.components?.MuiMenuItem?.styleOverrides?.gutters as MenuItemGutters & MenuItemStyles;
		expect(menuItem.fontFamily).toBe('Poppins');
		expect(menuItem.fontSize).toBe('16px');
		expect(menuItem.paddingTop).toBe('10px');
		expect(menuItem.paddingBottom).toBe('10px');
	});

	it('should have blue border on paper', () => {
		const theme = customDropdownTheme();
		const paper = theme.components?.MuiPaper?.styleOverrides?.root as PaperRoot & PaperStyles;
		expect(paper.border).toBe('1px solid #0274d7');
	});

	it('should have rounded bottom corners on paper', () => {
		const theme = customDropdownTheme();
		const paper = theme.components?.MuiPaper?.styleOverrides?.root as PaperRoot & PaperStyles;
		expect(paper.borderBottomLeftRadius).toBe('21px');
		expect(paper.borderBottomRightRadius).toBe('21px');
	});

	it('should have correct label font size', () => {
		const theme = customDropdownTheme();
		const formControl = theme.components?.MuiFormControl?.styleOverrides?.root as FormControlRoot & FormLabelStyles;
		expect(formControl['& .MuiFormLabel-root'].fontSize).toBe('16px');
	});
});

describe('customGridDropdownTheme', () => {
	it('should have no border on fieldset', () => {
		const theme = customGridDropdownTheme();
		const inputRoot = theme.components?.MuiInputBase?.styleOverrides?.root as InputBaseRoot & FieldsetStyles;
		expect(inputRoot['& fieldset'].border).toBe('none');
	});

	it('should use smaller font size (0.875rem)', () => {
		const theme = customGridDropdownTheme();
		const menuItem = theme.components?.MuiMenuItem?.styleOverrides?.gutters as MenuItemGutters & MenuItemStyles;
		expect(menuItem.fontSize).toBe('0.875rem');
	});

	it('should have blue border on paper', () => {
		const theme = customGridDropdownTheme();
		const paper = theme.components?.MuiPaper?.styleOverrides?.root as PaperRoot & PaperStyles;
		expect(paper.border).toBe('1px solid #0274d7');
	});

	it('should have rounded bottom corners', () => {
		const theme = customGridDropdownTheme();
		const paper = theme.components?.MuiPaper?.styleOverrides?.root as PaperRoot & PaperStyles;
		expect(paper.borderBottomLeftRadius).toBe('21px');
		expect(paper.borderBottomRightRadius).toBe('21px');
	});

	it('should have correct input font size', () => {
		const theme = customGridDropdownTheme();
		const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
		expect(inputBase.fontSize).toBe('0.875rem');
	});
});

describe('Theme consistency', () => {
	it('all themes should use Poppins font', () => {
		const themes = [
			CustomTheme(),
			textInputTheme(),
			gridInputTheme(),
			navigationBarTheme(),
			codeTextInputTheme(false),
			customToastTheme(),
			customDropdownTheme(),
			customGridDropdownTheme(),
		];

		themes.forEach((theme) => {
			expect(theme.typography.fontFamily).toBe('Poppins');
		});
	});

	it('all themes should have same breakpoints', () => {
		const themes = [CustomTheme(), textInputTheme(), gridInputTheme()];

		const expectedBreakpoints = {
			xs: 0,
			sm: 600,
			md: 992,
			lg: 1200,
			xl: 1536,
		};

		themes.forEach((theme) => {
			expect(theme.breakpoints.values).toEqual(expectedBreakpoints);
		});
	});

	it('input themes should use consistent blue color', () => {
		const blueColor = '#0274d7';
		const themes = [textInputTheme(), gridInputTheme(), customDropdownTheme(), customGridDropdownTheme()];

		themes.forEach((theme) => {
			const inputBase = theme.components?.MuiInputBase?.styleOverrides?.input as InputBaseInput & InputStyles;
			expect(inputBase?.caretColor).toBe(blueColor);
		});
	});
});
