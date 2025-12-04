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
	articleSchema,
	deviSchema,
} from './formValidationSchemas';

describe('Zod Schema Validation', () => {
	// ✅ loginSchema
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

	// ✅ emailSchema
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

	// ✅ passwordResetConfirmationSchema
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
		it('accepts different new_password values (no match enforcement)', () => {
			expect(() =>
				passwordResetConfirmationSchema.parse({
					new_password: 'securePass123',
					new_password2: 'differentPass',
				}),
			).not.toThrow();
		});
	});

	// ✅ passwordResetCodeSchema
	describe('passwordResetCodeSchema', () => {
		it('validates 4 digits', () => {
			expect(() => passwordResetCodeSchema.parse({ one: '1', two: '2', three: '3', four: '4' })).not.toThrow();
		});
		it('fails with non-digit input', () => {
			expect(() => passwordResetCodeSchema.parse({ one: 'a', two: '2', three: '3', four: '4' })).toThrow();
		});
		it('fails with missing digit', () => {
			expect(() => passwordResetCodeSchema.parse({ one: '1', two: '2', three: '3' })).toThrow();
		});
	});

	// ✅ profilSchema
	describe('profilSchema', () => {
		it('validates minimal profile', () => {
			expect(() => profilSchema.parse({ first_name: 'Al', last_name: 'User' })).not.toThrow();
		});
		it('fails with short first name', () => {
			expect(() => profilSchema.parse({ first_name: 'A', last_name: 'User' })).toThrow();
		});
		it('fails with missing last name', () => {
			expect(() => profilSchema.parse({ first_name: 'Al' })).toThrow();
		});
	});

	// ✅ changePasswordSchema
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

	// ✅ companySchema
	describe('companySchema', () => {
		it('validates required fields only', () => {
			expect(() =>
				companySchema.parse({ raison_sociale: 'My Company', ICE: '123456', nbr_employe: '10' }),
			).not.toThrow();
		});
		it('fails with missing ICE', () => {
			expect(() => companySchema.parse({ raison_sociale: 'My Company', nbr_employe: '10' })).toThrow();
		});
		it('fails with missing raison_sociale', () => {
			expect(() => companySchema.parse({ ICE: '123456', nbr_employe: '10' })).toThrow();
		});
	});

	// ✅ userSchema
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

	// ✅ clientSchema
	describe('clientSchema', () => {
		describe('PM', () => {
			it('validates required PM fields', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL001',
						client_type: 'PM',
						company: 1,
						raison_sociale: 'Client Co',
						email: 'client@example.com',
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
					}),
				).toThrow();
			});
		});
		describe('PP', () => {
			it('validates required PP fields', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL002',
						client_type: 'PP',
						company: 2,
						email: 'pp@example.com',
						nom: 'ClientNom',
						prenom: 'ClientPrenom',
						adresse: '123 Rue',
						tel: '0600000000',
						delai_de_paiement: 30,
						ville: 7,
					}),
				).not.toThrow();
			});
			it('fails with missing PP identity', () => {
				expect(() =>
					clientSchema.parse({
						code_client: 'CL003',
						client_type: 'PP',
						company: 3,
						email: 'pp2@example.com',
					}),
				).toThrow();
			});
		});
	});

	// ✅ articleSchema
	describe('articleSchema', () => {
		it('validates required fields', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					reference: 'REF001',
					designation: 'Produit Test',
					company: 1,
				}),
			).not.toThrow();
		});
		it('fails with missing reference', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					designation: 'Produit Test',
					company: 1,
				}),
			).toThrow();
		});
	});

	// ✅ deviSchema
	describe('deviSchema', () => {
		it('validates required fields', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV001',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: 2,
							pourcentage_remise: 0,
						},
					],
				}),
			).not.toThrow();
		});

		it('fails with missing client', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV002',
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with missing numero_devis', () => {
			expect(() =>
				deviSchema.parse({
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with missing date_devis', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV003',
					client: 1,
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with missing mode_paiement', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV004',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).toThrow();
		});

		it('fails with invalid line item (negative quantity)', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV005',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: -1,
							pourcentage_remise: 0,
						},
					],
				}),
			).toThrow();
		});
	});
});
