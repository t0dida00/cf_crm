import { auth } from "@/auth";
import { LandingPage } from "@/components/landing-page";
import { WorkspaceSetupFlow } from "@/components/workspace-setup-flow";

export default async function Page() {
  const session = await auth();
  if (!session) return <LandingPage />;

  return <WorkspaceSetupFlow />;
}
