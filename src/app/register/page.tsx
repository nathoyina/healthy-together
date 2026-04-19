import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-16">
      <Link
        href="/"
        className="mb-8 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Healthy Together
      </Link>
      <RegisterForm />
    </div>
  );
}
