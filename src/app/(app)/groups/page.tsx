import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function GroupsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("group_members")
    .select("role, groups ( id, name, slug, invite_code )")
    .eq("user_id", user.id);

  const groups = (rows ?? [])
    .map((r) => {
      const g = r.groups as
        | { id: string; name: string; slug: string; invite_code: string }
        | null
        | { id: string; name: string; slug: string; invite_code: string }[];
      if (!g) return null;
      return Array.isArray(g) ? g[0] : g;
    })
    .filter(Boolean) as {
    id: string;
    name: string;
    slug: string;
    invite_code: string;
  }[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Train together. Share invite codes so friends can join.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/groups/join"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Join with code
          </Link>
          <Link href="/groups/new" className={cn(buttonVariants())}>
            New group
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No groups yet</CardTitle>
            <CardDescription>
              Create a group or join one with an invite code.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.slug}`}>
                <Card className="border-border/80 transition-colors hover:bg-muted/40">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">{g.name}</CardTitle>
                    <CardDescription>/{g.slug}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
