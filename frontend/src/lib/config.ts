// Base path for data fetching - must match next.config.ts basePath
const PROD_BASE_PATH = "/avalon-bench-multi-round";

export function getBasePath(): string {
  if (process.env.NODE_ENV === "production") {
    return PROD_BASE_PATH;
  }
  return "";
}
