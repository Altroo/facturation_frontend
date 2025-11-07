import axios, { AxiosInstance } from 'axios';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { ApiErrorResponseType } from '@/types/_initTypes';

type NormalizedError = {
	error: {
		status_code: number;
		message: string;
		details: Record<string, string[]>;
	};
};

const isNormalizedError = (err: unknown): err is NormalizedError => {
	return (
		typeof err === 'object' && err !== null && 'error' in err && typeof (err as { error: unknown }).error === 'object'
	);
};

type AxiosBaseQueryArgs<D = unknown, P = unknown> = {
	url: string;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	data?: D;
	params?: P;
};

export const axiosBaseQuery =
	<D = unknown, P = unknown>(
		getInstance: () => AxiosInstance,
	): BaseQueryFn<AxiosBaseQueryArgs<D, P>, unknown, { status: number; data: ApiErrorResponseType }> =>
	async ({ url, method, data, params }) => {
		const instance = getInstance();

		try {
			const response = await instance.request({ url, method, data, params });
			return { data: response.data };
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const status = err.response?.status ?? 0;
				const errorData = (err.response?.data as ApiErrorResponseType) ?? {
					status_code: status,
					message: err.message,
					details: {},
				};
				return { error: { status, data: errorData } };
			}

			if (isNormalizedError(err)) {
				return {
					error: {
						status: err.error.status_code ?? 0,
						data: err.error,
					},
				};
			}

			return {
				error: {
					status: 0,
					data: {
						status_code: 0,
						message: err instanceof Error ? err.message : 'Unknown error',
						details: {},
					},
				},
			};
		}
	};
