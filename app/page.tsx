import { auth } from "@/auth";
import { LandingPage } from "@/components/marketing/LandingPage";
import { WorkspaceSetupFlow } from "@/components/onboarding/WorkspaceSetupFlow";

export default async function Page() {
  const session = await auth();
  if (!session) return <LandingPage />;

  return <WorkspaceSetupFlow />;
}
