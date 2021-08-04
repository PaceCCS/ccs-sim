import Valve from '../valve'
import PipeSegment from '../pipeSegment'

describe('constructor', () => {
  it('should set the value of the node', () => {
    const v = new Valve({ outPressure: 10 })

    expect(v.value).toBe(0)
  })

  it('should set the pressure value', () => {
    const v = new Valve({ outPressure: 10 })

    expect(v.pressure).toBe(10)
  })
})

describe('sources', () => {
  it('should accept a pipe segment as a source', () => {
    const v = new Valve({ outPressure: 10 })
    const p = new PipeSegment({
      name: 'pressurePipe',
      start: { pressure: 100 },
    })
    v.addSource(p)

    expect(v.sources).toContain(p)
  })
})

describe('calculated values', () => {
  it('should have infinite `in pressure` when it has no sources', () => {
    const v = new Valve({ outPressure: 10 })

    expect(v.inPressure).toBe(Infinity)
  })

  it('should return the result of the placeholder temperature calculation', () => {
    const v = new Valve({ outPressure: 10 })
    const p = new PipeSegment({
      name: 'drop',
      start: { pressure: 100000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 150,
    })
    v.addSource(p)

    expect(v.temperature).toBe(6116.181128965647)
  })
})
