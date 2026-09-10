import { ReactElement, ReactNode } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthLayout from '@/components/layout/AuthLayout';

type LayoutType = 'public' | 'admin' | 'auth';

export function getLayoutByType(type: LayoutType, children: ReactNode): ReactElement {
  switch (type) {
    case 'admin':
      return <AdminLayout>{children}</AdminLayout>;
    case 'auth':
      return <AuthLayout>{children}</AuthLayout>;
    case 'public':
    default:
      return <PublicLayout>{children}</PublicLayout>;
  }
}
