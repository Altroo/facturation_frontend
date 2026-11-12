'use client';

import { useState } from 'react';
import { Public } from '@mui/icons-material';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import EntityCrudControls from '@/components/shared/entityCrudControls/entityCrudControls';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import {
	useGetLogisticsParameterListQuery,
	useAddLogisticsParameterMutation,
	useEditLogisticsParameterMutation,
	useDeleteLogisticsParameterMutation,
} from '@/store/services/parameter';
import { textInputTheme } from '@/utils/themes';
import { useLanguage } from '@/utils/hooks';
import type { LogisticsParameter, LogistiqueParameterSelectProps } from '@/types/parameterTypes';

const inputTheme = textInputTheme();
const labels = {
	incoterm: 'Incoterm',
	origine_marchandise: 'Origine de la marchandise',
	nature_marchandise: 'Nature de la marchandise',
};

export default function LogistiqueParameterSelect({
	kind,
	companyId,
	value,
	recordId,
	onChange,
	onBlur,
	error,
	disabled,
}: LogistiqueParameterSelectProps) {
	const { t } = useLanguage();
	const token = useInitAccessToken();
	const { currentData: terms = [], isFetching } = useGetLogisticsParameterListQuery(
		{ kind, company_id: companyId },
		{ skip: !token || !companyId },
	);
	const { data: memberships = [] } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const canManage = memberships.some(
		(membership) => membership.id === companyId && ['Caissier', 'Logistique'].includes(membership.role),
	);
	const [add] = useAddLogisticsParameterMutation();
	const [edit] = useEditLogisticsParameterMutation();
	const [remove] = useDeleteLogisticsParameterMutation();
	const [saved, setSaved] = useState<(LogisticsParameter & { kind: string }) | null>(null);
	const optimistic = saved?.company === companyId && saved.kind === kind ? saved : null;
	const rows = optimistic ? [...terms.filter((term) => term.id !== optimistic.id), optimistic] : terms;
	const selected =
		rows.find((term) => term.nom === value) ?? (recordId ? rows.find((term) => term.id === recordId) : undefined);
	const selectedItem = selected ? { value: String(selected.id), code: selected.nom } : null;
	const items = rows.map((term) => ({ value: String(term.id), code: term.nom }));
	const displayItem = selectedItem ?? (value ? { value: `saved:${value}`, code: value } : null);
	if (displayItem && !items.some((item) => item.value === displayItem.value)) items.push(displayItem);
	const controls = canManage ? (
		<EntityCrudControls
			label={labels[kind]}
			icon={<Public fontSize="small" />}
			inputTheme={inputTheme}
			selectedItem={selectedItem}
			disabled={disabled}
			addEntity={async ({ data }) => {
				const term = await add({ kind, data: { ...data, company: companyId } }).unwrap();
				setSaved({ ...term, kind });
				onChange(term.nom);
				return { data: term };
			}}
			editEntity={async ({ id, data }) => {
				const term = await edit({ kind, id, data: { ...data, company: companyId } }).unwrap();
				setSaved({ ...term, kind });
				onChange(term.nom);
				return { data: term };
			}}
			deleteEntity={async ({ id }) => remove({ kind, id }).unwrap()}
			onAddSuccess={() => undefined}
			onDeleteSuccess={() => {
				setSaved(null);
				onChange('');
			}}
		/>
	) : undefined;
	return (
		<CustomAutoCompleteSelect
			id={kind}
			label={labels[kind]}
			items={items}
			value={displayItem}
			noOptionsText={t.common.noOptions}
			onChange={(_, item) => onChange(item?.code ?? '')}
			onBlur={onBlur}
			loading={isFetching}
			error={!!error}
			helperText={error}
			disabled={disabled}
			theme={inputTheme}
			fullWidth
			size="small"
			required={kind === 'incoterm'}
			startIcon={<Public fontSize="small" />}
			endIcon={controls}
		/>
	);
}
