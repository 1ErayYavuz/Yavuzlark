import fs from "fs";
import path from "path";

async function main() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.error("Config file not found!");
      return;
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/prices/current?key=${config.apiKey}`;
    
    const testPayload = {
      date: new Date().toISOString(),
      prices: [
        { id: "gold", name: "Gold", sell: 3000, buy: 2900 }
      ]
    };
    
    // Construct robust Firestore REST structured update
    const body = {
      fields: {
        payload: {
          stringValue: JSON.stringify(testPayload)
        },
        updatedAt: {
          stringValue: new Date().toISOString()
        }
      }
    };
    
    console.log("Sending PATCH request to Firestore REST API...");
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`REST API HTTP Error: ${res.status}`, errText);
      return;
    }
    
    const resData = await res.json();
    console.log("REST API Write Success!", resData);
    
    console.log("Attempting REST API GET request to read it back...");
    const getRes = await fetch(url.replace("current?", "current?"));
    if (!getRes.ok) {
      const errText = await getRes.text();
      console.error(`REST API READ HTTP Error: ${getRes.status}`, errText);
      return;
    }
    const readData = await getRes.json();
    console.log("REST API Read Success!", readData);
    if (readData.fields && readData.fields.payload) {
      console.log("Decoded Payload:", JSON.parse(readData.fields.payload.stringValue));
    }
  } catch (err: any) {
    console.error("ERROR DETECTED:", err.message);
  }
}

main();
