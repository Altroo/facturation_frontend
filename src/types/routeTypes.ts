import type { ReactNode } from 'react';

export interface EntryPointProps {
	children: ReactNode;
}

export type IdNumberRouteProps = { params: Promise<{ id: string }> };
export type StockDetailRouteProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id?: string }>;
};
export type OptionalCompanyRouteProps = { searchParams: Promise<{ company_id?: string }> };
export type StockNewRouteProps = { searchParams: Promise<{ company_id?: string; balance_id?: string }> };
export type CompanyScopedDetailRouteProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};
export type CompanyScopedNewRouteProps = { searchParams: Promise<{ company_id: string }> };
export type CompanyScopedEditRouteProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};
export type ReglementNewRouteProps = {
	searchParams: Promise<{ company_id: string; facture_client_id?: string }>;
};
