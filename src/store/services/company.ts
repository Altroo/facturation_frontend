import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { store } from '@/store/store';
import { getInitStateToken } from '@/store/selectors';
import { CompanyClass } from '@/models/Classes';
import { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';

export const companyApi = createApi({
	reducerPath: 'companyApi',
	baseQuery: axiosBaseQuery(() => {
		// pass function which will be used by the interceptor to read the latest token from redux
		return isAuthenticatedInstance(() => getInitStateToken(store.getState()));
	}),
	endpoints: (builder) => ({
		getCompaniesList: builder.query<
			PaginationResponseType<CompanyClass>,
			{ token: string | undefined; page: number; pageSize: number; search?: string }
		>({
			query: ({ token, page, pageSize }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_LIST}?page=${page}&page_size=${pageSize}`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		getCompany: builder.query<CompanyClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		deleteCompany: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		editCompany: builder.mutation<
			SuccessResponseType<CompanyClass>,
			{ token: string | undefined; id: number; data: Partial<CompanyClass> }
		>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
		}),
	}),
});

export const { useGetCompaniesListQuery, useDeleteCompanyMutation, useEditCompanyMutation, useGetCompanyQuery } =
	companyApi;
