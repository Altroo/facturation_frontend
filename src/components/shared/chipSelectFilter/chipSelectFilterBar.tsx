'use client';

import { type FC, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Box } from '@mui/material';
import ChipSelectFilter from './chipSelectFilter';
import type { ChipSelectFilterBarProps } from '@/types/uiTypes';

const ChipSelectFilterBar: FC<ChipSelectFilterBarProps> = ({ filters, onFilterChange, columns }) => {
	// Compute stable key representing current filter configuration
	const filterKeys = filters.map((f) => f.key).join(',');

	const [selectedMap, setSelectedMap] = useState<Record<string, Array<number | string>>>(() => {
		const initial: Record<string, Array<number | string>> = {};
		filters.forEach((f) => {
			initial[f.key] = [];
		});
		return initial;
	});

	// Track filter keys to detect changes and reset state
	const [lastFilterKeys, setLastFilterKeys] = useState(filterKeys);

	// Reset selectedMap when filter keys change (during render phase)
	if (lastFilterKeys !== filterKeys) {
		setLastFilterKeys(filterKeys);
		const reset: Record<string, Array<number | string>> = {};
		filters.forEach((f) => {
			reset[f.key] = [];
		});
		setSelectedMap(reset);
	}

	const prevParamsRef = useRef<string>('{}');

	const notifyFilterChange = useEffectEvent((params: Record<string, string>) => {
		onFilterChange(params);
	});

	useEffect(() => {
		const params: Record<string, string> = {};
		filters.forEach((filter) => {
			const ids = selectedMap[filter.key];
			if (ids?.length) params[filter.paramName] = ids.join(',');
		});
		const paramsKey = JSON.stringify(params);
		if (paramsKey !== prevParamsRef.current) {
			prevParamsRef.current = paramsKey;
			notifyFilterChange(params);
		}
	}, [selectedMap, filters]);

	const handleChange = (key: string, ids: Array<number | string>) => {
		setSelectedMap((prev) => ({
			...prev,
			[key]: ids,
		}));
	};

	if (filters.length === 0) return null;

	return (
		<Box
			sx={{
				px: { xs: 0, sm: 2, md: 3 },
				mt: { xs: 1, sm: 2, md: 2 },
				mb: { xs: 1, sm: 1, md: 1 },
				mx: { xs: 1, sm: 1, md: 1 },
			}}
		>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: '1fr',
						sm: columns ? `repeat(${columns}, 1fr)` : `repeat(auto-fill, minmax(200px, 300px))`,
					},
					gap: { xs: 1, sm: 2 },
				}}
			>
				{filters.map((filter) => (
					<ChipSelectFilter
						key={filter.key}
						label={filter.label}
						options={filter.options}
						selectedIds={selectedMap[filter.key] ?? []}
						onChange={(ids) => handleChange(filter.key, ids)}
					/>
				))}
			</Box>
		</Box>
	);
};

export default ChipSelectFilterBar;
