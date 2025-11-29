import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import { CitiesClass, MarqueClass, CategorieClass, UniteClass, EmplacementClass } from '@/models/Classes';
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
		getCitiesList: builder.query<Array<CitiesClass>, string | undefined>({
			query: (token) => ({
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

export const marqueApi = createApi({
	reducerPath: 'marqueApi',
	tagTypes: ['Marque'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getMarqueList: builder.query<Array<MarqueClass>, { token: string | undefined }>({
			query: ({ token }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_MARQUE as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Marque'],
		}),
		getMarque: builder.query<MarqueClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MARQUE}/${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Marque'],
		}),
		deleteMarque: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MARQUE}/${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			invalidatesTags: ['Marque'],
		}),
		editMarque: builder.mutation<
			SuccessResponseType<MarqueClass>,
			{ token: string | undefined; id: number; data: Partial<MarqueClass> }
		>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MARQUE}/${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Marque'],
		}),
		addMarque: builder.mutation<
			SuccessResponseType<MarqueClass>,
			{ token: string | undefined; data: Partial<MarqueClass> }
		>({
			query: ({ token, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MARQUE}/`,
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Marque'],
		}),
	}),
});

export const categorieApi = createApi({
	reducerPath: 'categorieApi',
	tagTypes: ['Categorie'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getCategorieList: builder.query<Array<CategorieClass>, { token: string | undefined }>({
			query: ({ token }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Categorie'],
		}),
		getCategorie: builder.query<CategorieClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE}/${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Categorie'],
		}),
		deleteCategorie: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE}/${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			invalidatesTags: ['Categorie'],
		}),
		editCategorie: builder.mutation<
			SuccessResponseType<CategorieClass>,
			{ token: string | undefined; id: number; data: Partial<CategorieClass> }
		>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE}/${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Categorie'],
		}),
		addCategorie: builder.mutation<
			SuccessResponseType<CategorieClass>,
			{ token: string | undefined; data: Partial<CategorieClass> }
		>({
			query: ({ token, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE}/`,
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Categorie'],
		}),
	}),
});

export const uniteApi = createApi({
	reducerPath: 'uniteApi',
	tagTypes: ['Unite'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getUniteList: builder.query<Array<UniteClass>, { token: string | undefined }>({
			query: ({ token }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_UNITE as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Unite'],
		}),
		getUnite: builder.query<UniteClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_UNITE}/${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Unite'],
		}),
		deleteUnite: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_UNITE}/${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			invalidatesTags: ['Unite'],
		}),
		editUnite: builder.mutation<
			SuccessResponseType<UniteClass>,
			{ token: string | undefined; id: number; data: Partial<UniteClass> }
		>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_UNITE}/${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Unite'],
		}),
		addUnite: builder.mutation<
			SuccessResponseType<UniteClass>,
			{ token: string | undefined; data: Partial<UniteClass> }
		>({
			query: ({ token, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_UNITE}/`,
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Unite'],
		}),
	}),
});

export const emplacementApi = createApi({
	reducerPath: 'emplacementApi',
	tagTypes: ['Emplacement'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getEmplacementList: builder.query<Array<EmplacementClass>, { token: string | undefined }>({
			query: ({ token }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Emplacement'],
		}),
		getEmplacement: builder.query<EmplacementClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT}/${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Emplacement'],
		}),
		deleteEmplacement: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT}/${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			invalidatesTags: ['Emplacement'],
		}),
		editEmplacement: builder.mutation<
			SuccessResponseType<EmplacementClass>,
			{ token: string | undefined; id: number; data: Partial<EmplacementClass> }
		>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT}/${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Emplacement'],
		}),
		addEmplacement: builder.mutation<
			SuccessResponseType<EmplacementClass>,
			{ token: string | undefined; data: Partial<EmplacementClass> }
		>({
			query: ({ token, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT}/`,
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Emplacement'],
		}),
	}),
});

export const {
	useGetMarqueListQuery,
	useDeleteMarqueMutation,
	useEditMarqueMutation,
	useGetMarqueQuery,
	useAddMarqueMutation,
} = marqueApi;

export const {
	useGetCategorieListQuery,
	useDeleteCategorieMutation,
	useEditCategorieMutation,
	useGetCategorieQuery,
	useAddCategorieMutation,
} = categorieApi;

export const {
	useGetUniteListQuery,
	useDeleteUniteMutation,
	useEditUniteMutation,
	useGetUniteQuery,
	useAddUniteMutation,
} = uniteApi;

export const {
	useGetEmplacementListQuery,
	useDeleteEmplacementMutation,
	useEditEmplacementMutation,
	useGetEmplacementQuery,
	useAddEmplacementMutation,
} = emplacementApi;

export const {
	useGetCitiesListQuery,
	useDeleteCityMutation,
	useEditCityMutation,
	useGetCityQuery,
	useAddCityMutation,
} = citiesApi;
