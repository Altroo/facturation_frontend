import {
	loginSchema,
	emailSchema,
	passwordResetConfirmationSchema,
	passwordResetCodeSchema,
	profilSchema,
	changePasswordSchema,
	companySchema,
	userSchema,
	clientSchema,
} from './formValidationSchemas';

describe('Zod Schema Validation', () => {
	describe('loginSchema', () => {
		it('validates correct input', () => {
			expect(() => loginSchema.parse({ email: 'test@example.com', password: 'password123' })).not.toThrow();
		});

		it('fails with missing password', () => {
			expect(() => loginSchema.parse({ email: 'test@example.com' })).toThrow();
		});

		it('fails with invalid email format', () => {
			expect(() => loginSchema.parse({ email: 'bad-email', password: 'password123' })).toThrow();
		});
	});

	describe('emailSchema', () => {
		it('validates correct email', () => {
			expect(() => emailSchema.parse({ email: 'user@example.com' })).not.toThrow();
		});

		it('fails with invalid email', () => {
			expect(() => emailSchema.parse({ email: 'not-an-email' })).toThrow();
		});

		it('fails with missing email', () => {
			expect(() => emailSchema.parse({})).toThrow();
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

		it('validates when passwords are different (no match enforcement)', () => {
			expect(() =>
				passwordResetConfirmationSchema.parse({
					new_password: 'securePass123',
					new_password2: 'differentPass',
				}),
			).not.toThrow();
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

		it('fails with missing digit', () => {
			expect(() =>
				passwordResetCodeSchema.parse({
					one: '1',
					two: '2',
					three: '3',
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

		// Only test missing fields if schema requires them
		it('fails with missing last name', () => {
			expect(() =>
				profilSchema.parse({
					first_name: 'Al',
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

		it('accepts different new_password values (no match enforcement)', () => {
			expect(() =>
				changePasswordSchema.parse({
					old_password: 'oldPass123',
					new_password: 'newPass123',
					new_password2: 'differentPass',
				}),
			).not.toThrow();
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

		it('fails with missing raison_sociale', () => {
			expect(() =>
				companySchema.parse({
					ICE: '123456',
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

		it('fails with missing first_name', () => {
			expect(() =>
				userSchema.parse({
					last_name: 'User',
					email: 'al@example.com',
					gender: 'M',
					is_active: true,
					is_staff: false,
				}),
			).toThrow();
		});

		it('fails with missing last_name', () => {
			expect(() =>
				userSchema.parse({
					first_name: 'Al',
					email: 'al@example.com',
					gender: 'M',
					is_active: true,
					is_staff: false,
				}),
			).toThrow();
		});
	});
	describe('clientSchema', () => {
		describe('client_type = PM (personne morale)', () => {
			it('validates required PM fields', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL001',
						client_type: 'PM',
						company: 1,
						raison_sociale: 'Client Co',
						email: 'client@example.com',
						archived: false,
						// PM-specific required fields
						ville: 5,
						ICE: 'ICE123',
						registre_de_commerce: 'RC123',
						delai_de_paiement: 30,
					}),
				).not.toThrow();
			});

			it('fails when PM required fields are missing', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL001',
						client_type: 'PM',
						company: 1,
						raison_sociale: 'Client Co',
						email: 'client@example.com',
						archived: false,
						// Missing: ville, ICE, registre_de_commerce, delai_de_paiement
					}),
				).toThrow();
			});

			it('fails with invalid email for PM', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL001',
						client_type: 'PM',
						company: 1,
						raison_sociale: 'Client Co',
						email: 'not-an-email',
						archived: false,
						ville: 5,
						ICE: 'ICE123',
						registre_de_commerce: 'RC123',
						delai_de_paiement: 30,
					}),
				).toThrow();
			});
		});

		describe('client_type = PP (personne physique)', () => {
			it('validates required PP fields', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL002',
						client_type: 'PP',
						company: 2,
						email: 'pp@example.com',
						archived: false,
						// PP identity
						nom: 'ClientNom',
						prenom: 'ClientPrenom',
						// Required contact and payment
						adresse: '123 Rue',
						tel: '0600000000',
						delai_de_paiement: 30,
						// If ville is required for PP, include it:
						ville: 7,
					}),
				).not.toThrow();
			});

			it('fails with missing PP identity when required', () => {
				// Only keep this test if your schema requires nom/prenom for PP.
				expect(() =>
					clientSchema.parse({
						code_client: 'CL003',
						client_type: 'PP',
						company: 3,
						email: 'pp2@example.com',
						archived: false,
						// Missing nom/prenom (adjust if they are optional in your schema)
					}),
				).toThrow();
			});

			it('fails with invalid email for PP', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL004',
						client_type: 'PP',
						company: 4,
						email: 'bad-email',
						archived: true,
						nom: 'ClientNom',
						prenom: 'ClientPrenom',
						ville: 9,
					}),
				).toThrow();
			});
		});

		describe('common required fields', () => {
			it('fails with missing code_client', () => {
				expect(() =>
					clientSchema.parse({
						client_type: 'PM',
						company: 1,
						email: 'client@example.com',
						archived: false,
						ville: 5,
						ICE: 'ICE123',
						registre_de_commerce: 'RC123',
						delai_de_paiement: 30,
					}),
				).toThrow();
			});

			it('fails with missing company', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL005',
						client_type: 'PM',
						email: 'client@example.com',
						archived: false,
						ville: 5,
						ICE: 'ICE123',
						registre_de_commerce: 'RC123',
						delai_de_paiement: 30,
					}),
				).toThrow();
			});

			it('fails with invalid client_type value', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL006',
						client_type: 'XYZ', // invalid
						company: 6,
						email: 'client@example.com',
						archived: false,
					}),
				).toThrow();
			});
		});
	});
});
