async function main() {
  try {
    const res = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email", {
      headers: { "Metadata-Flavor": "Google" }
    });
    const email = await res.text();
    console.log("Service Account Email:", email);
  } catch (err: any) {
    console.error("Error fetching metadata:", err.message);
  }
}
main();
