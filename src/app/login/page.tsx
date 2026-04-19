import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const err = params.error;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-16">
      <Link
        href="/"
        className="mb-8 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Healthy Together
      </Link>
      {err ? (
        <p className="mb-4 max-w-md text-center text-sm text-destructive">
          Something went wrong signing you in. Please try again.
        </p>
      ) : null}
      <LoginForm />
    </div>
  );
}
