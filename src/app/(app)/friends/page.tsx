import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FriendRequestForm } from "./friend-request-form";
import { IncomingRequests } from "./incoming-requests";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const acceptedIds = new Set<string>();
  const incoming: { id: string; requester_id: string }[] = [];

  for (const f of friendships ?? []) {
    if (f.status === "accepted") {
      const other = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      acceptedIds.add(other);
    } else if (f.status === "pending" && f.addressee_id === user.id) {
      incoming.push({ id: f.id, requester_id: f.requester_id });
    }
  }

  const friendProfiles =
    acceptedIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", [...acceptedIds])
      : { data: [] as { id: string; username: string | null; display_name: string | null }[] };

  const requesterProfiles =
    incoming.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in(
            "id",
            incoming.map((i) => i.requester_id),
          )
      : { data: [] as { id: string; username: string | null; display_name: string | null }[] };

  const byId = new Map((requesterProfiles.data ?? []).map((p) => [p.id, p]));

  const incomingRows = incoming.map((i) => ({
    id: i.id,
    requester: byId.get(i.requester_id) ?? {
      username: null as string | null,
      display_name: null as string | null,
    },
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect by username and keep each other accountable.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Add a friend</CardTitle>
          <CardDescription>They will get a request to accept.</CardDescription>
        </CardHeader>
        <CardContent>
          <FriendRequestForm />
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Incoming requests</CardTitle>
          <CardDescription>Accept or decline pending invites.</CardDescription>
        </CardHeader>
        <CardContent>
          {incomingRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <IncomingRequests rows={incomingRows} />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your friends</CardTitle>
          <CardDescription>Tap a friend to see their shared goals.</CardDescription>
        </CardHeader>
        <CardContent>
          {(friendProfiles.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No friends yet. Send a request above.
            </p>
          ) : (
            <ul className="space-y-2">
              {(friendProfiles.data ?? [])
                .filter((p) => p.username)
                .map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/u/${p.username}`}
                      className="flex flex-col rounded-lg border border-border/80 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium">@{p.username}</span>
                      {p.display_name ? (
                        <span className="text-muted-foreground">{p.display_name}</span>
                      ) : null}
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
