import React, { useState } from 'react';
import { Box } from '@mui/material';
import { GridFilterInputValueProps, GridFilterOperator } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';

interface DateRangeValue {
	from?: string;
	to?: string;
}

const DateRangeFilterInput: React.FC<GridFilterInputValueProps> = (props) => {
	const { item, applyValue } = props;
	const value = (item.value as DateRangeValue) || {};

	const [fromDate, setFromDate] = useState<Date | null>(value.from ? new Date(value.from) : null);
	const [toDate, setToDate] = useState<Date | null>(value.to ? new Date(value.to) : new Date());

	const handleFromChange = (date: Date | null) => {
		setFromDate(date);
		const newValue: DateRangeValue = {
			from: date ? date.toISOString().split('T')[0] : undefined,
			to: toDate ? toDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
		};
		applyValue({ ...item, value: newValue });
	};

	const handleToChange = (date: Date | null) => {
		setToDate(date);
		const newValue: DateRangeValue = {
			from: fromDate ? fromDate.toISOString().split('T')[0] : undefined,
			to: date ? date.toISOString().split('T')[0] : undefined,
		};
		applyValue({ ...item, value: newValue });
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Box sx={{ display: 'inline-flex', flexDirection: 'row', gap: 1, alignItems: 'center', paddingRight: 1 }}>
				<DatePicker
					label="De"
					value={fromDate}
					onChange={handleFromChange}
					slotProps={{
						textField: {
							size: 'small',
							sx: { width: 190 },
						},
					}}
				/>
				<DatePicker
					label="À"
					value={toDate}
					onChange={handleToChange}
					minDate={fromDate || undefined}
					slotProps={{
						textField: {
							size: 'small',
							sx: { width: 190 },
						},
					}}
				/>
			</Box>
		</LocalizationProvider>
	);
};

export const createDateRangeFilterOperator = <T extends Record<string, unknown>>(): GridFilterOperator<T>[] => [
	{
		label: 'entre',
		value: 'between',
		getApplyFilterFn: () => {
			// Return null to indicate server-side filtering
			// The actual filtering is done by the backend using date_after/date_before params
			return null;
		},
		InputComponent: DateRangeFilterInput,
	},
];
