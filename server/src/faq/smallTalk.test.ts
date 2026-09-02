import { describe, expect, it } from 'vitest'
import { matchSmallTalk, smallTalkReply } from './smallTalk.js'

describe('matchSmallTalk', () => {
  it('matches greeting variants without treating product questions as chat', () => {
    expect(matchSmallTalk('Hi')).toBe('greeting')
    expect(matchSmallTalk('HELLO!!')).toBe('greeting')
    expect(matchSmallTalk('hii')).toBe('greeting')
    expect(matchSmallTalk('Namaste')).toBe('greeting')
    expect(matchSmallTalk('how is the Storm range')).toBeNull()
  })

  it('matches thanks and how-are-you phrasing', () => {
    expect(matchSmallTalk('Thank u')).toBe('thanks')
    expect(matchSmallTalk('thanks a lot')).toBe('thanks')
    expect(matchSmallTalk('how r u')).toBe('how_are_you')
    expect(matchSmallTalk('kaise ho')).toBe('how_are_you')
    expect(matchSmallTalk('ela unnavu')).toBe('how_are_you')
  })

  it('returns canned English replies', () => {
    expect(smallTalkReply('greeting')).toMatch(/Volt, Storm, or Cruise/)
    expect(smallTalkReply('thanks')).toMatch(/welcome/i)
  })
})
