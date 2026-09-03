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

  it('matches international and stretched greetings', () => {
    expect(matchSmallTalk('Hallo')).toBe('greeting')
    expect(matchSmallTalk('HIIIII')).toBe('greeting')
    expect(matchSmallTalk('HÌ')).toBe('greeting')
    expect(matchSmallTalk('hola')).toBe('greeting')
  })

  it('matches thanks and how-are-you phrasing', () => {
    expect(matchSmallTalk('Thank u')).toBe('thanks')
    expect(matchSmallTalk('thanks a lot')).toBe('thanks')
    expect(matchSmallTalk('how r u')).toBe('how_are_you')
    expect(matchSmallTalk('kaise ho')).toBe('how_are_you')
    expect(matchSmallTalk('ela unnavu')).toBe('how_are_you')
    expect(matchSmallTalk('Who are you')).toBe('capabilities')
  })

  it('matches frustration without treating buy questions as chat', () => {
    expect(matchSmallTalk("I don't like this")).toBe('unhelpful')
    expect(matchSmallTalk('Why I need to buy')).toBeNull()
  })

  it('matches assistant capability questions', () => {
    expect(matchSmallTalk('How can you help me')).toBe('capabilities')
    expect(matchSmallTalk('What can you do for me')).toBe('capabilities')
    expect(matchSmallTalk('Who are you')).toBe('capabilities')
    expect(matchSmallTalk('What questions can you answer')).toBe('capabilities')
    expect(smallTalkReply('capabilities')).toMatch(/Amptron's FAQ assistant/)
  })

  it('returns canned English replies', () => {
    expect(smallTalkReply('greeting')).toMatch(/Volt, Storm, or Cruise/)
    expect(smallTalkReply('thanks')).toMatch(/welcome/i)
    expect(smallTalkReply('unhelpful')).toMatch(/missed the mark/i)
  })
})
