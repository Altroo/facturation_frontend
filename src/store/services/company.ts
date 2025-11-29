import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import { CompanyClass } from '@/models/Classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import { CompaniesUserCompaniesType } from '@/types/companyTypes';

export const companyApi = createApi({
	reducerPath: 'companyApi',
	tagTypes: ['Company'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getCompaniesList: builder.query<
			Array<Partial<CompanyClass>> | PaginationResponseType<CompanyClass>,
			{ token: string | undefined; with_pagination?: boolean; page?: number; pageSize?: number; search?: string }
		>({
			query: ({ token, with_pagination, page, pageSize, search }) => ({
				url: with_pagination
					? `${process.env.NEXT_PUBLIC_COMPANY_LIST}?search=${search}&page=${page}&page_size=${pageSize}`
					: (process.env.NEXT_PUBLIC_COMPANY_LIST as string),
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				params: with_pagination ? { pagination: true } : undefined,
			}),
			providesTags: ['Company'],
		}),
		getUserCompanies: builder.query<Array<CompaniesUserCompaniesType>, string | undefined>({
			query: (token) => ({
				url: process.env.NEXT_PUBLIC_USER_COMPANIES_LIST as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Company'],
		}),
		getCompany: builder.query<CompanyClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Company'],
		}),
		deleteCompany: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			invalidatesTags: ['Company'],
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
			invalidatesTags: ['Company'],
		}),
		addCompany: builder.mutation<
			SuccessResponseType<CompanyClass>,
			{ token: string | undefined; data: Partial<CompanyClass> }
		>({
			query: ({ token, data }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/`,
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Company'],
		}),
	}),
});

export const {
	useGetCompaniesListQuery,
	useDeleteCompanyMutation,
	useEditCompanyMutation,
	useGetCompanyQuery,
	useAddCompanyMutation,
	useGetUserCompaniesQuery,
} = companyApi;
