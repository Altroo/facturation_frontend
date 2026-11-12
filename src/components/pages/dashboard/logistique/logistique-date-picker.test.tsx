import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LogistiqueDatePicker from './logistique-date-picker';
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: ({ value, onChange }: { value: Date | null; onChange: (value: Date | null) => void }) => (
		<>
			<output data-testid="picker">
				{value == null
					? 'empty'
					: Number.isNaN(value.getTime())
						? 'incomplete'
						: value.getFullYear() + '-' + (value.getMonth() + 1) + '-' + value.getDate()}
			</output>
			<button onClick={() => onChange(new Date(NaN))}>Type part</button>
			<button onClick={() => onChange(new Date(2026, 10, 12))}>Finish date</button>
		</>
	),
}));
it('retains partial input through Formik and unrelated renders, then commits the date', () => {
	function Form() {
		const [value, setValue] = useState('');
		const [count, setCount] = useState(0);
		return (
			<>
				<LogistiqueDatePicker value={value} onChange={setValue} />
				<output data-testid="value">{value}</output>
				<button onClick={() => setCount(count + 1)}>Next field {count}</button>
			</>
		);
	}
	render(<Form />);
	fireEvent.click(screen.getByText('Type part'));
	expect(screen.getByTestId('picker')).toHaveTextContent('incomplete');
	fireEvent.click(screen.getByText('Next field 0'));
	expect(screen.getByTestId('picker')).toHaveTextContent('incomplete');
	fireEvent.click(screen.getByText('Finish date'));
	fireEvent.click(screen.getByText('Next field 1'));
	expect(screen.getByTestId('value')).toHaveTextContent('2026-11-12');
	expect(screen.getByTestId('picker')).toHaveTextContent('2026-11-12');
});
it('accepts an external replacement of the date', () => {
	const { rerender } = render(<LogistiqueDatePicker value="2026-11-12" onChange={() => undefined} />);
	rerender(<LogistiqueDatePicker value="2026-12-01" onChange={() => undefined} />);
	expect(screen.getByTestId('picker')).toHaveTextContent('2026-12-1');
});
