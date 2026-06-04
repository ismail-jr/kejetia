'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email').refine(
    (e) => e.endsWith('@stu.ucc.edu.gh') || e.endsWith('@ucc.edu.gh'),
    'Please use your UCC student email (@stu.ucc.edu.gh or @ucc.edu.gh)'
  ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle();

        const role = profile?.role || 'student';
        toast.success('Welcome back!');
        router.push(`/${role}/dashboard`);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-0 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">UCC Connect</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Your campus marketplace<br />awaits you.
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            Connect with fellow UCC students to offer services, find help, and grow together.
          </p>
          <div className="flex flex-col gap-3">
            {['500+ active students', '120+ verified services', 'Real-time messaging'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary-300" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-blue-300 text-sm">
          © 2024 UCC Connect · University of Cape Coast
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">UCC Connect</span>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">Sign in to your UCC Connect account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">UCC Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="student@stu.ucc.edu.gh"
                  className="pl-10 h-11 rounded-xl"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11 rounded-xl"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl shadow-primary"
              disabled={loading}
            >
              {loading ? 'Signing in...' : (
                <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
