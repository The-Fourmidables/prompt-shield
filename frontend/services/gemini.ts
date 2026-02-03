// export async function sendToAI(input: string): Promise<string> {
//   console.log("🔥 FRONTEND SENDING:", input);

//   const response = await fetch("http://localhost:8000/chat", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ message: input }),
//   });

//   if (!response.ok) {
//     throw new Error(`Backend error: ${response.status}`);
//   }

//   const data = await response.json();
//   return data.reply;
// }

// frontend/services/gemini.ts

export async function sendToAI(input: string): Promise<any> { // Changed string to any
  console.log("🔥 FRONTEND SENDING:", input);

  // Added a trailing slash to match FastAPI route exactly
  const response = await fetch("http://localhost:8000/chat/", { 
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: input }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }

  const data = await response.json();
  return data; // Return the WHOLE object, not just data.reply
}