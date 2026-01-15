import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
	dir: './',
});

const config: Config = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testEnvironment: 'jest-environment-jsdom',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	transformIgnorePatterns: ['node_modules/(?!(next-auth|@mui|lodash-es)/)'],
	moduleDirectories: ['node_modules', '<rootDir>/'],
	coverageReporters: ['text-summary', 'lcov'],
	coverageProvider: 'v8',
};

export default createJestConfig(config);
