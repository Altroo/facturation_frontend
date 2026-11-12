'use client';

import { useState } from 'react';
import { DatePicker, type DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { formatLocalDate } from '@/utils/helpers';

type Props = Omit<DatePickerProps, 'value' | 'onChange'> & {
	value: string | null | undefined;
	onChange: (value: string) => void;
};

export default function LogistiqueDatePicker({ value, onChange, ...props }: Props) {
	const source = value ?? '';
	const [draft, setDraft] = useState<{ source: string; date: Date | null } | null>(null);
	const selected = draft?.source === source ? draft.date : source ? new Date(`${source}T00:00:00`) : null;
	return (
		<DatePicker
			{...props}
			value={selected}
			onChange={(date) => {
				const serialized = date && !Number.isNaN(date.getTime()) ? formatLocalDate(date) : '';
				// Keep incomplete keyboard input in the picker while Formik validates the serialized value.
				setDraft({ source: serialized, date });
				onChange(serialized);
			}}
		/>
	);
}
