import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, ARTICLES_LIST } from '@/utils/routes';
import ArticlesForm from '@/components/pages/dashboard/articles/articles-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Modifier Article',
	description: 'Modifier un article existant',
};
import type { CompanyScopedDetailRouteProps as PageProps } from '@/types/routeTypes';

const ArticleEditPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(ARTICLES_LIST);
	}

	return <ArticlesForm session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default ArticleEditPage;
