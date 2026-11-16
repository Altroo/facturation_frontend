'use client';

import { useSyncExternalStore } from 'react';
import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import { getPendingPdfRequests, getServerPendingPdfRequests, subscribePdfRequests } from '@/utils/apiHelpers';
import { useLanguage } from '@/utils/hooks';

export default function PdfLoadingIndicator() {
	const pending = useSyncExternalStore(subscribePdfRequests, getPendingPdfRequests, getServerPendingPdfRequests);
	const { t } = useLanguage();
	if (!pending) return null;
	return (
		<Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: 'var(--app-text, #0D070B)' }}>
			<Stack role="status" aria-live="polite" aria-busy="true" spacing={2} sx={{ alignItems: 'center', bgcolor: 'var(--app-surface, #FFFFFF)', borderRadius: 2, p: 3 }}>
				<CircularProgress color="inherit" aria-label={t.pdf.preparingPdf} />
				<Typography>{t.pdf.preparingPdf}</Typography>
			</Stack>
		</Backdrop>
	);
}
