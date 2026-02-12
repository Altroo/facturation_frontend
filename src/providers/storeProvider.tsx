'use client';

import React, { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type SagaStore } from '@/store/store';

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
	const storeRef = useRef<SagaStore | null>(null);
	if (!storeRef.current) {
		storeRef.current = makeStore();
	}
	return <Provider store={storeRef.current}>{children}</Provider>;
};

export default StoreProvider;
