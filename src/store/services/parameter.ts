import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import { CitiesClass } from '@/models/Classes';
import type { ApiErrorResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';

export const citiesApi = createApi({
	reducerPath: 'citiesApi',
	tagTypes: ['Cities'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getCitiesList: builder.query<Array<CitiesClass>, { token: string | undefined }>({
			query: ({ token }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_VILLE as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Cities'],
		}),
		getCity: builder.query<CitiesClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_VILLE}/${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Cities'],
		}),
		deleteCity: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_VILLE}/${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			invalidatesTags: ['Cities'],
		}),
		editCity: builder.mutation<
			SuccessResponseType<CitiesClass>,
			{ token: string | undefined; id: number; data: Partial<CitiesClass> }
		>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_VILLE}/${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Cities'],
		}),
		addCity: builder.mutation<
			SuccessResponseType<CitiesClass>,
			{ token: string | undefined; data: Partial<CitiesClass> }
		>({
			query: ({ token, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_VILLE}/`,
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Cities'],
		}),
	}),
});

export const {
	useGetCitiesListQuery,
	useDeleteCityMutation,
	useEditCityMutation,
	useGetCityQuery,
	useAddCityMutation,
} = citiesApi;
