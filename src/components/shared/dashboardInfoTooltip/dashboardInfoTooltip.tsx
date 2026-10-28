'use client';

import { IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { DashboardInfoTooltipProps as Props } from '@/types/dashboardTypes';

const DashboardInfoTooltip = ({ title }: Props) => (
	<Tooltip title={title} arrow placement="top">
		<IconButton type="button" size="small" aria-label={title} sx={{ color: 'text.secondary' }}>
			<InfoOutlinedIcon fontSize="small" />
		</IconButton>
	</Tooltip>
);

export default DashboardInfoTooltip;
