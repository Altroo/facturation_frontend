'use client';

import { useEffect } from 'react';
import { cookiesDeleter } from '@/utils/apiHelpers';

const ClearCookiesClient = () => {
	useEffect(() => {
		cookiesDeleter('/cookies', {
			pass_updated: true,
			new_email: true,
			code: true,
		}).then();
	}, []);

	return null;
};

export default ClearCookiesClient;
