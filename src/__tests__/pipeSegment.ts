import PipeSegment from '../pipeSegment'

describe('constructor', () => {
  it('should set the value of the node', () => {
    const ps = new PipeSegment({ name: 'PipeSegment' })

    expect(ps.value).toBe(0)
  })

  it('should have a default name', () => {
    const ps = new PipeSegment()

    expect(ps.name).toBe('pipeseg')
  })

  it('should set the name of the node', () => {
    const ps = new PipeSegment({ name: 'namepipeseg' })

    expect(ps.name).toBe('namepipeseg')
  })

  it('should have no sourced by default', () => {
    const ps = new PipeSegment()

    expect(ps.sources.length).toBe(0)
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

  it('should sum the flow rates of its child nodes (1)', () => {
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
