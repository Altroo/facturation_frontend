import SSOCallbackClient from '@/components/pages/auth/sso-callback/ssoCallback';
import SSOCallbackPage from './page';

jest.mock('@/components/pages/auth/sso-callback/ssoCallback', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

describe('SSOCallbackPage server component', () => {
	it('renders the SSO callback client component', () => {
		const result = SSOCallbackPage();

		expect(result).toMatchObject({
			type: SSOCallbackClient,
			props: {},
		});
	});
});
