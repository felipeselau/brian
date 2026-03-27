"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  return (
    <Button variant="outline" onClick={() => window.history.back()}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Board
    </Button>
  );
}
