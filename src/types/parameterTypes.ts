export type LogisticsParameterKind = 'incoterm' | 'origine_marchandise' | 'nature_marchandise';
export type LogisticsParameter = { id: number; nom: string; company: number };
export type LogistiqueParameterSelectProps = {
	kind: LogisticsParameterKind;
	companyId: number;
	value: string;
	recordId?: number | null;
	onChange: (value: string) => void;
	onBlur?: () => void;
	error?: string;
	disabled?: boolean;
};
