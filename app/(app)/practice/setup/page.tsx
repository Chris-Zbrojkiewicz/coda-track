import { Suspense } from "react";
import { RoutineSetup } from "@/components/practice/routine-setup";

export default function SessionSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoutineSetup />
    </Suspense>
  );
}
