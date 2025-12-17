import React, { useState } from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import type { ApiErrorResponseType } from '@/types/_initTypes';
import type { Theme } from '@mui/material/styles';

type AddEntityModalProps = {
	open: boolean;
	setOpen: (val: boolean) => void;
	label: string;
	icon: React.ReactNode;
	inputTheme: Theme;
	mutationFn: (args: { data: { nom: string } }) => Promise<unknown>;
};

const AddEntityModal: React.FC<AddEntityModalProps> = ({ open, setOpen, label, icon, inputTheme, mutationFn }) => {
	const [newName, setNewName] = useState('');
	const [error, setError] = useState<string | null>(null);

	return (
		<Modal open={open} onClose={() => setOpen(false)}>
			<Box
				sx={{
					p: 3,
					bgcolor: 'background.paper',
					borderRadius: 2,
					maxWidth: 420,
					width: '90%',
					mx: 'auto',
					mt: '15vh',
					boxShadow: 24,
				}}
			>
				<Typography variant="h6" mb={2}>
					Ajouter une {label}
				</Typography>

				<CustomTextInput
					id={`new_${label}`}
					type="text"
					label={`Nom de la ${label}`}
					value={newName}
					onChange={(e) => {
						setNewName(e.target.value);
						if (error) setError(null);
					}}
					error={Boolean(error)}
					helperText={error ?? ''}
					fullWidth={true}
					size="small"
					theme={inputTheme}
					startIcon={icon}
				/>

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
					<Button onClick={() => setOpen(false)}>Annuler</Button>
					<Button
						variant="contained"
						onClick={async () => {
							if (!newName.trim()) {
								setError(`Le nom de la ${label} est requis.`);
								return;
							}
							try {
								await mutationFn({ data: { nom: newName.trim() } });
								setOpen(false);
								setNewName('');
								setError(null);
							} catch (e) {
								const payload =
									(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
									(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
									(e as ApiErrorResponseType);

								if (payload?.details?.[label]) {
									const messages = payload.details[label];
									const errorMsg = Array.isArray(messages) ? messages[0] : messages;
									setError(errorMsg);
								} else {
									setError(`Erreur lors de l’ajout de la ${label}.`);
								}
							}
						}}
					>
						Ajouter
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export default AddEntityModal;
