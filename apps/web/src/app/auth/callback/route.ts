import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies(); // Next.js 15+ await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);

    // After exchanging code, check if profile is complete
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, location')
        .eq('id', user.id)
        .single();

      if (!profile?.full_name || !profile?.phone || !profile?.location) {
        const redirect = requestUrl.searchParams.get('redirect');
        const completeProfileUrl = new URL(`${requestUrl.origin}/complete-profile`);
        if (redirect) completeProfileUrl.searchParams.set('redirect', redirect);
        return NextResponse.redirect(completeProfileUrl.toString());
      }
    }
  }

  // URL to redirect to after sign in process completes
  const redirect = requestUrl.searchParams.get('redirect');
  const target = redirect && redirect.startsWith('/') ? `${requestUrl.origin}${redirect}` : requestUrl.origin;

  return NextResponse.redirect(target);
}
