
import LoginPageContent from './login-page-content';
import { Locale } from '@/i18n-config';

export default function LoginPage({ params: { lang } }: { params: { lang: Locale }}) {
  return <LoginPageContent />;
}
