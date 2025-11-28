import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TreePine,
  Users,
  BarChart3,
  Menu,
  X,
  Trees,
  LogOut,
  Gamepad2,
} from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { supabase } from '@shared/services/supabase';

const profileLinks = [
  { to: '/', label: 'Logout', icon: LogOut },
];

const links = [
  { to: '/admin/dashboard', label: 'Tree Management', icon: TreePine },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/maps', label: 'Maps', icon: Gamepad2 },
  // { to: '/admin/anti-cheat', label: 'Anti-Cheat', icon: ShieldCheck },
  // { to: '/admin/moderation', label: 'Moderation', icon: Gavel },
  { to: '/admin/analytics', label: 'Reports', icon: BarChart3 },
  // { to: '/admin/audit-log', label: 'Audit Log', icon: FileText },
];

const AdminNavbar = () => {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string }>({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const updateHeight = () => {
      setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    if (!mediaQuery.matches) return;

    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = 'hidden';

    return () => {
      style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    let isMounted = true;

    const resolveUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) return session.user;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    };

    const loadProfile = async () => {
      const user = await resolveUser();

      if (!isMounted) return;

      if (!user) {
        setProfile({ name: '', email: '' });
        setProfileLoading(false);
        return;
      }

      const fallbackName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.user_metadata?.display_name ??
        user.user_metadata?.preferred_username ??
        user.email ??
        'Admin';
      const fallbackEmail = user.email ?? '';

      const { data } = await supabase
        .from('profiles')
        .select('full_name, name, display_name, email')
        .eq('id', user.id)
        .single();

      if (!isMounted) return;

      setProfile({
        name: data?.full_name ?? data?.name ?? data?.display_name ?? fallbackName,
        email: data?.email ?? fallbackEmail,
      });
      setProfileLoading(false);
    };

    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    // Clear Supabase session then local storage, finally redirect to login.
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('scanCount');
    window.location.href = '/login/admin';
  };

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-100 border-b border-gray-200 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-2">
          <div className="flex items-center gap-2">
            <Trees strokeWidth={2.5} className="h-5 w-5 text-brand-600" />
            <h1 className="text-lg font-medium text-gray-900">Admin Panel</h1>
          </div>

          <div className='flex flex-row space-x-6'>            
            <nav className="hidden items-center gap-2 lg:flex">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition',
                      isActive ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-200'
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className='relative hidden lg:block'>
              <div 
              className='flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white hover:cursor-pointer'
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              >
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </div>
              {profileMenuOpen && (
                <div className='absolute right-0 top-11 z-30 w-64 rounded-xl border border-gray-300 bg-white shadow-xl'>
                  <div className='flex flex-col font-medium text-sm px-5 py-2 mt-2'>
                    <span className='whitespace-nowrap text-gray-900'>
                      {profileLoading ? 'Loading...' : profile.name || 'User'}
                    </span>
                    <span className='whitespace-nowrap text-gray-500'>
                      {profile.email || (profileLoading ? '' : 'Email not available')}
                    </span>
                  </div>
                  <div className='flex flex-col px-2 mb-3'>
                    <button className='flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900'>
                      Dashboard
                    </button>
                    <button className='flex w-full flex-1 items-center gap-2 rounded-lg px-3 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900'>
                      Account Settings
                    </button>
                    <button className='flex w-full flex-1 items-center gap-2 rounded-lg px-3 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 '>
                      Moderation
                    </button>
                  </div>
                  <div className='p-2 border-t border-gray-300'>
                    <div 
                      className='flex items-center p-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg'
                      onClick={handleLogout} 
                    >
                      <div className='flex w-full flex-1 items-center gap-2 rounded-lg text-sm'>
                        Logout
                      </div>
                      <LogOut className='h-4 w-4' />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Toggle navigation"
            className="inline-flex p-2 items-center justify-center rounded-full border border-gray-300 text-gray-600 lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>
      {open && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
            style={{ top: headerHeight }}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl bg-white p-5 lg:hidden"
            style={{ top: headerHeight }}
          >
            <nav className="flex flex-col gap-2">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition',
                      isActive
                        ? 'border-brand-200 bg-brand-100 text-brand-700'
                        : 'text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
              <div className='border-t border-gray-300'>
                {profileLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={handleLogout}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition',
                        isActive
                          ? 'border-brand-200 bg-brand-100 text-brand-700'
                          : 'text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default AdminNavbar;
