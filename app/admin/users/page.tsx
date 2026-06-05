'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Shield, Users, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const ROLE_STYLES: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  provider: 'bg-primary/10 text-primary',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'student' | 'provider' | 'admin'>('all');

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (userId: string, role: 'student' | 'provider' | 'admin') => {
    const { error } = await (supabase.from('profiles') as any).update({ role }).eq('id', userId);
    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      toast.success('User role updated');
    }
  };

  const toggleVerified = async (userId: string, current: boolean) => {
    const { error } = await (supabase.from('profiles') as any).update({ is_verified: !current }).eq('id', userId);
    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_verified: !current } : u));
      toast.success(`User ${!current ? 'verified' : 'unverified'}`);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || u.role === filter;
    return matchesSearch && matchesFilter;
  });

  const TABS = ['all', 'student', 'provider', 'admin'] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                filter === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-2xl animate-shimmer" />)}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((user) => {
              const initials = user.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U';
              return (
                <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-primary text-white text-sm font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{user.full_name || 'No name'}</p>
                      {user.is_verified && (
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.student_id && (
                      <p className="text-xs text-muted-foreground">{user.student_id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', ROLE_STYLES[user.role])}>
                      {user.role}
                    </span>
                    <span className="text-xs text-muted-foreground hidden lg:block">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </span>
                    <Button
                      size="sm"
                      variant={user.is_verified ? 'outline' : 'ghost'}
                      className="h-7 rounded-lg text-xs hidden sm:flex"
                      onClick={() => toggleVerified(user.id, user.is_verified)}
                    >
                      {user.is_verified ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
