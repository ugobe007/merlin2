import { lazy, Suspense, type ReactNode } from "react";

const CarWashHomePage = lazy(() => import("./CarWashHomePage"));
const PeakDemandDiagnostic = lazy(() => import("./PeakDemandDiagnostic"));
const HowWeGetPaidPage = lazy(() => import("./HowWeGetPaidPage"));
const SitePagesPage = lazy(() => import("./SitePagesPage"));

function Frame({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#F5F9F7", color: "#5C6F66" }}
        >
          Loading…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

/** Public pages for carwashenergy.com. Merlin routes such as /admin stay on App. */
export default function CarWashEnergySite({ pathname }: { pathname: string }) {
  if (
    pathname === "/diagnostic" ||
    pathname === "/wizard" ||
    pathname === "/wizard-v8" ||
    pathname === "/v8"
  ) {
    return (
      <Frame>
        <PeakDemandDiagnostic />
      </Frame>
    );
  }
  if (pathname === "/pricing" || pathname === "/how-we-get-paid") {
    return (
      <Frame>
        <HowWeGetPaidPage />
      </Frame>
    );
  }
  if (pathname === "/industries" || pathname === "/site-pages") {
    return (
      <Frame>
        <SitePagesPage />
      </Frame>
    );
  }
  if (
    pathname === "/" ||
    pathname === "/home" ||
    pathname === "/landing" ||
    pathname === "/carwashenergy" ||
    pathname === "/car-wash"
  ) {
    return (
      <Frame>
        <CarWashHomePage />
      </Frame>
    );
  }
  return null;
}
