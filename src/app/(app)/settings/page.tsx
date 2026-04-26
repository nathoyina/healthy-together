import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "@/app/onboarding/sign-out-action";

async function updateDisplayName(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, company_id")
    .eq("id", user.id)
    .maybeSingle();

  const { data: company } = profile?.company_id
    ? await supabase
        .from("companies")
        .select("id, name, join_code")
        .eq("id", profile.company_id)
        .maybeSingle()
    : { data: null as { id: string; name: string; join_code: string } | null };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile basics and account.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>
            Username is fixed after onboarding. You can still change your display
            name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Username</span>
            <p className="font-medium">@{profile?.username ?? "—"}</p>
          </div>
          <form action={updateDisplayName} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={profile?.display_name ?? ""}
                maxLength={80}
              />
            </div>
            <Button type="submit" size="sm">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Session</CardTitle>
          <CardDescription>Sign out on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Company code</CardTitle>
          <CardDescription>
            Everyone in the same company signs up with this code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {company ? (
            <>
              <div className="text-sm">
                <span className="text-muted-foreground">Company</span>
                <p className="font-medium">{company.name}</p>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Join code</span>
                <p className="font-mono font-medium">{company.join_code}</p>
              </div>
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-sm text-muted-foreground">
                No company is linked to your account yet. Company creation is manual
                via Supabase SQL (admin step). Run this once, then share the join code
                with colleagues.
              </p>
              <pre className="overflow-x-auto rounded-md border border-border/80 bg-muted/30 p-3 text-xs leading-5">
{`with new_company as (
  insert into public.companies (name, join_code)
  values ('Acme', 'ACME2026')
  returning id
)
insert into public.goals (
  owner_id, company_id, title, description, type, target_per_period, icon, color, is_template, is_public
)
select null, c.id, x.title, x.description, x.type::public.goal_type, x.target_per_period, x.icon, x.color, true, true
from new_company c
cross join (
  values
    ('Core & mobility', 'Daily check-in when you finish core, mobility, or planned rehab work.', 'daily_binary', null::int, 'flame', 'orange'),
    ('Strength sessions', 'Log each strength, Pilates, or studio workout; week resets Monday.', 'weekly_count', 3, 'dumbbell', 'teal'),
    ('Runs this week', 'Count each run Mon–Sun to build consistent training.', 'weekly_count', 3, 'footprints', 'sky')
) as x(title, description, type, target_per_period, icon, color);`}
              </pre>
              <p className="text-xs text-muted-foreground">
                Then users can sign up with <code>ACME2026</code>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
