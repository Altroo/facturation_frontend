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
	devisLineSchema,
	deviAddSchema,
	factureClientProformaSchema,
	factureClientProformaAddSchema,
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

	// ✅ devisLineSchema
	describe('devisLineSchema', () => {
		it('validates a correct line', () => {
			expect(() =>
				devisLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 2,
					remise_type: 'Fixe',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('fails when prix_vente is less than prix_achat', () => {
			expect(() =>
				devisLineSchema.parse({
					article: 1,
					prix_achat: 200,
					prix_vente: 150,
					quantity: 1,
					remise: 0,
				}),
			).toThrow();
		});

		it('fails with negative quantity', () => {
			expect(() =>
				devisLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: -1,
					remise: 0,
				}),
			).toThrow();
		});

		it('requires remise when remise_type is provided', () => {
			expect(() =>
				devisLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Pourcentage',
				}),
			).toThrow();
		});

		it('fails when remise is non-integer or out of bounds for percentage', () => {
			// non-integer
			expect(() =>
				devisLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Fixe',
					remise: 1.5,
				}),
			).toThrow();

			// percentage out of bounds
			expect(() =>
				devisLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Pourcentage',
					remise: 150,
				}),
			).toThrow();
		});
	});

	// ✅ deviAddSchema
	describe('deviAddSchema', () => {
		it('validates required fields for adding a devis', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_devis: 'DV100',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).not.toThrow();
		});

		it('accepts optional fields', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_devis: 'DV101',
					client: 2,
					date_devis: '2025-12-04',
					numero_demande_prix_client: 'REQ123',
					mode_paiement: null,
					remarque: 'note',
				}),
			).not.toThrow();
		});

		it('fails when required fields are missing', () => {
			expect(() =>
				deviAddSchema.parse({
					client: 1,
					date_devis: '2025-12-04',
				}),
			).toThrow();

			expect(() =>
				deviAddSchema.parse({
					numero_devis: 'DV102',
					date_devis: '2025-12-04',
				}),
			).toThrow();
		});
	});

	// ✅ deviSchema
	describe('deviSchema', () => {
		it('validates required fields (with explicit remise)', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV001',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: 2,
							remise: 0,
						},
					],
				}),
			).not.toThrow();
		});

		it('accepts when remise and remise_type are both omitted', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV010',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).not.toThrow();
		});

		it('validates when remise_type provided and remise present (top-level and line)', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV012',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Pourcentage',
					remise: 10,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: 2,
							remise_type: 'Fixe',
							remise: 5,
						},
					],
				}),
			).not.toThrow();
		});

		it('fails when top-level remise_type is provided but remise is missing', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV011',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Pourcentage',
				}),
			).toThrow();
		});

		it('fails when a line has remise_type but missing remise', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV013',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: 2,
							remise_type: 'Pourcentage',
						},
					],
				}),
			).toThrow();
		});

		it('fails with missing client', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV002',
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('fails with missing numero_devis', () => {
			expect(() =>
				deviSchema.parse({
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('fails with missing date_devis', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV003',
					client: 1,
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('accepts missing mode_paiement (optional)', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV004',
					client: 1,
					date_devis: '2025-12-04',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('fails with invalid line item (negative quantity)', () => {
			expect(() =>
				deviSchema.parse({
					numero_devis: 'DV005',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: -1,
							remise: 0,
						},
					],
				}),
			).toThrow();
		});
	});

	// ✅ factureClientProformaSchema
	describe('factureClientProformaSchema', () => {
		it('validates required fields (with explicit remise)', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F001',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: 2,
							remise: 0,
						},
					],
				}),
			).not.toThrow();
		});

		it('accepts when remise and remise_type are both omitted', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F010',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
				}),
			).not.toThrow();
		});

		it('validates when remise_type provided and remise present (top-level and line)', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F012',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Pourcentage',
					remise: 10,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: 2,
							remise_type: 'Fixe',
							remise: 5,
						},
					],
				}),
			).not.toThrow();
		});

		it('fails when top-level remise_type is provided but remise is missing', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F011',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Pourcentage',
				}),
			).toThrow();
		});

		it('fails when a line has remise_type but missing remise', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F013',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: 2,
							remise_type: 'Pourcentage',
						},
					],
				}),
			).toThrow();
		});

		it('fails with missing client', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F002',
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('fails with missing numero_facture', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('fails with missing date_facture', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F003',
					client: 1,
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('accepts missing mode_paiement (optional)', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F004',
					client: 1,
					date_facture: '2025-12-04',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('fails with invalid line item (negative quantity)', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_facture: 'F005',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
					lignes: [
						{
							article: 1,
							prix_achat: 100,
							prix_vente: 150,
							quantity: -1,
							remise: 0,
						},
					],
				}),
			).toThrow();
		});
	});

	// ✅ factureClientProformaAddSchema
	describe('factureClientProformaAddSchema', () => {
		it('validates required fields for adding a facture proforma', () => {
			expect(() =>
				factureClientProformaAddSchema.parse({
					numero_facture: 'FA100',
					client: 1,
					date_facture: '2025-12-04',
				}),
			).not.toThrow();
		});

		it('accepts optional fields', () => {
			expect(() =>
				factureClientProformaAddSchema.parse({
					numero_facture: 'FA101',
					client: 2,
					date_facture: '2025-12-04',
					numero_bon_commande_client: 'BC123',
					mode_paiement: null,
					remarque: 'note',
				}),
			).not.toThrow();
		});

		it('fails when required fields are missing', () => {
			expect(() =>
				factureClientProformaAddSchema.parse({
					client: 1,
					date_facture: '2025-12-04',
				}),
			).toThrow();

			expect(() =>
				factureClientProformaAddSchema.parse({
					numero_facture: 'FA102',
					date_facture: '2025-12-04',
				}),
			).toThrow();
		});
	});
});
