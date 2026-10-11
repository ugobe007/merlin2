/** carwashenergy.com is the 4-step diagnostic. merlinenergy.net keeps its own pages. */
export function isCarWashEnergyHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const bare = host.startsWith("www.") ? host.slice(4) : host;
  return bare === "carwashenergy.com" || bare === "carwash.localhost";
}

export function isCarWashPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/home" ||
    pathname === "/landing" ||
    pathname === "/carwashenergy" ||
    pathname === "/car-wash" ||
    pathname === "/diagnostic" ||
    pathname === "/wizard" ||
    pathname === "/wizard-v8" ||
    pathname === "/v8" ||
    pathname === "/pricing" ||
    pathname === "/how-we-get-paid" ||
    pathname === "/industries" ||
    pathname === "/site-pages"
  );
}
