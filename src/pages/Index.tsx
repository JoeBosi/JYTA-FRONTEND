import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { MainScreen } from '@/components/main/MainScreen';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-ios-surface to-ios-surface-secondary flex items-center justify-center">
        <div className="animate-pulse text-ios-label-secondary">Loading...</div>
      </div>
    );
  }

  return user ? <MainScreen /> : <AuthScreen />;
};

export default Index;
