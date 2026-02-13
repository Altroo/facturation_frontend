'use client';

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type SagaStore } from '@/store/store';

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
	// Use lazy initialization with useState to avoid accessing refs during render
	const [store] = useState<SagaStore>(() => makeStore());
	return <Provider store={store}>{children}</Provider>;
};

export default StoreProvider;
