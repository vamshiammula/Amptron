export const OPEN_CHAT_EVENT = 'amptron:open-chat'

// A CTA can be used before the lazy-loaded widget has registered its listener.
let pendingOpen = false

export function consumeChatOpenRequest(): boolean {
  const requested = pendingOpen
  pendingOpen = false
  return requested
}

export function openAmptronChat() {
  pendingOpen = true
  window.dispatchEvent(new Event(OPEN_CHAT_EVENT))
}
