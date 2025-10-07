
import LoginPageContent from './login-page-content';
import { Locale } from '@/i18n-config';

export default async function LoginPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return <LoginPageContent />;
}
