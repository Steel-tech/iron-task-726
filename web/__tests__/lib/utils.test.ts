import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'true-class', false && 'false-class')).toBe('base true-class')
  })

  it('handles arrays of classes', () => {
    expect(cn(['base', 'array'])).toBe('base array')
  })

  it('handles objects with boolean values', () => {
    expect(cn({
      'base': true,
      'active': true,
      'disabled': false
    })).toBe('base active')
  })

  it('removes duplicate classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('merges Tailwind classes intelligently', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('mt-2 mb-2', 'my-4')).toBe('my-4')
  })
})