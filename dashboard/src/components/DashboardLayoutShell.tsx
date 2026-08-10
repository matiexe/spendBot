'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import UserHeaderBar from '@/components/UserHeaderBar';
import OnboardingWizard from '@/components/OnboardingWizard';
import { User } from '@/lib/db';

interface DashboardLayoutShellProps {
  user: User;
  children: React.ReactNode;
}

export default function DashboardLayoutShell({ user, children }: DashboardLayoutShellProps) {
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Si el usuario no está vinculado, no es ADMIN y no cerró explícitamente el onboarding antes
    if (!user.telegram_id && user.rol !== 'ADMIN') {
      const dismissed = localStorage.getItem('spendbot_onboarding_dismissed');
      if (!dismissed) {
        setShowWizard(true);
      }
    }
  }, [user.telegram_id, user.rol]);

  const handleCloseWizard = () => {
    setShowWizard(false);
    localStorage.setItem('spendbot_onboarding_dismissed', 'true');
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="dashboard-container">
          <UserHeaderBar user={user} onOpenOnboarding={() => setShowWizard(true)} />
          {children}
        </div>
      </main>

      {showWizard && user.rol !== 'ADMIN' && (
        <OnboardingWizard user={user} onClose={handleCloseWizard} />
      )}
    </div>
  );
}
