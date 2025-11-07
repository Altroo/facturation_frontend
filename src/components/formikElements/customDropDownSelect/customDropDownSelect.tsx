import React from 'react';
import Styles from './customDropDownSelect.module.sass';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { ThemeProvider, MenuItem, FormControl, InputLabel, OutlinedInput, Stack, FormHelperText } from '@mui/material';
import { Theme } from '@mui/material/styles';
import ActiveCheckBlue from '../../../../public/assets/svgs/globalIcons/active-check-blue.svg';
import Image from 'next/image';
import { AccountGenderCodeValueType } from '@/types/accountTypes';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: 250,
		},
	},
};

type Props = {
	id: string;
	label: string;
	items: Array<AccountGenderCodeValueType>;
	theme: Theme;
	value: string | null;
	onChange?: (event: SelectChangeEvent) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	helperText?: string;
	error?: boolean;
	disabled?: boolean;
	cssClass?: string;
	children?: React.ReactNode;
};

const CustomDropDownSelect: React.FC<Props> = (props: Props) => {
	return (
		<ThemeProvider theme={props.theme}>
			<FormControl className={`${Styles.formControl} ${props.cssClass}`} disabled={props.disabled}>
				<InputLabel id={`${props.id}-label`}>{props.label}</InputLabel>
				<Select
					labelId={`${props.id}-label`}
					id={props.id}
					value={props.value ? props.value : ''}
					onChange={props.onChange}
					input={<OutlinedInput label={props.label} />}
					MenuProps={MenuProps}
					renderValue={(selected) => selected}
					onBlur={props.onBlur}
					error={props.error}
				>
					{props.helperText ? <FormHelperText>{props.helperText}</FormHelperText> : null}
					{props.items.map((item, index) => (
						<MenuItem key={index} value={item.value}>
							<Stack direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
								<span>{item.value}</span>
								{props.value && props.value.indexOf(item.value) > -1 && <Image src={ActiveCheckBlue} alt="" />}
							</Stack>
						</MenuItem>
					))}
				</Select>
			</FormControl>
		</ThemeProvider>
	);
};

export default CustomDropDownSelect;
