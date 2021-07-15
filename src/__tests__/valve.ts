import Valve from '../valve'

describe('constructor', () => {
  it('should set the value of the node', () => {
    const v = new Valve({ outPressure: 10 })

    expect(v.value).toBe(0)
  })
})
