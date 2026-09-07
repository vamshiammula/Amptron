import { describe, expect, it } from 'vitest'
import {
  consumeChatOpenRequest,
  openAmptronChat,
  OPEN_CHAT_EVENT,
} from './openChat'

describe('assistant entry points', () => {
  it('retains a request made before the widget is ready, and consumes it only once', () => {
    consumeChatOpenRequest()
    openAmptronChat()
    expect(consumeChatOpenRequest()).toBe(true)
    expect(consumeChatOpenRequest()).toBe(false)
  })
  it('notifies a mounted widget immediately', () => {
    let opened = false
    const listener = () => {
      opened = consumeChatOpenRequest()
    }
    window.addEventListener(OPEN_CHAT_EVENT, listener)
    openAmptronChat()
    window.removeEventListener(OPEN_CHAT_EVENT, listener)
    expect(opened).toBe(true)
    expect(consumeChatOpenRequest()).toBe(false)
  })
})
