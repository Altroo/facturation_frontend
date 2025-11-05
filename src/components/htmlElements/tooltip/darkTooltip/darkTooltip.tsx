import { Tooltip, tooltipClasses, TooltipProps } from '@mui/material';

const DarkTooltip = (props: TooltipProps) => (
	<Tooltip
		{...props}
		arrow
		placement="bottom-end"
		sx={{
			[`& .${tooltipClasses.tooltip}`]: {
				backgroundColor: '#000',
				color: '#fff',
				fontSize: '0.75rem',
				borderRadius: '4px',
				boxShadow: 1,
			},
			[`& .${tooltipClasses.arrow}`]: {
				color: '#000',
			},
		}}
	/>
);

export default DarkTooltip;
