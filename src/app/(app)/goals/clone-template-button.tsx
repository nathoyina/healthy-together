"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { joinCompanyGoal } from "./actions";

export function CloneTemplateButton({ templateId }: { templateId: string }) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await joinCompanyGoal(templateId);
          if (res?.error) {
            toast.error(res.error);
          }
        })
      }
    >
      Join goal
    </Button>
  );
}
