import React, { ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/system';
import { customDropdownTheme } from '@/utils/themes';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { Add as AddIcon } from '@mui/icons-material';
import type { DropDownType } from '@/types/accountTypes';
import type { SelectChangeEvent } from '@mui/material/Select';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import { useLanguage } from '@/utils/hooks';

export interface AddManagedBySectionProps {
	title: string;
	isMobile: boolean;
	selectId: string;
	selectLabel: string;
	selectItems: DropDownType[];
	selectValue: DropDownType | null;
	onSelectChange: (event: React.SyntheticEvent, value: DropDownType | null) => void;
	selectIcon: ReactNode;

	roleId: string;
	roleLabel: string;
	roleOptions: { value: string; code: string }[];
	roleValue: string;
	onRoleChange: (event: SelectChangeEvent) => void;
	roleIcon: ReactNode;

	onAdd: () => void;
	isAddDisabled: boolean;
	sx?: SxProps<Theme>;
}

const AddManagedBySection: React.FC<AddManagedBySectionProps> = ({
	title,
	isMobile,
	selectId,
	selectLabel,
	selectItems,
	selectValue,
	onSelectChange,
	selectIcon,
	roleId,
	roleLabel,
	roleOptions,
	roleValue,
	onRoleChange,
	roleIcon,
	onAdd,
	isAddDisabled,
	sx,
}) => {
	const { t } = useLanguage();
	return (
		<Box sx={{ mt: 3, ...sx }}>
			<Typography
				variant="subtitle1"
				gutterBottom
				sx={{
					fontWeight: 600,
				}}
			>
				{title}
			</Typography>
			<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mt: 2 }}>
				<Box sx={{ flex: 1 }}>
					<CustomAutoCompleteSelect
						size="small"
						id={selectId}
						label={selectLabel}
						fullWidth
						noOptionsText={t.common.noResults}
						items={selectItems}
						value={selectValue}
						onChange={onSelectChange}
						theme={customDropdownTheme()}
						startIcon={selectIcon}
					/>
				</Box>
				<Box sx={{ flex: 1 }}>
					<CustomDropDownSelect
						id={roleId}
						size="small"
						label={roleLabel}
						items={roleOptions}
						value={roleValue}
						onChange={onRoleChange}
						theme={customDropdownTheme()}
						startIcon={roleIcon}
					/>
				</Box>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={onAdd}
					disabled={isAddDisabled}
					sx={{ minWidth: 120, height: 'fit-content' }}
				>
					{t.common.add}
				</Button>
			</Stack>
		</Box>
	);
};

export default AddManagedBySection;
