import { jest } from '@jest/globals';

type MockState = { value: number };

const mockDispatch = jest.fn();
const mockUseDispatch = () => mockDispatch;
const mockSelector = <TSelected>(selector: (state: MockState) => TSelected): TSelected => selector({ value: 42 });

beforeEach(() => {
	jest.clearAllMocks();
	jest.resetModules();

	jest.doMock('react-redux', () => {
		// cast to a plain object so TypeScript allows spreading
		const real = jest.requireActual('react-redux') as unknown as Record<string, unknown>;
		return {
			...real,
			useDispatch: mockUseDispatch,
			useSelector: mockSelector,
		};
	});
});

afterEach(() => {
	jest.dontMock('react-redux');
});

describe('useAppDispatch / useAppSelector', () => {
	it('useAppDispatch returns react-redux dispatch', () => {
		// require AFTER mocking so module picks up the mocked react-redux
		// use relative path to your hooks file (include ./ and correct filename)
		// adjust './hooks' to the real relative path if different (e.g. '../hooks' or './hooks.ts')
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { useAppDispatch } = require('./hooks');

		const dispatch = useAppDispatch();
		expect(dispatch).toBe(mockDispatch);

		dispatch('ACTION');
		expect(mockDispatch).toHaveBeenCalledWith('ACTION');
	});

	it('useAppSelector proxies to react-redux useSelector', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { useAppSelector } = require('./hooks');

		const result = useAppSelector((state: MockState) => state.value);
		expect(result).toBe(42);
	});
});
