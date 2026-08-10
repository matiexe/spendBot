'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import UserHeaderBar from '@/components/UserHeaderBar';
import { User } from '@/lib/db';

interface DashboardLayoutShellProps {
  user: User;
  children: React.ReactNode;
}

export default function DashboardLayoutShell({ user, children }: DashboardLayoutShellProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <UserHeaderBar user={user} />
          {children}
        </div>
      </main>
    </div>
  );
}
