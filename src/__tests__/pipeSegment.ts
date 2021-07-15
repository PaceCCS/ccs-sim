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
