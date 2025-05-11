import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <Briefcase className="h-6 w-6" />
      {!iconOnly && (
        <span className="text-xl font-bold text-foreground">
          Workplace<span className="text-accent">Central</span>
        </span>
      )}
    </div>
  );
}
