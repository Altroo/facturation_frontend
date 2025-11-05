import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { store } from '@/store/store';
import { getInitStateToken } from '@/store/selectors';
import { CompanyClass } from '@/models/Classes';
import { PaginationResponseType } from '@/types/_init/_initTypes';

export const companyApi = createApi({
	reducerPath: 'companyApi',
	baseQuery: axiosBaseQuery(() => {
		// pass function which will be used by the interceptor to read the latest token from redux
		return isAuthenticatedInstance(() => getInitStateToken(store.getState()));
	}),
	endpoints: (builder) => ({
		getCompaniesList: builder.query<PaginationResponseType<CompanyClass>, string | undefined>({
			query: (token) => ({
				url: process.env.NEXT_PUBLIC_COMPANY_LIST as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
	}),
});

export const { useGetCompaniesListQuery } = companyApi;
