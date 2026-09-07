import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ConsentProvider } from '@/hooks/useConsent';
import { RequireAuth, RequireConsent } from '@/components/RouteGuards';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ConsentPage } from '@/pages/ConsentPage';
import { HomePage } from '@/pages/HomePage';
import { MealPlanPage } from '@/pages/MealPlanPage';
import { DiaryPage } from '@/pages/DiaryPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { ProfilePage } from '@/pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <ConsentProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/consentimento" element={<ConsentPage />} />

            <Route element={<RequireConsent />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/plano" element={<MealPlanPage />} />
                <Route path="/diario" element={<DiaryPage />} />
                <Route path="/evolucao" element={<ProgressPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </ConsentProvider>
    </AuthProvider>
  );
}
