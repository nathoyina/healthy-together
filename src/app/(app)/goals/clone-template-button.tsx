"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cloneTemplateGoal } from "./actions";

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
          const res = await cloneTemplateGoal(templateId);
          if (res?.error) {
            toast.error(res.error);
          }
        })
      }
    >
      Add to my habits
    </Button>
  );
}
