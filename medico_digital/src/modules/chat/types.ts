export type ChatRequest = {
  patientId: string;
  text: string;
};

export type ChatEntity = {
  label: string;
  text: string;
  score: number;
};

export type ChatResponse = {
  reply: string;
  entities: ChatEntity[];
  conversationId?: number | null;
};
