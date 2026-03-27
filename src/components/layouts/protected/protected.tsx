import { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { usePermission, useAppSelector } from '@/utils/hooks';
import { getProfilState } from '@/store/selectors';
import NoPermission from '@/components/shared/noPermission/noPermission';

interface ProtectedProps {
	children: ReactNode;
}

export const Protected = (props: ProtectedProps) => {
	const { is_staff } = usePermission();
	const profil = useAppSelector(getProfilState);

	// Wait for profile to load before evaluating permissions
	if (!profil.id) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" py={8}>
				<CircularProgress />
			</Box>
		);
	}

	if (!is_staff) {
		return <NoPermission />;
	}

	return <>{props.children}</>;
};
