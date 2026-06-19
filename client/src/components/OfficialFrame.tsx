import type { ReactNode } from 'react';

type OfficialFrameProps = {
  children: ReactNode;
  className?: string;
};

export default function OfficialFrame({ children, className = '' }: OfficialFrameProps) {
  return <div className={`official-frame ${className}`}>{children}</div>;
}
