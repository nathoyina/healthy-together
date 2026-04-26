import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.username && profile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  const { data: templates, error: templatesError } = await supabase
    .from("goals")
    .select("id, title, description, type, target_per_period, icon, color")
    .or("is_template.eq.true,is_public.eq.true")
    .order("title");

  return (
    <OnboardingForm
      templates={templates ?? []}
      hasUsername={!!profile?.username}
      templateLoadError={templatesError?.message ?? null}
    />
  );
}
