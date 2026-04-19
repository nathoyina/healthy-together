import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, type, target_per_period, archived_at")
    .eq("owner_id", profile.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const isSelf = profile.id === user.id;

  return (
    <div className="space-y-8">
      <Link
        href="/friends"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Friends
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          @{profile.username}
        </h1>
        {profile.display_name ? (
          <p className="mt-1 text-sm text-muted-foreground">{profile.display_name}</p>
        ) : null}
        {isSelf ? (
          <p className="mt-2 text-xs text-muted-foreground">This is you.</p>
        ) : null}
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Shared goals</CardTitle>
          <CardDescription>
            {isSelf
              ? "Goals on your account."
              : "Goals you can see as a friend (or your own)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(goals ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active goals to show yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {(goals ?? []).map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/goals/${g.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <span className="font-medium">{g.title}</span>
                    <Badge variant="secondary" className="capitalize">
                      {g.type.replace(/_/g, " ")}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
