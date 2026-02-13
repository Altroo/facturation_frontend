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
	devisLivraisonFactureLineSchema,
	deviAddSchema,
	factureClientProformaSchema,
	factureClientProformaAddSchema,
	bonDeLivraisonSchema,
	bonDeLivraisonAddSchema,
	reglementSchema,
	monthlyObjectivesSchema,
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
				devisLivraisonFactureLineSchema.parse({
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
				devisLivraisonFactureLineSchema.parse({
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
				devisLivraisonFactureLineSchema.parse({
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
				devisLivraisonFactureLineSchema.parse({
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
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Fixe',
					remise: -1.5,
				}),
			).toThrow();

			// percentage out of bounds
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
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
					numero_part: 'DV100',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).not.toThrow();
		});

		it('accepts optional fields', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_part: 'DV101',
					year_part: '25',
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
					numero_part: 'DV102',
					year_part: '25',
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
					numero_part: 'DV001',
					year_part: '25',
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
					numero_part: 'DV010',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).not.toThrow();
		});

		it('validates when remise_type provided and remise present (top-level and line)', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV012',
					year_part: '25',
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
					numero_part: 'DV011',
					year_part: '25',
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
					numero_part: 'DV013',
					year_part: '25',
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
					numero_part: 'DV002',
					year_part: '25',
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
					numero_part: 'DV003',
					year_part: '25',
					client: 1,
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('accepts missing mode_paiement (optional)', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV004',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('fails with invalid line item (negative quantity)', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV005',
					year_part: '25',
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
					numero_part: 'F001',
					year_part: '25',
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
					numero_part: 'F010',
					year_part: '25',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
				}),
			).not.toThrow();
		});

		it('validates when remise_type provided and remise present (top-level and line)', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_part: 'F012',
					year_part: '25',
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
					numero_part: 'F011',
					year_part: '25',
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
					numero_part: 'F013',
					year_part: '25',
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
					numero_part: 'F002',
					year_part: '25',
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
					numero_part: 'F003',
					year_part: '25',
					client: 1,
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('accepts missing mode_paiement (optional)', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_part: 'F004',
					year_part: '25',
					client: 1,
					date_facture: '2025-12-04',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('fails with invalid line item (negative quantity)', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_part: 'F005',
					year_part: '25',
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
					numero_part: 'FA100',
					year_part: '25',
					client: 1,
					date_facture: '2025-12-04',
				}),
			).not.toThrow();
		});

		it('accepts optional fields', () => {
			expect(() =>
				factureClientProformaAddSchema.parse({
					numero_part: 'FA101',
					year_part: '25',
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
					numero_part: 'FA102',
					year_part: '25',
					date_facture: '2025-12-04',
				}),
			).toThrow();
		});
	});

	// ✅ bonDeLivraisonSchema
	describe('bonDeLivraisonSchema', () => {
		it('validates required fields (with explicit remise)', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL001',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					livre_par: 3,
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
				bonDeLivraisonSchema.parse({
					numero_part: 'BL010',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
				}),
			).not.toThrow();
		});

		it('validates when remise_type provided and remise present (top-level and line)', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL012',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
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
				bonDeLivraisonSchema.parse({
					numero_part: 'BL011',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Pourcentage',
				}),
			).toThrow();
		});

		it('fails when a line has remise_type but missing remise', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL013',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
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
				bonDeLivraisonSchema.parse({
					numero_part: 'BL002',
					year_part: '25',
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('fails with missing numero_bon_livraison', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('fails with missing date_bon_livraison', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL003',
					year_part: '25',
					client: 1,
					mode_paiement: 2,
					remise: 0,
				}),
			).toThrow();
		});

		it('accepts missing mode_paiement and livre_par (optional)', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL004',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('fails with invalid line item (negative quantity)', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL005',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
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

	// ✅ bonDeLivraisonAddSchema
	describe('bonDeLivraisonAddSchema', () => {
		it('validates required fields for adding a bon de livraison', () => {
			expect(() =>
				bonDeLivraisonAddSchema.parse({
					numero_part: 'BLA100',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
				}),
			).not.toThrow();
		});

		it('accepts optional fields', () => {
			expect(() =>
				bonDeLivraisonAddSchema.parse({
					numero_part: 'BLA101',
					year_part: '25',
					client: 2,
					date_bon_livraison: '2025-12-04',
					numero_demande_prix_client: 'REQ123',
					mode_paiement: null,
					livre_par: null,
					remarque: 'note',
				}),
			).not.toThrow();
		});

		it('fails when required fields are missing', () => {
			expect(() =>
				bonDeLivraisonAddSchema.parse({
					client: 1,
					date_bon_livraison: '2025-12-04',
				}),
			).toThrow();

			expect(() =>
				bonDeLivraisonAddSchema.parse({
					numero_part: 'BLA102',
					year_part: '25',
					date_bon_livraison: '2025-12-04',
				}),
			).toThrow();
		});
	});

	// ✅ reglementSchema
	describe('reglementSchema', () => {
		it('validates correct input', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					mode_reglement: 2,
					libelle: 'Paiement',
					montant: 100.5,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).not.toThrow();
		});

		it('validates with minimal required fields', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: 0.01,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).not.toThrow();
		});

		it('accepts null for optional mode_reglement and libelle', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					mode_reglement: null,
					libelle: null,
					montant: 50,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).not.toThrow();
		});

		it('fails with missing facture_client', () => {
			expect(() =>
				reglementSchema.parse({
					montant: 100,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).toThrow();
		});

		it('fails with facture_client = 0 (requiredChoiceNumberField rejects 0)', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 0,
					montant: 100,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).toThrow();
		});

		it('fails with missing montant', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).toThrow();
		});

		it('fails with montant = 0 (below 0.01 minimum)', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: 0,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).toThrow();
		});

		it('fails with empty string montant (preprocessed to NaN)', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: '',
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).toThrow();
		});

		it('converts string montant with comma to number', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: '100,50',
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).not.toThrow();
		});

		it('converts regular string montant to number', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: '50.25',
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).not.toThrow();
		});

		it('fails with null montant (preprocessed to NaN)', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: null,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).toThrow();
		});

		it('fails with undefined montant (preprocessed to NaN)', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: undefined,
					date_reglement: '2025-01-01',
					date_echeance: '2025-02-01',
				}),
			).toThrow();
		});

		it('fails with missing date_reglement', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: 100,
					date_echeance: '2025-02-01',
				}),
			).toThrow();
		});

		it('fails with missing date_echeance', () => {
			expect(() =>
				reglementSchema.parse({
					facture_client: 1,
					montant: 100,
					date_reglement: '2025-01-01',
				}),
			).toThrow();
		});
	});

	// ✅ monthlyObjectivesSchema
	describe('monthlyObjectivesSchema', () => {
		it('validates correct input with all fields', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 10000,
					objectif_ca_eur: 5000,
					objectif_ca_usd: 6000,
					objectif_factures: 20,
					objectif_conversion: 75,
				}),
			).not.toThrow();
		});

		it('validates with minimal required fields', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('accepts null for optional currency fields', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_eur: null,
					objectif_ca_usd: null,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('accepts empty string for optional currency fields (preprocessed to null)', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_eur: '',
					objectif_ca_usd: '',
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('accepts undefined for optional currency fields', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_eur: undefined,
					objectif_ca_usd: undefined,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('converts string objectif_ca with comma to number', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: '1000,50',
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('converts string objectif_ca_eur with comma', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_eur: '500,25',
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('converts string objectif_ca_usd with comma', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_usd: '600,75',
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('converts numeric string objectif_factures', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: '10',
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('converts string objectif_conversion with comma', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5,
					objectif_conversion: '75,5',
				}),
			).not.toThrow();
		});

		it('fails with missing objectif_ca', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with empty string objectif_ca (preprocessed to NaN)', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: '',
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with null objectif_ca (preprocessed to NaN)', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: null,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with negative objectif_ca', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: -100,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with negative objectif_ca_eur', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_eur: -100,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with negative objectif_ca_usd', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_usd: -100,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with missing objectif_factures', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with empty string objectif_factures (preprocessed to NaN)', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: '',
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with non-integer objectif_factures', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5.5,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with negative objectif_factures', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: -1,
					objectif_conversion: 50,
				}),
			).toThrow();
		});

		it('fails with missing objectif_conversion', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5,
				}),
			).toThrow();
		});

		it('fails with empty string objectif_conversion (preprocessed to NaN)', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5,
					objectif_conversion: '',
				}),
			).toThrow();
		});

		it('fails with objectif_conversion > 100', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5,
					objectif_conversion: 150,
				}),
			).toThrow();
		});

		it('fails with negative objectif_conversion', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5,
					objectif_conversion: -10,
				}),
			).toThrow();
		});

		it('accepts objectif_conversion exactly 0', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 0,
					objectif_factures: 0,
					objectif_conversion: 0,
				}),
			).not.toThrow();
		});

		it('accepts objectif_conversion exactly 100', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5,
					objectif_conversion: 100,
				}),
			).not.toThrow();
		});

		it('passes non-string number through preprocess for objectif_ca_eur', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_eur: 500,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('passes non-string number through preprocess for objectif_ca_usd', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_ca_usd: 600,
					objectif_factures: 5,
					objectif_conversion: 50,
				}),
			).not.toThrow();
		});

		it('passes non-string number through preprocess for objectif_conversion', () => {
			expect(() =>
				monthlyObjectivesSchema.parse({
					objectif_ca: 1000,
					objectif_factures: 5,
					objectif_conversion: 75,
				}),
			).not.toThrow();
		});
	});

	// ✅ Additional clientSchema superRefine branch coverage
	describe('clientSchema superRefine branches', () => {
		it('PM: fails when raison_sociale is empty string (trimmed)', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL100',
					client_type: 'PM',
					company: 1,
					raison_sociale: '   ',
					email: 'pm@example.com',
					ville: 5,
					ICE: 'ICE123',
					registre_de_commerce: 'RC123',
					delai_de_paiement: 30,
				}),
			).toThrow();
		});

		it('PM: fails when ville is null', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL101',
					client_type: 'PM',
					company: 1,
					raison_sociale: 'Company',
					email: 'pm@example.com',
					ville: null,
					ICE: 'ICE123',
					registre_de_commerce: 'RC123',
					delai_de_paiement: 30,
				}),
			).toThrow();
		});

		it('PM: fails when ICE is undefined', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL102',
					client_type: 'PM',
					company: 1,
					raison_sociale: 'Company',
					email: 'pm@example.com',
					ville: 5,
					registre_de_commerce: 'RC123',
					delai_de_paiement: 30,
				}),
			).toThrow();
		});

		it('PM: fails when registre_de_commerce is empty string', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL103',
					client_type: 'PM',
					company: 1,
					raison_sociale: 'Company',
					email: 'pm@example.com',
					ville: 5,
					ICE: 'ICE123',
					registre_de_commerce: '',
					delai_de_paiement: 30,
				}),
			).toThrow();
		});

		it('PM: fails when delai_de_paiement is null', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL104',
					client_type: 'PM',
					company: 1,
					raison_sociale: 'Company',
					email: 'pm@example.com',
					ville: 5,
					ICE: 'ICE123',
					registre_de_commerce: 'RC123',
					delai_de_paiement: null,
				}),
			).toThrow();
		});

		it('PP: fails when nom is empty string (trimmed)', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL200',
					client_type: 'PP',
					company: 2,
					email: 'pp@example.com',
					nom: '  ',
					prenom: 'Test',
					adresse: '123 Rue',
					tel: '0600000000',
					delai_de_paiement: 30,
					ville: 7,
				}),
			).toThrow();
		});

		it('PP: fails when prenom is null', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL201',
					client_type: 'PP',
					company: 2,
					email: 'pp@example.com',
					nom: 'Nom',
					prenom: null,
					adresse: '123 Rue',
					tel: '0600000000',
					delai_de_paiement: 30,
					ville: 7,
				}),
			).toThrow();
		});

		it('PP: fails when adresse is undefined', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL202',
					client_type: 'PP',
					company: 2,
					email: 'pp@example.com',
					nom: 'Nom',
					prenom: 'Prenom',
					tel: '0600000000',
					delai_de_paiement: 30,
					ville: 7,
				}),
			).toThrow();
		});

		it('PP: fails when tel is null', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL203',
					client_type: 'PP',
					company: 2,
					email: 'pp@example.com',
					nom: 'Nom',
					prenom: 'Prenom',
					adresse: '123 Rue',
					tel: null,
					delai_de_paiement: 30,
					ville: 7,
				}),
			).toThrow();
		});

		it('PP: fails when ville is null', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL204',
					client_type: 'PP',
					company: 2,
					email: 'pp@example.com',
					nom: 'Nom',
					prenom: 'Prenom',
					adresse: '123 Rue',
					tel: '0600000000',
					delai_de_paiement: 30,
					ville: null,
				}),
			).toThrow();
		});

		it('PP: fails when delai_de_paiement is undefined', () => {
			expect(() =>
				clientSchema.parse({
					code_client: 'CL205',
					client_type: 'PP',
					company: 2,
					email: 'pp@example.com',
					nom: 'Nom',
					prenom: 'Prenom',
					adresse: '123 Rue',
					tel: '0600000000',
					ville: 7,
				}),
			).toThrow();
		});
	});

	// ✅ Additional articleSchema refine branch coverage
	describe('articleSchema refine branches', () => {
		it('passes when both prix_achat and prix_vente are null', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					reference: 'REF100',
					designation: 'Test Product',
					company: 1,
					prix_achat: null,
					prix_vente: null,
				}),
			).not.toThrow();
		});

		it('passes when prix_achat is null (one price missing)', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					reference: 'REF101',
					designation: 'Test Product',
					company: 1,
					prix_achat: null,
					prix_vente: 150,
				}),
			).not.toThrow();
		});

		it('passes when prix_vente is undefined (one price missing)', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					reference: 'REF102',
					designation: 'Test Product',
					company: 1,
					prix_achat: 100,
				}),
			).not.toThrow();
		});

		it('passes when prix_vente > prix_achat', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Service',
					reference: 'REF103',
					designation: 'Test Service',
					company: 1,
					prix_achat: 50,
					prix_vente: 100,
				}),
			).not.toThrow();
		});

		it('fails when prix_vente = prix_achat (not strictly greater)', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					reference: 'REF104',
					designation: 'Test Product',
					company: 1,
					prix_achat: 100,
					prix_vente: 100,
				}),
			).toThrow();
		});

		it('validates tva field as optional number', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					reference: 'REF105',
					designation: 'Test Product',
					company: 1,
					tva: 20,
				}),
			).not.toThrow();
		});

		it('accepts tva as null', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					reference: 'REF106',
					designation: 'Test Product',
					company: 1,
					tva: null,
				}),
			).not.toThrow();
		});

		it('accepts empty string tva (preprocessed to undefined)', () => {
			expect(() =>
				articleSchema.parse({
					type_article: 'Produit',
					reference: 'REF107',
					designation: 'Test Product',
					company: 1,
					tva: '',
				}),
			).not.toThrow();
		});
	});

	// ✅ Additional devisLivraisonFactureLineSchema branch coverage
	describe('devisLivraisonFactureLineSchema superRefine branches', () => {
		it('converts string remise with comma to number', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 2,
					remise_type: 'Fixe',
					remise: '10,5',
				}),
			).not.toThrow();
		});

		it('passes with remise_type null (not treated as hasRemiseType)', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 2,
					remise_type: null,
					remise: 10,
				}),
			).not.toThrow();
		});

		it('passes when both prix_achat and prix_vente are null', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: null,
					prix_vente: null,
					quantity: 1,
					remise: 0,
				}),
			).not.toThrow();
		});

		it('passes when prix_achat is null (one price missing)', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: null,
					prix_vente: 150,
					quantity: 1,
					remise: 0,
				}),
			).not.toThrow();
		});

		it('fails with Fixe remise negative value', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Fixe',
					remise: -5,
				}),
			).toThrow();
		});

		it('passes with Pourcentage remise exactly 0', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Pourcentage',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('passes with Pourcentage remise exactly 100', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Pourcentage',
					remise: 100,
				}),
			).not.toThrow();
		});

		it('passes with Fixe remise exactly 0', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Fixe',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('fails with Pourcentage remise negative', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Pourcentage',
					remise: -10,
				}),
			).toThrow();
		});

		it('passes with remise provided but no remise_type (defaults to Pourcentage check)', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise: 50,
				}),
			).not.toThrow();
		});

		it('fails when remise_type provided and remise is NaN', () => {
			expect(() =>
				devisLivraisonFactureLineSchema.parse({
					article: 1,
					prix_achat: 100,
					prix_vente: 150,
					quantity: 1,
					remise_type: 'Fixe',
					remise: NaN,
				}),
			).toThrow();
		});
	});

	// ✅ Additional deviSchema superRefine branch coverage
	describe('deviSchema superRefine branches', () => {
		it('passes with remise but no remise_type (defaults check)', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV020',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise: 10,
				}),
			).not.toThrow();
		});

		it('fails with Pourcentage remise > 100', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV021',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Pourcentage',
					remise: 150,
				}),
			).toThrow();
		});

		it('fails with Fixe remise negative', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV022',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: -10,
				}),
			).toThrow();
		});

		it('passes with Fixe remise zero', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV023',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: 0,
				}),
			).not.toThrow();
		});

		it('converts string remise with comma', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV024',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: '10,5',
				}),
			).not.toThrow();
		});

		it('fails with remise_type and null remise', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV025',
					year_part: '25',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: null,
				}),
			).toThrow();
		});

		it('fails with invalid year_part (below 20)', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV026',
					year_part: '10',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with invalid year_part (above 99)', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV027',
					year_part: '100',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with empty year_part', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV028',
					year_part: '',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with null year_part', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV029',
					year_part: null,
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with non-integer year_part', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV030',
					year_part: '25.5',
					client: 1,
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with client = empty string (requiredChoiceNumberField)', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV031',
					year_part: '25',
					client: '',
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});

		it('fails with client = 0 (requiredChoiceNumberField)', () => {
			expect(() =>
				deviSchema.parse({
					numero_part: 'DV032',
					year_part: '25',
					client: '0',
					date_devis: '2025-12-04',
					mode_paiement: 2,
				}),
			).toThrow();
		});
	});

	// ✅ Additional factureClientProformaSchema superRefine branch coverage
	describe('factureClientProformaSchema superRefine branches', () => {
		it('passes with Fixe remise valid value', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_part: 'F020',
					year_part: '25',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: 50,
				}),
			).not.toThrow();
		});

		it('fails with Fixe remise negative', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_part: 'F021',
					year_part: '25',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: -5,
				}),
			).toThrow();
		});

		it('fails with Pourcentage remise > 100', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_part: 'F022',
					year_part: '25',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Pourcentage',
					remise: 110,
				}),
			).toThrow();
		});

		it('passes with remise but no remise_type', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_part: 'F023',
					year_part: '25',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise: 10,
				}),
			).not.toThrow();
		});

		it('converts string remise with comma', () => {
			expect(() =>
				factureClientProformaSchema.parse({
					numero_part: 'F024',
					year_part: '25',
					client: 1,
					date_facture: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: '15,5',
				}),
			).not.toThrow();
		});
	});

	// ✅ Additional bonDeLivraisonSchema superRefine branch coverage
	describe('bonDeLivraisonSchema superRefine branches', () => {
		it('passes with Fixe remise valid value', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL020',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: 50,
				}),
			).not.toThrow();
		});

		it('fails with Fixe remise negative', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL021',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: -5,
				}),
			).toThrow();
		});

		it('fails with Pourcentage remise > 100', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL022',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Pourcentage',
					remise: 110,
				}),
			).toThrow();
		});

		it('passes with remise but no remise_type', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL023',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					remise: 10,
				}),
			).not.toThrow();
		});

		it('converts string remise with comma', () => {
			expect(() =>
				bonDeLivraisonSchema.parse({
					numero_part: 'BL024',
					year_part: '25',
					client: 1,
					date_bon_livraison: '2025-12-04',
					mode_paiement: 2,
					remise_type: 'Fixe',
					remise: '15,5',
				}),
			).not.toThrow();
		});
	});

	// ✅ Additional companySchema branch coverage
	describe('companySchema branches', () => {
		it('accepts optional email, phone, fax, site_web fields', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					email: 'company@example.com',
					telephone: '+212600000000',
					fax: '+212500000000',
					site_web: 'https://example.com',
				}),
			).not.toThrow();
		});

		it('accepts empty strings for optional fields (preprocessed to undefined)', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					email: '',
					telephone: '',
					fax: '',
					site_web: '',
				}),
			).not.toThrow();
		});

		it('accepts null for optional fields', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					email: null,
					telephone: null,
					fax: null,
					site_web: null,
				}),
			).not.toThrow();
		});

		it('fails with invalid email format', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					email: 'not-email',
				}),
			).toThrow();
		});

		it('fails with invalid phone format', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					telephone: 'abc',
				}),
			).toThrow();
		});

		it('fails with invalid URL format', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					site_web: 'not-a-url',
				}),
			).toThrow();
		});

		it('accepts managed_by array', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					managed_by: [{ pk: 1, role: 'Admin' }],
				}),
			).not.toThrow();
		});

		it('accepts uses_foreign_currency boolean', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					uses_foreign_currency: true,
				}),
			).not.toThrow();
		});

		it('accepts logo and cachet base64 image fields', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					logo: 'data:image/png;base64,abc123',
					cachet: 'data:image/png;base64,xyz789',
				}),
			).not.toThrow();
		});

		it('accepts logo and cachet URL fields', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					logo: 'https://example.com/logo.png',
					cachet: 'https://example.com/cachet.png',
				}),
			).not.toThrow();
		});

		it('accepts logo as null', () => {
			expect(() =>
				companySchema.parse({
					raison_sociale: 'My Company',
					ICE: '123456',
					nbr_employe: '10',
					logo: null,
					logo_cropped: null,
					cachet: null,
					cachet_cropped: null,
				}),
			).not.toThrow();
		});
	});

	// ✅ Additional userSchema branch coverage
	describe('userSchema branches', () => {
		it('accepts optional companies array', () => {
			expect(() =>
				userSchema.parse({
					first_name: 'Al',
					last_name: 'User',
					email: 'al@example.com',
					gender: 'M',
					is_active: true,
					is_staff: false,
					companies: [
						{ membership_id: 1, company_id: 1, raison_sociale: 'Co', role: 'Admin' },
					],
				}),
			).not.toThrow();
		});

		it('accepts avatar fields', () => {
			expect(() =>
				userSchema.parse({
					first_name: 'Al',
					last_name: 'User',
					email: 'al@example.com',
					gender: 'M',
					is_active: true,
					is_staff: false,
					avatar: 'data:image/png;base64,abc',
					avatar_cropped: 'https://example.com/avatar.png',
				}),
			).not.toThrow();
		});

		it('accepts null avatar fields', () => {
			expect(() =>
				userSchema.parse({
					first_name: 'Al',
					last_name: 'User',
					email: 'al@example.com',
					gender: 'M',
					is_active: true,
					is_staff: false,
					avatar: null,
					avatar_cropped: null,
				}),
			).not.toThrow();
		});

		it('fails with short first_name', () => {
			expect(() =>
				userSchema.parse({
					first_name: 'A',
					last_name: 'User',
					email: 'al@example.com',
					gender: 'M',
					is_active: true,
					is_staff: false,
				}),
			).toThrow();
		});
	});

	// ✅ Additional profilSchema branch coverage
	describe('profilSchema branches', () => {
		it('accepts gender and avatar fields', () => {
			expect(() =>
				profilSchema.parse({
					first_name: 'Al',
					last_name: 'User',
					gender: 'M',
					avatar: 'data:image/png;base64,abc',
					avatar_cropped: 'https://example.com/avatar.png',
				}),
			).not.toThrow();
		});

		it('accepts null avatar fields', () => {
			expect(() =>
				profilSchema.parse({
					first_name: 'Al',
					last_name: 'User',
					avatar: null,
					avatar_cropped: null,
				}),
			).not.toThrow();
		});
	});

	// ✅ Additional deviAddSchema and year_part branch coverage
	describe('deviAddSchema year_part branches', () => {
		it('fails with year_part below 20', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_part: 'DV200',
					year_part: '10',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).toThrow();
		});

		it('fails with year_part above 99', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_part: 'DV201',
					year_part: '100',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).toThrow();
		});

		it('fails with empty year_part (preprocessed to undefined)', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_part: 'DV202',
					year_part: '',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).toThrow();
		});

		it('fails with null year_part (preprocessed to undefined)', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_part: 'DV203',
					year_part: null,
					client: 1,
					date_devis: '2025-12-04',
				}),
			).toThrow();
		});

		it('fails with non-integer year_part', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_part: 'DV204',
					year_part: '25.5',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).toThrow();
		});

		it('accepts valid year_part at boundary 20', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_part: 'DV205',
					year_part: '20',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).not.toThrow();
		});

		it('accepts valid year_part at boundary 99', () => {
			expect(() =>
				deviAddSchema.parse({
					numero_part: 'DV206',
					year_part: '99',
					client: 1,
					date_devis: '2025-12-04',
				}),
			).not.toThrow();
		});
	});

	// ✅ Additional factureClientProformaAddSchema year_part branches
	describe('factureClientProformaAddSchema year_part branches', () => {
		it('fails with invalid year_part', () => {
			expect(() =>
				factureClientProformaAddSchema.parse({
					numero_part: 'FA200',
					year_part: '10',
					client: 1,
					date_facture: '2025-12-04',
				}),
			).toThrow();
		});

		it('fails with empty year_part', () => {
			expect(() =>
				factureClientProformaAddSchema.parse({
					numero_part: 'FA201',
					year_part: '',
					client: 1,
					date_facture: '2025-12-04',
				}),
			).toThrow();
		});
	});

	// ✅ Additional bonDeLivraisonAddSchema year_part branches
	describe('bonDeLivraisonAddSchema year_part branches', () => {
		it('fails with invalid year_part', () => {
			expect(() =>
				bonDeLivraisonAddSchema.parse({
					numero_part: 'BLA200',
					year_part: '10',
					client: 1,
					date_bon_livraison: '2025-12-04',
				}),
			).toThrow();
		});

		it('fails with empty year_part', () => {
			expect(() =>
				bonDeLivraisonAddSchema.parse({
					numero_part: 'BLA201',
					year_part: '',
					client: 1,
					date_bon_livraison: '2025-12-04',
				}),
			).toThrow();
		});

		it('fails with non-integer year_part', () => {
			expect(() =>
				bonDeLivraisonAddSchema.parse({
					numero_part: 'BLA202',
					year_part: '25.5',
					client: 1,
					date_bon_livraison: '2025-12-04',
				}),
			).toThrow();
		});
	});

	// ✅ passwordResetCodeSchema additional branches
	describe('passwordResetCodeSchema additional branches', () => {
		it('fails with multi-digit input', () => {
			expect(() =>
				passwordResetCodeSchema.parse({ one: '12', two: '2', three: '3', four: '4' }),
			).toThrow();
		});

		it('fails with empty string', () => {
			expect(() =>
				passwordResetCodeSchema.parse({ one: '', two: '2', three: '3', four: '4' }),
			).toThrow();
		});
	});

	// ✅ loginSchema additional branches
	describe('loginSchema additional branches', () => {
		it('fails with short password', () => {
			expect(() =>
				loginSchema.parse({ email: 'test@example.com', password: 'short' }),
			).toThrow();
		});

		it('fails with empty email', () => {
			expect(() =>
				loginSchema.parse({ email: '', password: 'password123' }),
			).toThrow();
		});
	});

	// ✅ changePasswordSchema additional branches
	describe('changePasswordSchema additional branches', () => {
		it('fails with short old_password', () => {
			expect(() =>
				changePasswordSchema.parse({
					old_password: 'short',
					new_password: 'newPass123',
					new_password2: 'newPass123',
				}),
			).toThrow();
		});

		it('fails with undefined old_password (preprocessed to empty)', () => {
			expect(() =>
				changePasswordSchema.parse({
					new_password: 'newPass123',
					new_password2: 'newPass123',
				}),
			).toThrow();
		});
	});
});
