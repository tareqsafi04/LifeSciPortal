import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { universityId, fullName, password } = await req.json();

    if (!universityId || !fullName || !password) {
      return new Response(
        JSON.stringify({ error: 'جميع الحقول مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const email = `${universityId}@student.ahu.edu.jo`;

    // Check if university ID already exists
    const { data: existing } = await adminClient
      .from('user_profiles')
      .select('university_id')
      .eq('university_id', universityId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'الرقم الجامعي مسجل مسبقاً' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use regular signUp with service role client (bypasses email confirmation)
    const { data: authData, error: signUpError } = await adminClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username: universityId }
      }
    });

    if (signUpError) {
      console.error('SignUp error:', signUpError.message);
      return new Response(
        JSON.stringify({ error: signUpError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = authData.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'فشل إنشاء الحساب' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', user.id, 'confirmed:', user.email_confirmed_at);

    // Wait briefly for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Upsert user profile with university details
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .upsert({
        id: user.id,
        email,
        username: universityId,
        university_id: universityId,
        full_name: fullName,
        is_admin: false
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error:', profileError.message);
    }

    // Initialize default semesters (4 years × 2 semesters = 8)
    const defaultSemesters = [];
    for (let year = 1; year <= 4; year++) {
      for (let sem = 1; sem <= 2; sem++) {
        defaultSemesters.push({
          user_id: user.id,
          year_number: year,
          semester_number: sem,
          type: 'regular'
        });
      }
    }

    const { error: semError } = await adminClient
      .from('student_semesters')
      .insert(defaultSemesters);

    if (semError) {
      console.error('Semesters init error:', semError.message);
    }

    // Sign in to get a valid session
    const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('SignIn error:', signInError.message);
      // Return success without session - user can sign in manually
      return new Response(
        JSON.stringify({ success: true, needsConfirmation: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ session: signInData.session }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
