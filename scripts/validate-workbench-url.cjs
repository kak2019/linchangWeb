const productionUrl = "https://www.narrativeos.cn/narrativeos/";
const mode = process.argv[2];
const value = process.env.WORKBENCH_URL;

function fail(message) {
  console.error(`Invalid ${mode} WORKBENCH_URL: ${message}`);
  process.exit(1);
}

if (!["production", "development"].includes(mode)) {
  fail("expected production or development mode");
}
if (!value || value !== value.trim()) {
  fail("a non-empty URL without surrounding whitespace is required");
}
if (mode === "production") {
  if (value !== productionUrl) fail(`must equal ${productionUrl}`);
} else {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail("must be an absolute HTTP or HTTPS URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    fail("must use HTTP or HTTPS");
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost") ||
      host.startsWith("127.") || host === "0.0.0.0" || host === "[::1]" ||
      host === "[::]" || host.startsWith("[::ffff:")) {
    fail("must use the development server address reachable by visitors, not a loopback address");
  }
  if (host === "narrativeos.cn" || host === "www.narrativeos.cn") {
    fail("must use the separate development server, not the production domain");
  }
  if (url.pathname !== "/narrativeos/" || url.search || url.hash || url.username || url.password) {
    fail("must end in /narrativeos/ without credentials, query parameters or a fragment");
  }
}
console.log(`Validated ${mode} workbench URL: ${value}`);
