import type { JSX } from 'react';
import { BiQrScan } from 'react-icons/bi';
import { useLocation, useNavigate } from 'react-router-dom';

import home from '@assets/home.svg';
import homeActive from '@assets/homeActive.svg';
import user from '@assets/user.svg';
import userActive from '@assets/userActive.svg';

type Tab = {
  path: string;
  label: string;
  icon: (isActive: boolean) => JSX.Element;
};

const tabs: Tab[] = [
  {
    path: '/main',
    label: 'Home',
    icon: (isActive: boolean) => (
      <img
        className="w-6"
        src={isActive ? homeActive : home}
        alt={isActive ? 'Beranda aktif' : 'Beranda'}
        draggable={false}
      />
    ),
  },
  {
    path: '/profile',
    label: 'Stats',
    icon: (isActive: boolean) => (
      <img
        className="w-7"
        src={isActive ? userActive : user}
        alt={isActive ? 'Profil aktif' : 'Profil'}
        draggable={false}
      />
    ),
  },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const floatingButtonPosition =
    location.pathname === '/scan' ? 'bg-gradient-to-b from-brand-500 to-brand-700 bottom-5 shadow-lg' : 'bg-gradient-to-b from-brand-500 to-brand-700 bottom-3';

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/scan')}
        className={`fixed left-1/2 z-30 flex h-18 w-18 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-100 ease-in-out ${floatingButtonPosition}`}
        aria-label="Scan QR"
      >
        <BiQrScan className="text-3xl" />
      </button>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-geist-50 backdrop-blur">
        <div className="grid grid-cols-2 gap-14 px-2 pb-safe">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                type="button"
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center rounded-lg py-3 text-xs ${
                  isActive ? 'text-brand-600' : 'text-gray-600'
                }`}
                aria-label={tab.label}
              >
                <div className="text-3xl">{tab.icon(isActive)}</div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNav;
