import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type {
	CitiesClass,
	MarqueClass,
	CategorieClass,
	UniteClass,
	EmplacementClass,
	ModePaiementClass,
	LivreParClass,
} from '@/models/classes';
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
		getCitiesList: builder.query<Array<CitiesClass>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_VILLE,
				method: 'GET',
			}),
			providesTags: ['Cities'],
		}),
		getCity: builder.query<CitiesClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_VILLE}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Cities'],
		}),
		deleteCity: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_VILLE}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Cities'],
		}),
		editCity: builder.mutation<SuccessResponseType<CitiesClass>, { id: number; data: Partial<CitiesClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_VILLE}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Cities'],
		}),
		addCity: builder.mutation<SuccessResponseType<CitiesClass>, { data: Partial<CitiesClass> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_VILLE,
				method: 'POST',
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
		getMarqueList: builder.query<Array<MarqueClass>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_MARQUE,
				method: 'GET',
			}),
			providesTags: ['Marque'],
		}),
		getMarque: builder.query<MarqueClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MARQUE}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Marque'],
		}),
		deleteMarque: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MARQUE}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Marque'],
		}),
		editMarque: builder.mutation<SuccessResponseType<MarqueClass>, { id: number; data: Partial<MarqueClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MARQUE}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Marque'],
		}),
		addMarque: builder.mutation<SuccessResponseType<MarqueClass>, { data: Partial<MarqueClass> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_MARQUE,
				method: 'POST',
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
		getCategorieList: builder.query<Array<CategorieClass>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE,
				method: 'GET',
			}),
			providesTags: ['Categorie'],
		}),
		getCategorie: builder.query<CategorieClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Categorie'],
		}),
		deleteCategorie: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Categorie'],
		}),
		editCategorie: builder.mutation<SuccessResponseType<CategorieClass>, { id: number; data: Partial<CategorieClass> }>(
			{
				query: ({ id, data }) => ({
					url: `${process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE}${id}/`,
					method: 'PUT',
					data,
				}),
				invalidatesTags: ['Categorie'],
			},
		),
		addCategorie: builder.mutation<SuccessResponseType<CategorieClass>, { data: Partial<CategorieClass> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_CATEGORIE,
				method: 'POST',
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
		getUniteList: builder.query<Array<UniteClass>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_UNITE,
				method: 'GET',
			}),
			providesTags: ['Unite'],
		}),
		getUnite: builder.query<UniteClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_UNITE}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Unite'],
		}),
		deleteUnite: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_UNITE}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Unite'],
		}),
		editUnite: builder.mutation<SuccessResponseType<UniteClass>, { id: number; data: Partial<UniteClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_UNITE}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Unite'],
		}),
		addUnite: builder.mutation<SuccessResponseType<UniteClass>, { data: Partial<UniteClass> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_UNITE,
				method: 'POST',
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
		getEmplacementList: builder.query<Array<EmplacementClass>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT,
				method: 'GET',
			}),
			providesTags: ['Emplacement'],
		}),
		getEmplacement: builder.query<EmplacementClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Emplacement'],
		}),
		deleteEmplacement: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Emplacement'],
		}),
		editEmplacement: builder.mutation<
			SuccessResponseType<EmplacementClass>,
			{ id: number; data: Partial<EmplacementClass> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Emplacement'],
		}),
		addEmplacement: builder.mutation<SuccessResponseType<EmplacementClass>, { data: Partial<EmplacementClass> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_EMPLACEMENT,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Emplacement'],
		}),
	}),
});

export const modePaiementApi = createApi({
	reducerPath: 'modePaiementApi',
	tagTypes: ['ModePaiement'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getModePaiementList: builder.query<Array<ModePaiementClass>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_MODE_PAIEMENT,
				method: 'GET',
			}),
			providesTags: ['ModePaiement'],
		}),
		getModePaiement: builder.query<ModePaiementClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MODE_PAIEMENT}${id}/`,
				method: 'GET',
			}),
			providesTags: ['ModePaiement'],
		}),
		deleteModePaiement: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MODE_PAIEMENT}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['ModePaiement'],
		}),
		editModePaiement: builder.mutation<
			SuccessResponseType<ModePaiementClass>,
			{ id: number; data: Partial<ModePaiementClass> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_MODE_PAIEMENT}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['ModePaiement'],
		}),
		addModePaiement: builder.mutation<SuccessResponseType<ModePaiementClass>, { data: Partial<ModePaiementClass> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_MODE_PAIEMENT,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['ModePaiement'],
		}),
	}),
});

export const livreParApi = createApi({
	reducerPath: 'livreParApi',
	tagTypes: ['LivrePar'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getLivreParList: builder.query<Array<LivreParClass>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_LIVRE_PAR,
				method: 'GET',
			}),
			providesTags: ['LivrePar'],
		}),
		getLivrePar: builder.query<LivreParClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_LIVRE_PAR}${id}/`,
				method: 'GET',
			}),
			providesTags: ['LivrePar'],
		}),
		deleteLivrePar: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_LIVRE_PAR}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['LivrePar'],
		}),
		editLivrePar: builder.mutation<SuccessResponseType<LivreParClass>, { id: number; data: Partial<LivreParClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PARAMETER_LIVRE_PAR}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['LivrePar'],
		}),
		addLivrePar: builder.mutation<SuccessResponseType<LivreParClass>, { data: Partial<LivreParClass> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PARAMETER_LIVRE_PAR,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['LivrePar'],
		}),
	}),
});

export const {
	useGetModePaiementListQuery,
	useDeleteModePaiementMutation,
	useEditModePaiementMutation,
	useGetModePaiementQuery,
	useAddModePaiementMutation,
} = modePaiementApi;

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

export const {
	useGetLivreParListQuery,
	useDeleteLivreParMutation,
	useEditLivreParMutation,
	useGetLivreParQuery,
	useAddLivreParMutation,
} = livreParApi;
