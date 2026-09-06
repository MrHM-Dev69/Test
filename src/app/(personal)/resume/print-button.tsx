"use client";

import { Button } from "@/components/ui/button";

export function PrintButtonClient() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      چاپ رزومه
    </Button>
  );
}
