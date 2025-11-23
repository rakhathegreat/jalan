import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { EllipsisVertical, ListFilter, Plus, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@shared/lib/cn';
import { supabase } from '@shared/services/supabase';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PaginationComponent } from '../components/PaginationComponent';

type UserStatus = 'active' | 'suspended' | 'pending';
type UserRole = 'admin' | 'user';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  status?: UserStatus | null;
  role?: string | null;
  raw_user_meta_data: Record<string, unknown> | null;
  raw_app_meta_data: Record<string, unknown> | null;
  last_sign_in_at: string | null;
  created_at: string | null;
};

const statusFilterOptions: Array<{ value: UserStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

const roleFilterOptions: Array<{ value: UserRole | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

const roleBadgeStyles: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: 'Admin',
    className: 'border-brand-300 bg-brand-100 text-brand-700',
  },
  user: {
    label: 'User',
    className: 'border-gray-300 bg-gray-100 text-gray-700',
  },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const getMetaString = (payload?: Record<string, unknown> | null, key?: string) => {
  if (!payload || !key) return undefined;
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
};

const getMetaBoolean = (payload?: Record<string, unknown> | null, key?: string) => {
  if (!payload || !key) return undefined;
  const value = payload[key];
  return typeof value === 'boolean' ? value : undefined;
};

const ensureUserRole = (value?: string | null): UserRole => {
  if (value === 'admin' || value === 'user') {
    return value;
  }
  return 'user';
};

const deriveProfileName = (profile: ProfileRow) => {
  const meta = profile.raw_user_meta_data ?? {};
  const candidates = [
    getMetaString(meta, 'full_name'),
    getMetaString(meta, 'name'),
    getMetaString(meta, 'display_name'),
    getMetaString(meta, 'username'),
    profile.email,
  ];
  const resolved = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return typeof resolved === 'string' ? resolved : 'Unknown user';
};

const deriveProfileRole = (profile: ProfileRow): UserRole => {
  const candidate =
    getMetaString(profile.raw_user_meta_data, 'role') ??
    getMetaString(profile.raw_app_meta_data, 'role') ??
    profile.role;
  return ensureUserRole(candidate);
};

const deriveProfileStatus = (profile: ProfileRow): UserStatus => {
  if (profile.status === 'active' || profile.status === 'pending' || profile.status === 'suspended') {
    return profile.status;
  }
  const statusCandidate =
    getMetaString(profile.raw_app_meta_data, 'status') ??
    getMetaString(profile.raw_user_meta_data, 'status');
  if (statusCandidate === 'active' || statusCandidate === 'pending' || statusCandidate === 'suspended') {
    return statusCandidate;
  }

  const suspendedFlag =
    getMetaBoolean(profile.raw_app_meta_data, 'suspended') ??
    getMetaBoolean(profile.raw_user_meta_data, 'suspended');
  if (suspendedFlag) return 'suspended';

  const pendingFlag =
    getMetaBoolean(profile.raw_app_meta_data, 'pending') ??
    getMetaBoolean(profile.raw_user_meta_data, 'pending');
  if (pendingFlag) return 'pending';

  return 'active';
};

const mapProfileToRow = (profile: ProfileRow): UserRow => ({
  id: profile.id,
  name: deriveProfileName(profile),
  email: profile.email ?? '—',
  role: deriveProfileRole(profile),
  status: deriveProfileStatus(profile),
  lastActive: profile.last_sign_in_at ?? profile.created_at ?? new Date().toISOString(),
});

const UserManagement = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [pendingStatusFilter, setPendingStatusFilter] = useState<UserStatus | 'all'>('all');
  const [pendingRoleFilter, setPendingRoleFilter] = useState<UserRole | 'all'>('all');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleDialogUser, setRoleDialogUser] = useState<UserRow | null>(null);
  const [roleSelection, setRoleSelection] = useState<UserRole | ''>('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleDialogError, setRoleDialogError] = useState<string | null>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [bulkSuspending, setBulkSuspending] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<UserRow | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<{ name: string; email: string; password: string; role: UserRole }>({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  useBodyScrollLock(!isDesktop && filterMenuOpen);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredUsers = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        term.length === 0 ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [debouncedSearch, roleFilter, statusFilter, users]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filteredUsers.some((user) => user.id === id)));
  }, [filteredUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, roleFilter]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    const total = filteredUsers.length;
    const selected = selectedIds.length;
    selectAllRef.current.indeterminate = selected > 0 && selected < total;
  }, [filteredUsers.length, selectedIds]);

  useEffect(() => {
    const closeMenu = () => {
      setBulkMenuOpen(false);
    };
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  useEffect(() => {
    if (!filterMenuOpen) return;
    setPendingStatusFilter(statusFilter);
    setPendingRoleFilter(roleFilter);
  }, [filterMenuOpen, roleFilter, statusFilter]);

  useEffect(() => {
    if (!filterMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (filterMenuRef.current?.contains(event.target as Node)) return;
      setFilterMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [filterMenuOpen]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from('profiles')
      .select(
        'id, email, role, status, raw_user_meta_data, raw_app_meta_data, last_sign_in_at, created_at'
      )
      .order('created_at', { ascending: true });

    if (supabaseError) {
      console.error('Failed to fetch profiles', supabaseError.message);
      setError(supabaseError.message);
      setUsers([]);
      setLoading(false);
      return;
    }

    const mapped = (data as ProfileRow[] | null)?.map(mapProfileToRow) ?? [];

    setUsers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredUsers.map((user) => user.id));
  };

  const hasSelection = selectedIds.length > 0;
  const hasActiveFilters = statusFilter !== 'all' || roleFilter !== 'all';
  const selectedRows = users.filter((user) => selectedIds.includes(user.id));
  const allSelectedSuspended =
    selectedRows.length > 0 && selectedRows.every((user) => user.status === 'suspended');
  const bulkActionLabel = allSelectedSuspended ? 'Reinstate selected' : 'Suspend selected';
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(filteredUsers.length, pageStart + pageSize);
  const paginatedUsers = filteredUsers.slice(pageStart, pageEnd);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetPendingFilters = () => {
    setPendingStatusFilter('all');
    setPendingRoleFilter('all');
  };

  const applyFilters = () => {
    setStatusFilter(pendingStatusFilter);
    setRoleFilter(pendingRoleFilter);
    setFilterMenuOpen(false);
  };

  const handleOpenRoleDialog = (user: UserRow) => {
    setRoleDialogUser(user);
    setRoleSelection(user.role);
    setRoleDialogError(null);
    setShowRoleDialog(true);
  };

  const handleOpenSuspendDialog = (user: UserRow) => {
    setStatusActionError(null);
    setSuspendTarget(user);
    setShowSuspendDialog(true);
  };

  const handleRoleDialogOpenChange = (open: boolean) => {
    setShowRoleDialog(open);
    if (!open) {
      setRoleDialogUser(null);
      setRoleSelection('');
      setRoleDialogError(null);
      setRoleSaving(false);
    }
  };

  const handleSuspendDialogOpenChange = (open: boolean) => {
    setShowSuspendDialog(open);
    if (!open) {
      setSuspendTarget(null);
      setStatusActionError(null);
    }
  };

  const handleSaveRole = async () => {
    if (!roleDialogUser || !roleSelection) return;
    setRoleSaving(true);
    setRoleDialogError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: roleSelection })
      .eq('id', roleDialogUser.id);

    setRoleSaving(false);

    if (updateError) {
      console.error('Failed to update role', updateError.message);
      setRoleDialogError('Gagal mengubah role. Coba lagi.');
      toast.error('Gagal mengubah role');
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === roleDialogUser.id ? { ...user, role: roleSelection } : user))
    );
    toast.success(`Role ${roleDialogUser.name} diperbarui`);
    setRoleDialogUser(null);
    setShowRoleDialog(false);
  };

  const handleToggleSuspend = async (user: UserRow) => {
    const nextStatus: UserStatus = user.status === 'suspended' ? 'active' : 'suspended';
    setStatusActionError(null);
    setStatusLoadingId(user.id);

    setUsers((prev) =>
      prev.map((row) => (row.id === user.id ? { ...row, status: nextStatus } : row))
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('id', user.id);

    setStatusLoadingId(null);

    if (updateError) {
      console.error('Failed to update user status', updateError.message);
      setUsers((prev) =>
        prev.map((row) => (row.id === user.id ? { ...row, status: user.status } : row))
      );
      setStatusActionError('Gagal mengubah status pengguna. Coba lagi.');
      toast.error('Gagal mengubah status pengguna');
      return;
    }

    toast.success(
      nextStatus === 'suspended' ? `${user.name} disuspend` : `${user.name} diaktifkan kembali`
    );
    setSuspendTarget(null);
    setShowSuspendDialog(false);
  };

  const handleBulkSuspend = async () => {
    if (selectedIds.length === 0) return;
    setStatusActionError(null);
    setBulkSuspending(true);

    const selectedRows = users.filter((row) => selectedIds.includes(row.id));
    const allSuspended =
      selectedRows.length > 0 && selectedRows.every((row) => row.status === 'suspended');
    const nextStatus: UserStatus = allSuspended ? 'active' : 'suspended';

    const previousUsers = [...users];
    setUsers((prev) =>
      prev.map((row) => (selectedIds.includes(row.id) ? { ...row, status: nextStatus } : row))
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .in('id', selectedIds);

    setBulkSuspending(false);
    setBulkMenuOpen(false);

    if (updateError) {
      console.error('Failed to bulk suspend users', updateError.message);
      setUsers(previousUsers);
      setStatusActionError('Gagal mengubah status pengguna terpilih. Coba lagi.');
      toast.error('Gagal mengubah status pengguna terpilih');
      return;
    }

    toast.success(
      nextStatus === 'suspended'
        ? 'Pengguna terpilih disuspend'
        : 'Pengguna terpilih diaktifkan kembali'
    );
  };

  const resetAddForm = () => {
    setAddForm({ name: '', email: '', password: '', role: 'user' });
    setAddUserError(null);
    setShowAddDialog(false);
  };

  const handleAddUser = async () => {
    const trimmedName = addForm.name.trim();
    const trimmedEmail = addForm.email.trim();
    const trimmedPassword = addForm.password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setAddUserError('Nama, email, dan password wajib diisi.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setAddUserError('Password minimal 6 karakter.');
      return;
    }

    setAddUserLoading(true);
    setAddUserError(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: trimmedPassword,
      options: {
        data: { full_name: trimmedName, role: addForm.role, status: 'active' },
      },
    });

    if (signUpError || !signUpData?.user?.id) {
      console.error('Failed to register auth user', signUpError?.message);
      setAddUserError(signUpError?.message ?? 'Gagal menambah user. Coba lagi.');
      setAddUserLoading(false);
      toast.error('Gagal menambah user');
      return;
    }

    const { data: profileData, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: signUpData.user.id,
        email: trimmedEmail,
        role: addForm.role,
        status: 'active',
        raw_user_meta_data: { full_name: trimmedName, role: addForm.role },
        raw_app_meta_data: { status: 'active', role: addForm.role },
      })
      .select(
        'id, email, role, status, raw_user_meta_data, raw_app_meta_data, last_sign_in_at, created_at'
      )
      .single();

    setAddUserLoading(false);

    if (insertError || !profileData) {
      console.error('Failed to save profile', insertError?.message);
      setAddUserError('User dibuat di auth, tapi gagal membuat profil. Coba lagi.');
      toast.error('User dibuat di auth, tapi gagal membuat profil');
      return;
    }

    setUsers((prev) => [mapProfileToRow(profileData as ProfileRow), ...prev]);
    toast.success('User berhasil ditambahkan');
    resetAddForm();
  };

  const renderFilterFields = () => (
    <div className="space-y-4 text-xs font-semibold text-gray-500">
      <FilterDropdown
        label="Status"
        options={statusFilterOptions}
        value={pendingStatusFilter}
        onChange={(value) => setPendingStatusFilter(value as UserStatus | 'all')}
      />
      <FilterDropdown
        label="Role"
        options={roleFilterOptions}
        value={pendingRoleFilter}
        onChange={(value) => setPendingRoleFilter(value as UserRole | 'all')}
      />
    </div>
  );

  const renderFilterActions = (className?: string) => (
    <div className={cn('flex gap-2', className)}>
      <Button
        size="sm"
        variant="outline"
        className="flex-1 font-normal text-gray-700 shadow-none"
        onClick={resetPendingFilters}
      >
        Reset
      </Button>
      <Button size="sm" className="flex-1 font-normal shadow-none" onClick={applyFilters}>
        Apply
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-geist-50">
      <div className="mx-auto w-full space-y-6">
        <header className="border-b border-gray-300">
          <div className="mx-auto flex px-6 lg:px-0 max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 py-7 md:py-10">
              <h1 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">Users Management</h1>
              <p className="text-sm font-normal text-gray-900">
                All users are listed here.
              </p>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-0">
          <section className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full gap-2 flex-row lg:items-center lg:gap-3">
                <div className="relative w-full">
                  <Search strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-11 font-normal bg-white pl-10"
                  />
                </div>
                <div className="flex justify-end gap-3 lg:w-auto">
                  {isDesktop ? (
                    <Popover>
                      <PopoverTrigger>
                        <Button
                          size="sm"
                          variant="outline"
                          className="relative inline-flex h-11 shadow-none items-center gap-2 px-4"
                          aria-label="Filter users"
                          aria-pressed={filterMenuOpen}
                        >
                          <ListFilter strokeWidth={2.5} className="h-4 w-4" />
                          <span className="hidden font-medium sm:inline">Filter</span>
                          {hasActiveFilters && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-gray-800" />}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4 text-xs font-semibold text-gray-500">
                          {renderFilterFields()}
                          {renderFilterActions('mt-5 border-t border-gray-100 pt-4')}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="relative" ref={filterMenuRef}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="inline-flex h-11 shadow-none items-center gap-2 px-4 w-full"
                        aria-label="Filter users"
                        aria-pressed={filterMenuOpen}
                        onClick={(event) => {
                          event.stopPropagation();
                          setFilterMenuOpen(true);
                        }}
                      >
                        <ListFilter strokeWidth={2.5} className="h-4 w-4" />
                        <span className="hidden font-medium sm:inline">Filter</span>
                        {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                      </Button>

                      {filterMenuOpen && (
                        <MobileSheet
                          onClose={() => setFilterMenuOpen(false)}
                          title="Filter Users"
                          description="Refine the user list"
                          footer={renderFilterActions('mt-5 border-t border-gray-100 pt-4')}
                        >
                          {renderFilterFields()}
                        </MobileSheet>
                      )}
                    </div>
                  )}

                  <Button
                    variant="default"
                    className="inline-flex h-11 shadow-none items-center gap-2 px-4 w-full lg:w-auto hover:cursor-pointer"
                    onClick={() => {
                      setShowAddDialog(true);
                      setAddUserError(null);
                    }}
                  >
                    <Plus strokeWidth={2.5} className="h-4 w-4" />
                    <span className="hidden font-medium sm:inline">Add User</span>
                  </Button>
                </div>
              </div>
            </div>

            {statusActionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {statusActionError}
              </div>
            )}

            <div className="overflow-x-visible rounded-lg border border-gray-300 bg-white">
              <table className="min-w-full border-separate border-spacing-0 text-sm text-gray-700">
                <thead
                  className="font-geist text-sm text-gray-600
                  [&_th]:px-6 [&_th]:py-4 [&_th]:font-normal [&_th]:bg-gray-50
                  [&_th]:border-b [&_th]:border-gray-200
                  [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg"
                >
                  <tr>
                    <th className="w-12">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-brand-600 focus:ring-brand-500"
                        checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all users"
                      />
                    </th>
                    <th className="px-6 py-3 text-left">Profile</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Last Active</th>
                    <th className="text-right">
                      <BulkMenuTrigger
                        disabled={!hasSelection}
                        suspending={bulkSuspending}
                        actionLabel={bulkActionLabel}
                        open={bulkMenuOpen}
                        onToggle={(event) => {
                          event.stopPropagation();
                          setBulkMenuOpen((prev) => !prev);
                        }}
                        onExport={() => setBulkMenuOpen(false)}
                        onSuspend={handleBulkSuspend}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-red-500">
                        Failed to load users: {error}
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                        No users match your filters. Try adjusting the search or invite a new teammate.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => {
                      const checked = selectedIds.includes(user.id);
                      return (
                        <tr
                          key={user.id}
                          className={cn('hover:bg-gray-50', checked && 'bg-brand-50/60')}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 accent-brand-600 focus:ring-brand-500"
                              checked={checked}
                              onChange={() => toggleSelect(user.id)}
                              aria-label={`Select ${user.name}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-normal text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-normal text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium',
                                roleBadgeStyles[user.role].className
                              )}
                            >
                              {roleBadgeStyles[user.role].label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.status === 'active' ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-300 bg-brand-100 px-3 py-1 text-xs font-medium text-brand-600 capitalize">
                              {user.status}
                              </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-100 px-3 py-1 text-xs font-medium text-red-500 capitalize">
                                  {user.status}
                                </span>
                              )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">{formatDate(user.lastActive)}</td>
                          <td className="px-6 py-4">
                            <div className="relative flex justify-end">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    className='text-gray-600 shadow-none bg-white hover:bg-gray-100 hover:cursor-pointer focus:bg-gray-100 active:bg-gray-100 focus:outline-none'
                                  >
                                    <EllipsisVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='w-44' side='left' align="start">
                                  <DropdownMenuLabel className='font-medium'>Action</DropdownMenuLabel>
                                  <DropdownMenuGroup>
                                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleOpenRoleDialog(user)}>
                                      Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                  </DropdownMenuGroup>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuGroup> 
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-700"
                                      disabled={statusLoadingId === user.id}
                                      onSelect={() => handleOpenSuspendDialog(user)}
                                    >
                                      {statusLoadingId === user.id
                                        ? 'Processing...'
                                        : user.status === 'suspended'
                                          ? 'Reinstate'
                                          : 'Suspend'}
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Client-side pagination */}
            <PaginationComponent
              page={safePage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              pageStart={pageStart}
              pageEnd={pageEnd}
              onPageChange={setPage}
            />
          </section>
        </div>
      </div>
      
      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={handleRoleDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              {roleDialogUser
                ? `Select a role for ${roleDialogUser.name}.`
                : 'Select the role you want to assign.'}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-3">
            <Field>
              <FieldLabel htmlFor="role-select">Role</FieldLabel>
              <Select
                value={roleSelection || undefined}
                onValueChange={(value) => setRoleSelection(value as UserRole)}
                disabled={roleSaving || !roleDialogUser}
              >
                <SelectTrigger id="role-select" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup className="text-gray-800 font-normal">
                    {roleFilterOptions
                      .filter((option) => option.value !== 'all')
                      .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {roleDialogError && (
                <p className="pt-2 text-sm text-red-600">{roleDialogError}</p>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button className='text-gray-800' variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSaveRole}
              disabled={!roleSelection || roleSaving || !roleDialogUser}
            >
              {roleSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Input user details below to add a new user.</DialogDescription>
          </DialogHeader>
          <FieldGroup className='mb-4'>
            <Field>
              <FieldLabel htmlFor="add-name">Full name</FieldLabel>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Jane Doe"
                disabled={addUserLoading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="add-email">Email</FieldLabel>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(event) => setAddForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="user@example.com"
                disabled={addUserLoading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="add-password">Password</FieldLabel>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(event) => setAddForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Set an account password"
                disabled={addUserLoading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="add-role">Role</FieldLabel>
              <Select
                value={addForm.role}
                onValueChange={(value) => setAddForm((prev) => ({ ...prev, role: value as UserRole }))}
                disabled={addUserLoading}
              >
                <SelectTrigger id="add-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup className="text-gray-800 font-normal">
                    {roleFilterOptions
                      .filter((option) => option.value !== 'all')
                      .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            {addUserError && <p className="text-sm text-red-600">{addUserError}</p>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="text-gray-800" disabled={addUserLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleAddUser} disabled={addUserLoading}>
              {addUserLoading ? 'Adding...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={handleSuspendDialogOpenChange}>
        <DialogContent className="sm:max-w-lg">
          {(() => {
            const target = suspendTarget
              ? users.find((u) => u.id === suspendTarget.id) ?? suspendTarget
              : null;
            const nextStatus = target?.status === 'suspended' ? 'active' : 'suspended';
            return (
              <>
                <DialogHeader>
                  <DialogTitle className='tracking-normal'>Are you absolutly sure?</DialogTitle>
                  <DialogDescription className='leading-6 mt-2'>
                    {target
                      ? `Are you sure you want to ${nextStatus === 'suspended' ? 'suspend' : 'reinstate'} ${
                          target.name
                        }? This action would ${nextStatus === 'suspended' ? 'suspend' : 'reinstate'} their account.`
                      : 'Confirm this action.'}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button className="text-gray-800" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      if (target) handleToggleSuspend(target);
                    }}
                    disabled={!target || statusLoadingId === target.id}
                  >
                    {statusLoadingId === target?.id
                      ? 'Processing...'
                      : nextStatus === 'suspended'
                        ? 'Suspend'
                        : 'Reinstate'}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-col gap-2 text-xs font-semibold text-gray-500">
    <span>{label}</span>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg border px-4 py-2 text-xs font-medium transition',
              isActive
                ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default UserManagement;

const ActionMenuButton = ({
  label,
  variant = 'default',
  onClick,
}: {
  label: string;
  variant?: 'default' | 'danger';
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm',
      variant === 'danger'
        ? 'text-red-600 hover:bg-red-50'
        : 'text-gray-700 hover:bg-gray-100'
    )}
  >
    {label}
  </button>
);

const BulkMenuTrigger = ({
  disabled,
  open,
  onToggle,
  onExport,
  onSuspend,
  actionLabel = 'Suspend selected',
  suspending = false,
}: {
  disabled: boolean;
  open: boolean;
  onToggle: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onExport: () => void;
  onSuspend: () => void;
  actionLabel?: string;
  suspending?: boolean;
}) => (
  <div className="relative inline-flex">
    <Button
      variant="ghost"
      disabled={disabled || suspending}
      onClick={onToggle}
      aria-label="Bulk actions"
      aria-haspopup="menu"
      aria-expanded={open}
    >
      <EllipsisVertical className="h-4 w-4" />
    </Button>
    {open && (
      <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
        <ActionMenuButton label="Export selected" onClick={onExport} />
        <ActionMenuButton label="Promote to admin" onClick={onExport} />
        <ActionMenuButton
          label={suspending ? 'Processing...' : actionLabel}
          variant="danger"
          onClick={onSuspend}
        />
      </div>
    )}
  </div>
);

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

const useBodyScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
};

type MobileSheetProps = {
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const MobileSheet = ({ onClose, title, description, children, footer, className }: MobileSheetProps) => (
  <>
    <div className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-[1px]" onClick={onClose} />
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-3xl border border-gray-200 bg-white p-5 shadow-[0_-20px_45px_rgba(15,23,42,0.25)]',
        className
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
      {footer}
    </div>
  </>
);
