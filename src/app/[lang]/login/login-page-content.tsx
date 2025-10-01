
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrentUser, allMockUsers } from '@/hooks/use-current-user';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';


export default function LoginPageContent() {
  const { dict } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'en';


  useEffect(() => {
    if (!isLoading && isAuthenticated) {
        router.replace(`/${lang}/dashboard`);
    }
  }, [isLoading, isAuthenticated, router, lang]);

  const handleLogin = () => {
    const user = allMockUsers.find(u => u.email === email);
    if (user && password === 'mini123') {
        login(user);
        router.push(`/${lang}/dashboard`);
    } else {
        alert('Invalid credentials. Use a mock user email and the password "mini123".');
    }
  };
  
  const handleTestLogin = (userType: 'admin' | 'worker' | 'tenant') => {
    // Find the first user of the specified role
    const user = allMockUsers.find(u => u.role === userType);
    if (user) {
        login(user);
        router.push(`/${lang}/dashboard`);
    }
  }
  
  if (isLoading || (!isLoading && isAuthenticated)) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full h-14 w-14 mb-4">
                 <Building className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{dict.login.title}</h1>
            <p className="text-muted-foreground mt-1">{dict.login.description}</p>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{dict.login.cardTitle}</CardTitle>
            <CardDescription>{dict.login.cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {e.preventDefault(); handleLogin();}}>
                <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">{dict.login.emailLabel}</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder={dict.login.emailPlaceholder}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">{dict.login.passwordLabel}</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                </div>
                <Button type="submit" className="w-full mt-2">
                    {dict.login.loginButton}
                </Button>
                </div>
            </form>
          </CardContent>
        </Card>
        <Card className="mt-4">
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground text-center">
                   {dict.login.testUsers}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleTestLogin('admin')}>Admin</Button>
                    <Button variant="outline" size="sm" onClick={() => handleTestLogin('worker')}>Worker</Button>
                    <Button variant="outline" size="sm" onClick={() => handleTestLogin('tenant')}>Tenant</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
