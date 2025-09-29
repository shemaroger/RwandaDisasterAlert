export interface User {
  email: string;
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  receivedAt: Date;
  isSpam: boolean;
}
