// src/services/chatService.ts
import { generateChat } from '@/services/apiAdapter';

export async function sendChatMessage(history: any[]) {
  return await generateChat(history);
}
