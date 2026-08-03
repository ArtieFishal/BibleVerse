import { create } from 'zustand'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ConversationState = {
  messages: ChatMessage[]
  listening: boolean
  thinking: boolean
  speaking: boolean
  lastReply: string | null
  draft: string
  error: string | null
  setListening: (listening: boolean) => void
  setThinking: (thinking: boolean) => void
  setSpeaking: (speaking: boolean) => void
  setDraft: (draft: string) => void
  setError: (error: string | null) => void
  setLastReply: (reply: string | null) => void
  pushMessage: (message: ChatMessage) => void
  resetConversation: () => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  listening: false,
  thinking: false,
  speaking: false,
  lastReply: null,
  draft: '',
  error: null,
  setListening: (listening) => set({ listening }),
  setThinking: (thinking) => set({ thinking }),
  setSpeaking: (speaking) => set({ speaking }),
  setDraft: (draft) => set({ draft }),
  setError: (error) => set({ error }),
  setLastReply: (lastReply) => set({ lastReply }),
  pushMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  resetConversation: () =>
    set({
      messages: [],
      listening: false,
      thinking: false,
      speaking: false,
      lastReply: null,
      draft: '',
      error: null,
    }),
}))
