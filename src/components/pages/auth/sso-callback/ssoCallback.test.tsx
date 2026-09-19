import { render, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SSOCallbackClient from './ssoCallback';

jest.mock('next-auth/react', () => ({
	__esModule: true,
	signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	__esModule: true,
	useRouter: jest.fn(),
	useSearchParams: jest.fn(),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div>SSO_CALLBACK_LOADING</div>,
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN: '/login',
	DASHBOARD: '/dashboard',
}));

const mockSignIn = jest.mocked(signIn);
const mockUseRouter = jest.mocked(useRouter);
const mockUseSearchParams = jest.mocked(useSearchParams);
const mockReplace = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	mockUseRouter.mockReturnValue({
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		push: jest.fn(),
		replace: mockReplace,
		prefetch: jest.fn(),
		bfcacheId: 'test-bfcache',
	});
	mockUseSearchParams.mockReturnValue(new URLSearchParams('code=abc') as ReturnType<typeof useSearchParams>);
});

describe('SSOCallbackClient', () => {
	it('exchanges the SSO code and redirects to the dashboard', async () => {
		mockSignIn.mockResolvedValueOnce({
			error: undefined,
			code: undefined,
			status: 200,
			ok: true,
			url: null,
		});

		render(<SSOCallbackClient />);

		await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('sso-code', { code: 'abc', redirect: false }));
		expect(mockReplace).toHaveBeenCalledWith('/dashboard');
	});

	it('redirects to login when the SSO code is missing', async () => {
		mockUseSearchParams.mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);

		render(<SSOCallbackClient />);

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login?error=SSOCodeMissing'));
		expect(mockSignIn).not.toHaveBeenCalled();
	});

	it('redirects to login when the SSO exchange fails', async () => {
		mockSignIn.mockResolvedValueOnce({
			error: 'AccessDenied',
			code: 'AccessDenied',
			status: 401,
			ok: false,
			url: null,
		});

		render(<SSOCallbackClient />);

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login?error=SSOFailed'));
		expect(mockReplace).not.toHaveBeenCalledWith('/dashboard');
	});
});
