'use client';

import React from 'react';
import { Alert, Stack } from '@mui/material';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import { useLanguage } from '@/utils/hooks';

type Props = {
	errorDetails?: Record<string, string[] | string> | null;
	cssStyle?: SxProps<Theme>;
	children?: React.ReactNode;
};

const GLOBAL_ERROR_KEYS = new Set(['detail', 'error', 'globalError', 'message', 'non_field_errors']);

const formatErrorKey = (key: string) =>
	key
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^./, (letter) => letter.toUpperCase());

const getErrorMessages = (errorDetails?: Record<string, string[] | string> | null): string[] => {
	if (!errorDetails || typeof errorDetails !== 'object') return [];

	const messages: string[] = [];
	for (const [key, value] of Object.entries(errorDetails)) {
		const values = Array.isArray(value) ? value : [value];
		for (const item of values) {
			const message = String(item).trim();
			if (!message) continue;
			messages.push(GLOBAL_ERROR_KEYS.has(key) ? message : `${formatErrorKey(key)} : ${message}`);
		}
	}
	return messages;
};

const ApiAlert: React.FC<Props> = (props: Props) => {
	const { t } = useLanguage();
	const errorMessages = getErrorMessages(props.errorDetails);

	return (
		<Alert severity="error" sx={props.cssStyle}>
			{errorMessages.length === 0 && t.common.genericError}
			{errorMessages.length === 1 && errorMessages[0]}
			{errorMessages.length > 1 && (
				<Stack component="ul" sx={{ m: 0, pl: 2 }}>
					{errorMessages.map((message) => (
						<li key={message}>{message}</li>
					))}
				</Stack>
			)}
		</Alert>
	);
};

export default ApiAlert;
