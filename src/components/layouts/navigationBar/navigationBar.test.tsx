import { render, screen } from '@testing-library/react';
import NavigationBar from './navigationBar';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

jest.mock('next/navigation', () => ({
	usePathname: () => '/dashboard',
}));

describe('NavigationBar', () => {
	it('renders title in AppBar', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="Dashboard">
					<div>Content</div>
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
	});

	it('renders children inside Main layout', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="test">
					<div>Page Content</div>
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Page Content')).toBeInTheDocument();
	});
});
