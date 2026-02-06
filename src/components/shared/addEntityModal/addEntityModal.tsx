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
	onSuccess?: (newEntityId: number) => void;
};

const AddEntityModal: React.FC<AddEntityModalProps> = ({ open, setOpen, label, icon, inputTheme, mutationFn, onSuccess }) => {
	const [newName, setNewName] = useState('');
	const [error, setError] = useState<string | null>(null);

	return (
		<Modal 
			open={open} 
			onClose={() => setOpen(false)}
			disableScrollLock={false}
			disableRestoreFocus={true}
			keepMounted={false}
		>
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
					Ajouter un(e) {label}
				</Typography>

				<CustomTextInput
					id={`new_${label}`}
					type="text"
					label={`Nom du ${label}`}
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
								setError(`Le nom du ${label} est requis.`);
								return;
							}
							
							try {
								const result = await mutationFn({ data: { nom: newName.trim() } });
								
								// Check if result contains an error (RTK Query pattern)
								if (result && typeof result === 'object' && 'error' in result) {
									// Handle RTK Query error response
									const payload = result.error as ApiErrorResponseType;
									
									if (payload?.details?.nom) {
										const messages = payload.details.nom;
										const errorMsg = Array.isArray(messages) ? messages[0] : messages;
										setError(errorMsg);
									} else if (payload?.details?.[label]) {
										const messages = payload.details[label];
										const errorMsg = Array.isArray(messages) ? messages[0] : messages;
										setError(errorMsg);
									} else {
										setError(`Erreur lors de l'ajout du ${label}.`);
									}
									// Don't close modal on error
									return;
								}
								
								// Success - close modal and update field
								setOpen(false);
								setNewName('');
								setError(null);
								
								// Extract the ID from the result and call onSuccess if provided
								if (onSuccess && result && typeof result === 'object' && 'data' in result) {
									const responseData = result.data as { id?: number };
									const newId = responseData?.id;
									if (newId) {
										// Use setTimeout to ensure state update happens after modal closes
										setTimeout(() => {
											onSuccess(newId);
										}, 0);
									}
								}
							} catch (e) {
								// Handle thrown exceptions (fallback)
								const payload =
									(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
									(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
									(e as ApiErrorResponseType);

								if (payload?.details?.nom) {
									const messages = payload.details.nom;
									const errorMsg = Array.isArray(messages) ? messages[0] : messages;
									setError(errorMsg);
								} else if (payload?.details?.[label]) {
									const messages = payload.details[label];
									const errorMsg = Array.isArray(messages) ? messages[0] : messages;
									setError(errorMsg);
								} else {
									setError(`Erreur lors de l'ajout du ${label}.`);
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
