import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ArticlesListClient from '@/components/pages/dashboard/articles/articlesList';

const ArticlesArchivedListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ArticlesListClient session={session} archived={true} />;
};

export default ArticlesArchivedListPage;
