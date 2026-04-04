import { studyAssistantChat } from './src/ai/flows/study-assistant-chat-flow';

async function main() {
  try {
    const response = await studyAssistantChat({
      chatMessage: "holaa",
      studyMaterial: ""
    });
    console.log("SUCCESS:", response);
  } catch (error) {
    console.error("ERROR:", error);
  }
}

main();
