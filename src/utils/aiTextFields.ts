// Only reviewed writing fields get AI. Unknown fields stay unchanged by default.
const writingFields = new Set([
	'designation',
	'remarque',
	'description',
	'nature_marchandise',
	'process_remark',
	'conditions_paiement_proforma',
	'notes_ecarts_proforma',
	'commentaire_paiement',
	'reject_note',
	'libelle',
	'observations',
	'termes_paiement',
	'reason',
	'note',
]);

export const isAiTextField = (name: string, type: string) =>
	(type === 'text' || type === 'textarea') && writingFields.has(name);
