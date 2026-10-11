/** carwashenergy.net is the 4-step diagnostic. merlinenergy.net keeps its own pages. */
const CAR_WASH_HOSTS = new Set(["carwashenergy.net", "carwashenergy.com", "carwash.localhost"]);

export function isCarWashEnergyHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const bare = host.startsWith("www.") ? host.slice(4) : host;
  return CAR_WASH_HOSTS.has(bare);
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
