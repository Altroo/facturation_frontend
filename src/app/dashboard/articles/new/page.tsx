import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, ARTICLES_LIST } from '@/utils/routes';
import ArticlesForm from '@/components/pages/dashboard/articles/articles-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Nouvel Article',
	description: 'Créer un nouvel article',
};

type PageProps = {
	searchParams: Promise<{ company_id: string }>;
};

const ArticleNewCompanyIDPage = async (props: PageProps) => {
	const session = await auth();
	const { searchParams } = props;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!company_id || isNaN(Number(company_id))) {
		redirect(ARTICLES_LIST);
	}

	return <ArticlesForm session={session} company_id={Number(company_id)} />;
};

export default ArticleNewCompanyIDPage;
