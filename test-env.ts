console.log("Environment variables:");
for (const key of Object.keys(process.env)) {
  if (key.includes("GOOGLE") || key.includes("FIREBASE") || key.includes("PROJECT") || key.includes("CREDENTIALS")) {
    console.log(`${key}: ${process.env[key]}`);
  }
}
