import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

export type MemberRole = 'owner' | 'admin' | 'accountant' | 'operator' | 'viewer';

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export type RequestContext = {
  user: User;
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
};

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(error: unknown) {
  const httpError = error instanceof HttpError ? error : new HttpError(500, error instanceof Error ? error.message : 'Unexpected error');
  return new Response(JSON.stringify({ success: false, error: { message: httpError.message, details: httpError.details } }), {
    status: httpError.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON body.');
  }
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(500, `Missing required environment variable: ${name}`);
  return value;
}

function firstJsonSecretValue(name: string) {
  const value = Deno.env.get(name);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, string | undefined>;
    return parsed.default ?? Object.values(parsed).find(Boolean) ?? null;
  } catch {
    return null;
  }
}

export async function createRequestContext(req: Request): Promise<RequestContext> {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const publishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
    firstJsonSecretValue('SUPABASE_PUBLISHABLE_KEYS') ??
    Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SUPABASE_SECRET_KEY') ??
    firstJsonSecretValue('SUPABASE_SECRET_KEYS');

  if (!publishableKey) throw new HttpError(500, 'Missing SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY.');
  if (!serviceRoleKey) throw new HttpError(500, 'Missing SUPABASE_SERVICE_ROLE_KEY.');

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Authentication required.');

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session.', error?.message);

  return { user: data.user, userClient, adminClient };
}

export async function requireCompanyAccess(
  adminClient: SupabaseClient,
  userId: string,
  companyId: string,
  roles?: MemberRole[],
) {
  const { data, error } = await adminClient
    .from('company_memberships')
    .select('role,status')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw new HttpError(500, 'Could not verify company access.', error.message);
  if (!data) throw new HttpError(403, 'You do not have access to this company.');
  if (roles?.length && !roles.includes(data.role as MemberRole)) {
    throw new HttpError(403, 'Your role cannot perform this action.');
  }

  return data.role as MemberRole;
}

export function getSearchParam(req: Request, key: string) {
  return new URL(req.url).searchParams.get(key);
}
