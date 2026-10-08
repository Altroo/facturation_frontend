import { Box, ButtonBase, Stack, Typography } from '@mui/material';
export const CHAT_AI_SHORTCUTS = [
	{
		command: '/voir',
		title: 'Rechercher un document',
		help: 'Décrivez le client, le produit ou la période. Vous choisissez parmi les résultats.',
		example: '/voir devis du client Atlas avec peinture',
		permission: '',
	},
	{
		command: '/factures',
		title: 'Retrouver des factures',
		help: 'Recherchez avec les informations que vous connaissez.',
		example: '/factures du client Atlas en septembre 2026',
		permission: '',
	},
	{
		command: '/clients',
		title: 'Rechercher un client',
		help: 'Utilisez son nom ou sa raison sociale.',
		example: '/clients Atlas',
		permission: '',
	},
	{
		command: '/impayees',
		title: 'Voir les factures impayées',
		help: 'Affiche les factures avec un solde restant, pour la société active.',
		example: '/impayees',
		permission: '',
	},
	{
		command: '/paiements',
		title: 'Voir les derniers règlements',
		help: 'Consultez les paiements validés de la société active.',
		example: '/paiements',
		permission: '',
	},
	{
		command: '/bilan',
		title: 'Consulter une synthèse',
		help: 'Précisez le montant facturé, les encaissements, le solde ou le nombre de factures.',
		example: '/bilan encaissements mois MAD',
		permission: '',
	},
	{
		command: '/pdf',
		title: 'Télécharger un document',
		help: 'Retrouvez le document, puis choisissez le PDF dans les résultats.',
		example: '/pdf facture du client Atlas',
		permission: 'can_print',
	},
	{
		command: '/modifier',
		title: 'Modifier un document',
		help: 'Recherchez puis sélectionnez le document à modifier. Vos droits restent appliqués.',
		example: '/modifier facture du client Atlas',
		permission: 'can_update',
	},
	{
		command: '/supprimer',
		title: 'Supprimer un document',
		help: 'Recherchez, sélectionnez et confirmez le document. Aucune suppression sans confirmation.',
		example: '/supprimer devis du client Atlas',
		permission: 'can_delete',
	},
] as const;
export const ChatAIShortcuts = ({
	draft,
	permissions,
	choose,
}: {
	draft: string;
	permissions: { can_update: boolean; can_delete: boolean; can_print: boolean };
	choose: (value: string) => void;
}) => {
	const command = draft.trim().split(/\s+/)[0].toLowerCase();
	const matches = CHAT_AI_SHORTCUTS.filter(
		(item) =>
			(!item.permission || permissions[item.permission]) &&
			(item.command.startsWith(command) || command === item.command),
	);
	return (
		<Box sx={{ py: 1 }}>
			<Typography variant="subtitle2">Raccourcis de l’assistant</Typography>
			<Typography variant="caption" color="text.secondary">
				Ils indiquent ce que vous voulez faire. Vous pouvez aussi écrire normalement, sans raccourci.
			</Typography>
			<Stack spacing={0.5} sx={{ mt: 1 }}>
				{matches.map((item) => (
					<ButtonBase
						key={item.command}
						onClick={() => choose(item.command + ' ')}
						sx={{
							display: 'block',
							textAlign: 'left',
							p: 1.25,
							borderRadius: 2,
							border: 1,
							borderColor: 'divider',
							'&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							<Box component="code" sx={{ mr: 1, color: 'primary.main' }}>
								{item.command}
							</Box>
							{item.title}
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
							{item.help}
						</Typography>
						<Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
							Exemple : {item.example}
						</Typography>
					</ButtonBase>
				))}
			</Stack>
		</Box>
	);
};
