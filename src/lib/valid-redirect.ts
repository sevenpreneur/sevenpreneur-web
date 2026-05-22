export function isValidRedirectUrl(url: string): boolean {
  try {
    if (url.startsWith("/")) {
      return !url.startsWith("//");
    }
    const redirect = new URL(url);
    const domainMode = process.env.DOMAIN_MODE;
    let allowedDomains: string[];
    if (domainMode === "local") {
      allowedDomains = [
        "www.example.com:3000",
        "admin.example.com:3000",
        "agora.example.com:3000",
      ];
    } else if (domainMode === "staging") {
      allowedDomains = [
        "www.sevenpreneur.net",
        "admin.sevenpreneur.net",
        "agora.sevenpreneur.net",
      ];
    } else {
      allowedDomains = [
        "www.sevenpreneur.com",
        "admin.sevenpreneur.com",
        "agora.sevenpreneur.com",
      ];
    }

    return allowedDomains.includes(redirect.host);
  } catch {
    return false;
  }
}
