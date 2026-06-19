console.log("All environment variables:");
for (const key of Object.keys(process.env)) {
  console.log(`${key}=${process.env[key]}`);
}
