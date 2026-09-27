import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Connections } from "@/hooks/use-connections";
import { axeViolations } from "./axe";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/components/contact-form", () => ({ ContactForm: () => null }));
const connections: Connections = { database: null, pusher: null, storage: null, sharedInfraAllowed: true, canStoreCredentials: true };
vi.mock("@/hooks/use-connections", () => ({
  useConnections: () => ({
    connections,
    status: "success",
    error: null,
    retry: vi.fn(),
    saveConnections: { mutate: vi.fn(), isPending: false, error: null },
    checkConnections: { mutate: vi.fn(), isPending: false, error: null },
  }),
}));

import { LoginCard } from "@/components/login-card";
import { SignupCard } from "@/components/signup-card";
import { ConnectionsForm } from "@/components/connections-form";
import { ConnectionsStep } from "@/components/connections-step";
import { SetupScreen } from "@/components/setup-screen";
import { ImageDropzone } from "@/components/image-dropzone";

afterEach(cleanup);

const noViolations = async (ui: React.ReactElement, act?: (c: HTMLElement) => void) => {
  const { container } = render(ui);
  act?.(container);
  expect(await axeViolations(container)).toEqual([]);
};

describe("accessibility (axe, WCAG 2.2 A/AA)", () => {
  test("sign-in", () => noViolations(<LoginCard loginWithCredentials={vi.fn()} />));
  test("sign-in with an error", () => noViolations(<LoginCard loginWithCredentials={vi.fn()} error="CredentialsSignin" />));
  test("sign-in under review", () =>
    noViolations(<LoginCard loginWithCredentials={vi.fn()} error="CredentialsSignin" code="account_pending" />));
  test("sign-up", () => noViolations(<SignupCard signUp={vi.fn()} />));
  test("sign-up showing field errors", () =>
    noViolations(<SignupCard signUp={vi.fn()} />, (c) => fireEvent.submit(c.querySelector("form")!)));
  test("connections form", () => noViolations(<ConnectionsForm />));
  test("connections form, S3 storage", () =>
    noViolations(<ConnectionsForm />, (c) => {
      const s3 = Array.from(c.querySelectorAll("label")).find((el) => el.textContent === "S3-compatible")?.querySelector("input");
      fireEvent.click(s3!);
    }));
  test("onboarding step 1", () => noViolations(<ConnectionsStep onContinue={vi.fn()} onChecked={vi.fn()} />));
  test("onboarding step 2", () => noViolations(<SetupScreen onSubmit={vi.fn()} onBack={vi.fn()} />));
  test("image dropzone", () => noViolations(<ImageDropzone value="" onChange={vi.fn()} />));
});
