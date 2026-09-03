export const OPEN_CHAT_EVENT = 'amptron:open-chat'

export function openAmptronChat() {
  window.dispatchEvent(new Event(OPEN_CHAT_EVENT))
}
