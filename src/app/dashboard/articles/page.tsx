import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ArticlesListClient from '@/components/pages/dashboard/articles/articles-list';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Liste des articles',
	description: 'Liste des articles',
};

const ArticlesListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ArticlesListClient session={session} archived={false} />;
};

export default ArticlesListPage;
