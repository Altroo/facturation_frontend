import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

type Action = {
	active: boolean;
	text: string;
	onClick: () => void;
};

type Props = {
	title: string;
	actions: Action[];
	actionsStyle?: string[];
	body?: string;
	children?: React.ReactNode;
};

const ActionModals: React.FC<Props> = ({ title, actions, actionsStyle, body, children }) => {
	return (
		<Dialog open onClose={() => {}}>
			<DialogTitle>{title}</DialogTitle>

			<DialogContent dividers>
				{body && <Typography variant="body2">{body}</Typography>}
				{children}
			</DialogContent>

			<DialogActions className={actionsStyle?.join(' ') ?? undefined} sx={{ padding: 2 }}>
				{actions.map((action, index) => (
					<Button
						key={index}
						variant={action.active ? 'contained' : 'outlined'}
						onClick={action.onClick}
						sx={{
							backgroundColor: action.active ? '#0D070B' : '#FFFFFF',
							color: action.active ? '#FFFFFF' : '#0D070B',
							'&:hover': {
								backgroundColor: action.active ? '#0D070B' : '#F5F5F5',
							},
						}}
					>
						{action.text}
					</Button>
				))}
			</DialogActions>
		</Dialog>
	);
};

export default ActionModals;
