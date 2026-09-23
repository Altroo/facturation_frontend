'use client';

import { useState } from 'react';
import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { chipSelectFilterTheme } from '@/utils/themes';
import { useLanguage } from '@/utils/hooks';
import type { ChipSelectFilterProps } from '@/types/uiTypes';

const defaultTheme = chipSelectFilterTheme();

const ChipSelectFilter = ({ label, options, selectedIds, onChange, placeholder, theme }: ChipSelectFilterProps) => {
	const [inputValue, setInputValue] = useState('');
	const { t } = useLanguage();

	const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));

	return (
		<ThemeProvider theme={theme ?? defaultTheme}>
			<Box sx={{ width: '100%' }}>
				<Typography
					variant="caption"
					sx={{
						color: 'text.secondary',
						mb: 0.5,
						display: 'block',
						fontFamily: 'Poppins',
						fontSize: '12px',
					}}
				>
					{label}
				</Typography>
				<Autocomplete
					multiple
					size="small"
					options={options}
					value={selectedOptions}
					onChange={(_event, newValue) => onChange(newValue.map((opt) => opt.id))}
					inputValue={inputValue}
					onInputChange={(_event, newInputValue) => setInputValue(newInputValue)}
					getOptionLabel={(option) => option.nom}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					renderValue={(selected, getTagProps) =>
						selected.map((option, index) => {
							const { key, ...rest } = getTagProps({ index });
							return <Chip key={key} label={option.nom} size="small" variant="outlined" color="primary" {...rest} />;
						})
					}
					renderInput={(params) => (
						<TextField
							{...params}
							placeholder={selectedOptions.length === 0 ? (placeholder ?? `Filtrer par ${label.toLowerCase()}`) : ''}
							variant="outlined"
							size="small"
						/>
					)}
					noOptionsText={t.common.noOptions}
				/>
			</Box>
		</ThemeProvider>
	);
};

export default ChipSelectFilter;
