import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ArticlesListClient from '@/components/pages/dashboard/articles/articles-list';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Articles Archivés',
	description: 'Liste des articles archivés',
};

const ArticlesArchivedListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ArticlesListClient session={session} archived={true} />;
};

export default ArticlesArchivedListPage;
