import { type ReactNode, Suspense } from 'react';
import { ChatAIAssistant } from '@/components/chat-ai/ChatAIAssistant';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
	return <section>{children}{process.env.NEXT_PUBLIC_CHAT_AI_ASSISTANT_ENABLED === 'true' && <Suspense fallback={null}><ChatAIAssistant /></Suspense>}</section>;
};

export default DashboardLayout;
