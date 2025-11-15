import React from 'react';
import {
	Box,
	CardContent,
	Chip,
	Divider,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import AddManagedBySection from '../addManagedBySection/addManagedBySection';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import { ManagedByType } from '@/types/companyTypes';
import { UserCompaniesType } from '@/types/usersTypes';

type ManagedByTableSectionProps = {
	title: string;
	icon: React.ReactNode;
	emptyIcon: React.ReactNode;
	emptyMessage: string;
	headers: string[];
	data: (ManagedByType | UserCompaniesType)[];
	isUserTable: boolean;
	currentUserId?: number;
	roleOptions: { value: string; code: string }[];
	onRoleChange: (index: number, newRole: string) => void;
	onDelete: (index: number) => void;
	addSectionProps: React.ComponentProps<typeof AddManagedBySection>;
};

const ManagedByTableSection: React.FC<ManagedByTableSectionProps> = ({
	title,
	icon,
	emptyIcon,
	emptyMessage,
	headers,
	data,
	isUserTable,
	currentUserId,
	roleOptions,
	onRoleChange,
	onDelete,
	addSectionProps,
}) => {
	return (
		<CardContent sx={{ p: 3 }}>
			<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
				{icon}
				<Typography variant="h6" fontWeight={700}>
					{title} {data.length > 0 && `(${data.length})`}
				</Typography>
			</Stack>
			<Divider sx={{ mb: 3 }} />
			<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
				<Table>
					<TableHead sx={{ backgroundColor: 'grey.50' }}>
						<TableRow>
							{headers.map((header, i) => (
								<TableCell key={i} sx={{ fontWeight: 700 }}>
									<Stack direction="row" spacing={1} alignItems="center">
										{i === 0 && icon}
										<span>{header}</span>
									</Stack>
								</TableCell>
							))}
							<TableCell align="right" sx={{ fontWeight: 700 }}>
								Actions
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={headers.length + 1} align="center" sx={{ py: 4 }}>
									<Stack spacing={1} alignItems="center">
										{emptyIcon}
										<Typography variant="body2" color="text.secondary">
											{emptyMessage}
										</Typography>
									</Stack>
								</TableCell>
							</TableRow>
						) : (
							data.map((item, index) => (
								<TableRow
									key={
										isUserTable
											? `user-${(item as ManagedByType).id}-${index}`
											: `company-${(item as UserCompaniesType).company_id}-${index}`
									}
									sx={{ '&:hover': { backgroundColor: 'grey.50' } }}
								>
									<TableCell>
										{isUserTable ? (
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography fontWeight={600}>
													{(item as ManagedByType).first_name} {(item as ManagedByType).last_name}
												</Typography>
												{(item as ManagedByType).id === currentUserId && (
													<Chip label="vous" size="small" color="primary" variant="outlined" />
												)}
											</Stack>
										) : (
											<Typography fontWeight={600}>{(item as UserCompaniesType).raison_sociale}</Typography>
										)}
									</TableCell>
									<TableCell>
										<Box sx={{ maxWidth: 200 }}>
											<CustomDropDownSelect
												id={`role_${index}`}
												label="Rôle"
												value={item.role}
												onChange={(e) => onRoleChange(index, e.target.value)}
												items={roleOptions}
												theme={customDropdownTheme()}
												disabled={isUserTable && (item as ManagedByType).id === currentUserId}
											/>
										</Box>
									</TableCell>
									<TableCell align="right">
										<IconButton
											color="error"
											size="small"
											onClick={() => onDelete(index)}
											disabled={isUserTable && (item as ManagedByType).id === currentUserId}
										>
											<Delete />
										</IconButton>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
			<AddManagedBySection {...addSectionProps} />
		</CardContent>
	);
};

export default ManagedByTableSection;
