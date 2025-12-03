import { Suspense, type ReactElement } from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center gap-3 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
    <span className="text-sm font-medium">Memuat halaman...</span>
  </div>
);

export const withPageSuspense = (element: ReactElement) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);
