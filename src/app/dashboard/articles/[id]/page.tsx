import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, CLIENTS_LIST } from '@/utils/routes';
import ArticlesViewClient from '@/components/pages/dashboard/articles/articlesView';

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ company_id: string }>;
};

const ArticlesViewPage = async (props: PageProps) => {
	const session = await auth();
	const { params, searchParams } = props;
	const { id } = await params;
	const { company_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || !company_id || isNaN(Number(company_id))) {
		redirect(CLIENTS_LIST);
	}

	return <ArticlesViewClient session={session} id={Number(id)} company_id={Number(company_id)} />;
};

export default ArticlesViewPage;
