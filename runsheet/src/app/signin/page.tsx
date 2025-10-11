'use client';

import { useRouter } from 'next/navigation';
import SignIn from '../../components/SignIn';

export default function SignInPage() {
  const router = useRouter();

  const handleSignIn = (email: string, password: string) => {
    // Mock authentication - in real app, this would call an API
    if (email === 'admin@runsheet.com' && password === 'demo123') {
      // Store auth state (in real app, use proper auth tokens)
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      
      // Redirect to main dashboard
      router.push('/');
    } else {
      // This error will be handled by the SignIn component
      throw new Error('Invalid credentials');
    }
  };

  return <SignIn onSignIn={handleSignIn} />;
}