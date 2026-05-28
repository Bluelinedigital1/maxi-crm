'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@store/authStore';
import { cn } from '@lib/utils';
import { Eye, EyeOff, Gem } from 'lucide-react';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      router.push('/');
    } catch {
      toast.error('E-mail ou senha inválidos');
    }
  };

  const handleQuickLogin = async (email: string) => {
    setValue('email', email);
    setValue('password', '123456'); // Default mock password
    try {
      await login(email, '123456');
      toast.success('Login efetuado com sucesso!');
      router.push('/');
    } catch {
      toast.error('Erro ao efetuar login rápido');
    }
  };

  return (
    <div className="card p-8 space-y-6 max-w-sm w-full bg-white border border-surface-border">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-emerald-950 rounded-2xl flex items-center justify-center shadow-soft">
            <Gem className="w-6 h-6 text-gold" />
          </div>
        </div>
        <h1 className="text-2xl font-serif text-emerald-950 font-bold">Maxi CRM</h1>
        <p className="text-xs text-graphite-muted">Painel Comercial de Joias e Consignação</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-graphite-muted uppercase tracking-wide">
            E-mail
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            className={cn('input-base', errors.email && 'border-red-400')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-graphite-muted uppercase tracking-wide">
            Senha
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn('input-base pr-10', errors.password && 'border-red-400')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-muted hover:text-graphite transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2 py-2.5 font-bold shadow-soft">
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {/* Quick Login Section */}
      <div className="space-y-3 pt-2">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-surface-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-graphite-muted font-bold tracking-wider">Acesso Demonstrativo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@maxxi.com')}
            className="btn-secondary text-2xs py-2 font-bold flex items-center justify-center gap-1 border border-surface-border text-emerald-950 hover:bg-emerald-950/[0.04] hover:border-emerald-950/20"
          >
            👑 Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('vendedor@maxxi.com')}
            className="btn-secondary text-2xs py-2 font-bold flex items-center justify-center gap-1 border border-surface-border text-gold-dark hover:bg-gold/10 hover:border-gold"
          >
            💼 Vendedor
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-graphite-muted">
        Maxi Atacado © {new Date().getFullYear()}
      </p>
    </div>
  );
}
