import React, { CSSProperties } from 'react';
import { Alert } from '@mui/material';

type Props = {
	errorDetails?: Record<string, string[]> | { error: string[] } | null;
	cssStyle?: CSSProperties;
	children?: React.ReactNode;
};

const ApiAlert: React.FC<Props> = (props: Props) => {
	const errorDetails = props.errorDetails;
	const errorMessage: Array<Record<string, Array<string>>> = [];

	if (errorDetails) {
		if ('error' in errorDetails) {
			errorMessage.push({ error: errorDetails.error });
		} else if (typeof errorDetails === 'object') {
			const errorResult: Record<string, Array<string>> = {};
			for (const [key, value] of Object.entries(errorDetails)) {
				value.map((singleError) => {
					errorResult[key].push(singleError);
				});
				errorMessage.push(errorResult);
			}
		}
	}

	return (
		<Alert severity="error" sx={props.cssStyle}>
			{errorMessage.map((error) => {
				return Object.keys(error).map((k) => {
					return `${k} : ${error[k]}`;
				});
			})}
		</Alert>
	);
};

export default ApiAlert;
