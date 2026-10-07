import AiAssistantControl from '@/components/shared/aiAssistantControl/aiAssistantControl';
import { Add, DeleteOutlined } from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import type { LogisticsProposedField } from '@/types/logistiqueTypes';

type Props = {
	stage: string;
	fields: Record<string, LogisticsProposedField>;
	disabled: boolean;
	invalid: boolean;
	onAdd: (stage: string) => void;
	onChange: (id: string, change: Partial<LogisticsProposedField>) => void;
	onRemove: (id: string) => void;
};

const ProposedFields = ({ stage, fields, disabled, invalid, onAdd, onChange, onRemove }: Props) => (
	<Box
		component="section"
		aria-label={stage === 'common' ? 'Nouveaux champs communs' : `Nouveaux champs de l’étape ${stage}`}
		id={`proposals-${stage}`}
		sx={{ mt: 3, scrollMarginTop: 90 }}
	>
		<Stack
			direction={{ xs: 'column', sm: 'row' }}
			spacing={2}
			sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
		>
			<Box>
				<Typography component="h3" variant="h6">
					Un champ manque ?
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Proposez-le ici. Il sera ajouté au module après validation.
				</Typography>
			</Box>
			<Button
				variant="outlined"
				startIcon={<Add />}
				disabled={disabled}
				onClick={() => onAdd(stage)}
				sx={{ flexShrink: 0 }}
			>
				Ajouter un champ
			</Button>
		</Stack>
		{Object.entries(fields)
			.filter(([, field]) => field.stage === stage)
			.map(([id, field], index) => (
				<Box
					key={id}
					data-testid={`proposal-${id}`}
					sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
				>
					<Stack spacing={2}>
						<Typography sx={{ fontWeight: 600 }}>Nouveau champ {index + 1}</Typography>
						<TextField
							label="Nom du champ"
							value={field.name}
							onChange={(event) => onChange(id, { name: event.target.value })}
							disabled={disabled}
							required
							size="small"
							fullWidth
							slotProps={{ htmlInput: { maxLength: 200 } }}
							error={invalid && !field.name.trim()}
							helperText={
								invalid && !field.name.trim() ? 'Donnez un nom à ce champ ou retirez cette proposition.' : undefined
							}
							placeholder="Ex. : Mode de livraison"
						/>
						<AiAssistantControl
							value={field.name}
							onApply={(value) => onChange(id, { name: value })}
							disabled={disabled}
							context="logistics_review"
							maxLength={200}
						/>
						<TextField
							label="Décrivez ce que vous souhaitez"
							value={field.description}
							onChange={(event) => onChange(id, { description: event.target.value })}
							disabled={disabled}
							multiline
							minRows={3}
							size="small"
							fullWidth
							slotProps={{ htmlInput: { maxLength: 2000 } }}
							placeholder="Ex. : Choisir un seul mode de livraison : par bateau, par avion ou par camion. Ce choix doit être obligatoire."
							helperText="Avec vos mots : choisir une seule réponse, cocher plusieurs réponses, sélectionner une date, joindre un document… Précisez les choix possibles et si la réponse est obligatoire. 2 000 caractères maximum."
						/>
						<AiAssistantControl
							value={field.description}
							onApply={(value) => onChange(id, { description: value })}
							disabled={disabled}
							context="logistics_review"
							maxLength={2000}
						/>
						<Button
							color="error"
							startIcon={<DeleteOutlined />}
							onClick={() => onRemove(id)}
							disabled={disabled}
							sx={{ alignSelf: 'flex-start' }}
						>
							Retirer cette proposition
						</Button>
					</Stack>
				</Box>
			))}
	</Box>
);

export default ProposedFields;
