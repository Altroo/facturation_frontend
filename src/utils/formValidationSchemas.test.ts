import {
	loginSchema,
	emailSchema,
	passwordResetConfirmationSchema,
	passwordResetCodeSchema,
	profilSchema,
	changePasswordSchema,
	companySchema,
	userSchema,
} from './formValidationSchemas';

describe('Zod Schema Validation', () => {
	describe('loginSchema', () => {
		it('validates correct input', () => {
			expect(() => loginSchema.parse({ email: 'test@example.com', password: 'password123' })).not.toThrow();
		});

		it('fails with missing password', () => {
			expect(() => loginSchema.parse({ email: 'test@example.com' })).toThrow();
		});
	});

	describe('emailSchema', () => {
		it('validates correct email', () => {
			expect(() => emailSchema.parse({ email: 'user@example.com' })).not.toThrow();
		});

		it('fails with invalid email', () => {
			expect(() => emailSchema.parse({ email: 'not-an-email' })).toThrow();
		});
	});

	describe('passwordResetConfirmationSchema', () => {
		it('validates matching passwords', () => {
			expect(() =>
				passwordResetConfirmationSchema.parse({
					new_password: 'securePass123',
					new_password2: 'securePass123',
				}),
			).not.toThrow();
		});

		it('fails with short password', () => {
			expect(() =>
				passwordResetConfirmationSchema.parse({
					new_password: '123',
					new_password2: '123',
				}),
			).toThrow();
		});
	});

	describe('passwordResetCodeSchema', () => {
		it('validates 4 digits', () => {
			expect(() =>
				passwordResetCodeSchema.parse({
					one: '1',
					two: '2',
					three: '3',
					four: '4',
				}),
			).not.toThrow();
		});

		it('fails with non-digit input', () => {
			expect(() =>
				passwordResetCodeSchema.parse({
					one: 'a',
					two: '2',
					three: '3',
					four: '4',
				}),
			).toThrow();
		});
	});

	describe('profilSchema', () => {
		it('validates minimal profile', () => {
			expect(() =>
				profilSchema.parse({
					first_name: 'Al',
					last_name: 'User',
				}),
			).not.toThrow();
		});

		it('fails with short first name', () => {
			expect(() =>
				profilSchema.parse({
					first_name: 'A',
					last_name: 'User',
				}),
			).toThrow();
		});
	});

	describe('changePasswordSchema', () => {
		it('validates all password fields', () => {
			expect(() =>
				changePasswordSchema.parse({
					old_password: 'oldPass123',
					new_password: 'newPass123',
					new_password2: 'newPass123',
				}),
			).not.toThrow();
		});

		it('fails with empty new password', () => {
			expect(() =>
				changePasswordSchema.parse({
					old_password: 'oldPass123',
					new_password: '',
					new_password2: '',
				}),
			).toThrow();
		});
	});

	describe('companySchema', () => {
		it('validates required fields only', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
				}),
			).not.toThrow();
		});

		it('fails with missing ICE', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					nbr_employe: '10',
				}),
			).toThrow();
		});
	});

	describe('userSchema', () => {
		it('validates required fields', () => {
			expect(() =>
				userSchema.parse({
					first_name: 'Al',
					last_name: 'User',
					email: 'al@example.com',
					gender: 'M',
					is_active: true,
					is_staff: false,
				}),
			).not.toThrow();
		});

		it('fails with invalid email', () => {
			expect(() =>
				userSchema.parse({
					first_name: 'Al',
					last_name: 'User',
					email: 'invalid-email',
					gender: 'M',
					is_active: true,
					is_staff: false,
				}),
			).toThrow();
		});
	});
});
