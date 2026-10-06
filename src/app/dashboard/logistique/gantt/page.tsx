import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LogistiqueGantt from '@/components/pages/dashboard/logistique/gantt-review/logistique-gantt';

export const metadata: Metadata = {
	title: 'Gantt logistique - Revue des champs',
	description: 'Revue temporaire du parcours logistique et de ses champs',
};

// Temporary review: remove this route, gantt-review/, public/logistique-review/,
// LOGISTIQUE_GANTT and its navigation entry after business approval.
const LogistiqueGanttPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <LogistiqueGantt session={session} />;
};

export default LogistiqueGanttPage;
