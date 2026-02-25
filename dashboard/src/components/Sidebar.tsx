'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Settings, Wallet } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        {
            name: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            href: '/',
        },
        {
            name: 'Transacciones',
            icon: <ArrowLeftRight size={20} />,
            href: '/transactions',
        },
        {
            name: 'Configuración',
            icon: <Settings size={20} />,
            href: '#',
        },
    ];

    return (
        <aside className="sidebar glass-panel">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <Wallet size={24} />
                </div>
                <h2>SpendBot</h2>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-text">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <style jsx>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          border-radius: 0;
          border-left: none;
          border-top: none;
          border-bottom: none;
          background: rgba(15, 16, 21, 0.6);
          backdrop-filter: blur(20px);
          z-index: 10;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 3rem;
          padding-left: 0.5rem;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 15px var(--primary-glow);
        }

        .sidebar-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.025em;
        }

        .sidebar-nav ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          border-radius: 10px;
          color: #8892b0;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          color: #eef2ff;
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-item.active {
          color: #fff;
          background: rgba(99, 102, 241, 0.15);
          position: relative;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 60%;
          width: 4px;
          background: var(--primary);
          border-radius: 0 4px 4px 0;
        }

        .nav-icon {
          display: flex;
          align-items: center;
        }

        /* Mobile adaptation could be added here for a robust UI */
        @media (max-width: 768px) {
          .sidebar {
            display: none; /* In a full app we'd toggle a mobile menu */
          }
        }
      `}</style>
        </aside>
    );
}
