import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { CompanyClass } from '@/models/Classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { CompaniesUserCompaniesType } from '@/types/companyTypes';

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
			{ with_pagination?: boolean; page?: number; pageSize?: number; search?: string }
		>({
			query: ({ with_pagination, page, pageSize, search }) => ({
				url: with_pagination
					? `${process.env.NEXT_PUBLIC_COMPANY_LIST}?search=${search}&page=${page}&page_size=${pageSize}`
					: (process.env.NEXT_PUBLIC_COMPANY_LIST as string),
				method: 'GET',
				params: with_pagination ? { pagination: true } : undefined,
			}),
			providesTags: ['Company'],
		}),
		getUserCompanies: builder.query<Array<CompaniesUserCompaniesType>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_USER_COMPANIES_LIST as string,
				method: 'GET',
			}),
			providesTags: ['Company'],
		}),
		getCompany: builder.query<CompanyClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['Company'],
		}),
		deleteCompany: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Company'],
		}),
		editCompany: builder.mutation<SuccessResponseType<CompanyClass>, { id: number; data: Partial<CompanyClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Company'],
		}),
		addCompany: builder.mutation<SuccessResponseType<CompanyClass>, { data: Partial<CompanyClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_COMPANY_ROOT}/`,
				method: 'POST',
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
