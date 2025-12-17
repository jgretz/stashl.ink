interface MascotProps {
  size?: 'sm' | 'default';
}

const sizeClasses = {
  sm: 'h-10 w-auto',
  default: 'w-16 h-24',
};

export function Mascot({size = 'default'}: MascotProps) {
  return (
    <img
      src='/stashl-logo.png'
      alt='Stashl.ink mascot'
      className={sizeClasses[size]}
    />
  );
}
