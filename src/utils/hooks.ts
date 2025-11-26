import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

import { getProfilState } from '@/store/selectors';

export const usePermission = () => {
	const { is_staff } = useAppSelector(getProfilState);
	return { is_staff };
};
