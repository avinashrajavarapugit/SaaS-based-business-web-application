import { healthResponseSchema, type HealthResponse } from '@saas/shared';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health');

  if (!response.ok) {
    throw new Error(`API responded with ${String(response.status)}`);
  }

  // The same schema the server serialises with, re-validated on the client.
  return healthResponseSchema.parse(await response.json());
}

function ApiStatus() {
  const { data, error, isPending } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  if (isPending) {
    return <p className="text-slate-400">Checking API…</p>;
  }

  if (error) {
    return (
      <p className="text-red-400">
        API unreachable — {error instanceof Error ? error.message : 'unknown error'}
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <dt className="text-slate-400">Status</dt>
      <dd className="font-medium text-emerald-400">{data.status}</dd>
      <dt className="text-slate-400">Version</dt>
      <dd className="font-medium text-slate-100">{data.version}</dd>
      <dt className="text-slate-400">Uptime</dt>
      <dd className="font-medium text-slate-100">{data.uptimeSeconds}s</dd>
    </dl>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <section className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-slate-50">Ransack</h1>
          <p className="mt-1 text-sm text-slate-400">
            Multi-tenant SaaS platform — v2 rebuild
          </p>
          <hr className="my-6 border-slate-800" />
          <ApiStatus />
        </section>
      </main>
    </QueryClientProvider>
  );
}
