import PipeSegment from '../pipeSegment'

describe('constructor', () => {
  it('should set the value of the node', () => {
    const ps = new PipeSegment()
    expect(ps.value).toBe(0)
  })

  it('should set the name of the node', () => {
    const ps = new PipeSegment({ name: 'namedpipeseg' })
    expect(ps.name).toBe('namedpipeseg')
  })

  it('should set diameter', () => {
    const ps = new PipeSegment({ name: 'pseg', diameter: 1 })
    expect(ps.properties.diameter).toBe(1)
  })

  it('should set length', () => {
    const ps = new PipeSegment({ name: 'pseg', length: 1 })
    expect(ps.properties.length).toBe(1)
  })

  it('should set flowrate', () => {
    const ps = new PipeSegment({ name: 'pseg', flowrate: 1 })
    expect(ps.properties.flowrate).toBe(1)
  })

  it('should set roughness', () => {
    const ps = new PipeSegment({ name: 'pseg', roughness: 1 })
    expect(ps.properties.roughness).toBe(1)
  })
})

describe('constructor - defaults', () => {
  it('name = pipeseg', () => {
    const ps = new PipeSegment()
    expect(ps.name).toBe('pipeseg')
  })

  it('properties.diameter = 2', () => {
    const ps = new PipeSegment()
    expect(ps.properties.diameter).toBe(2)
  })

  it('no sources', () => {
    const ps = new PipeSegment()
    expect(ps.sources.length).toBe(0)
  })

  it('properties.length = 200', () => {
    const ps = new PipeSegment()
    expect(ps.properties.length).toBe(200)
  })

  it('properties.flowrate = 0', () => {
    const ps = new PipeSegment()
    expect(ps.properties.flowrate).toBe(0)
  })

  it('properties.start.pressure = 2e6', () => {
    const ps = new PipeSegment()
    expect(ps.properties.start.pressure).toBe(2e6)
  })

  it('properties.start.viscosity = 0', () => {
    const ps = new PipeSegment()
    expect(ps.properties.start.viscosity).toBe(0)
  })

  it('properties.start.x = 0', () => {
    const ps = new PipeSegment()
    expect(ps.properties.start.x).toBe(0)
  })
})

describe('sources', () => {
  it('should add a node to the list of sources', () => {
    const ps = new PipeSegment()
    const ps2 = new PipeSegment()

    ps.addSource(ps2)

    expect(ps.sources).toContain(ps2)
  })
})

describe('inflow', () => {
  it('should sum the flow rates of its child nodes (1)', () => {
    const root = new PipeSegment({ name: 'parent' })
    const child = new PipeSegment({ name: 'child' })
    const child2 = new PipeSegment({ name: 'child2' })
    root.addSource(child)
    root.addSource(child2)
    const grandchild = new PipeSegment({ name: 'grandchild', flowrate: 4 })
    const grandchild2 = new PipeSegment({ name: 'grandchild', flowrate: 5 })
    child.addSource(grandchild)
    child.addSource(grandchild2)

    expect(root.inflow()).toBe(9)
  })

  it('should sum the flow rates of its child nodes (2)', () => {
    const root = new PipeSegment({ name: 'parent' })
    const child = new PipeSegment({ name: 'child' })
    const child2 = new PipeSegment({ name: 'child2', flowrate: 10 })
    root.addSource(child)
    root.addSource(child2)
    const grandchild = new PipeSegment({ name: 'grandchild', flowrate: 4 })
    const grandchild2 = new PipeSegment({ name: 'grandchild' })
    child.addSource(grandchild)
    child.addSource(grandchild2)

    expect(root.inflow()).toBe(14)
  })
})

// describe('pressureDrop', () => {
//   it('should calculate pressure drop')
// })
