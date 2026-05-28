import { cn, getInitials } from '@lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div className={cn(
      'rounded-full bg-emerald-950/10 text-emerald-950 flex items-center justify-center font-semibold flex-shrink-0',
      sizes[size],
      className,
    )}>
      {getInitials(name)}
    </div>
  );
}
