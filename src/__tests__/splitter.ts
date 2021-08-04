import Splitter from '../splitter'
import PipeSeg from '../pipeSeg'
import Fluid from '../fluid'
import Reservoir from '../reservoir'
import { PressureSolution } from '../element'

describe('addDestination', () => {
  it('should throw an error if the destination has a different elevation', () => {
    const pipeseg1 = new PipeSeg({
      length: 5,
      diameters: [0.9144],
      elevation: 1,
      name: 'pipe1',
    })
    const pipeseg2 = new PipeSeg({
      length: 200,
      diameters: [0.9144],
      elevation: 2,
      name: 'pipe2',
    })

    const splitter = new Splitter('splitter', { elevation: 1 }, pipeseg1)

    expect(() => splitter.setDestinations([pipeseg2])).toThrow(
      /elevation does not match/,
    )
  })
})

describe('applyFlowrate', () => {
  it('should throw an error if the splitter has no fluid', () => {
    const pipeseg1 = new PipeSeg({
      length: 5,
      diameters: [0.9144],
      elevation: 1,
      name: 'pipe1',
    })
    const pipeseg2 = new PipeSeg({
      length: 200,
      diameters: [0.9144],
      elevation: 1,
      name: 'pipe2',
    })

    const splitter = new Splitter('splitter', { elevation: 1 }, pipeseg1)
    splitter.setDestinations([pipeseg2])

    expect(() => splitter.applyFlowrate(0, 10)).toThrow(/no fluid/)
  })
})

describe('searchBranchFlowrate', () => {
  const pipeseg1 = new PipeSeg({
    length: 5,
    diameters: [0.9144],
    elevation: 1,
    name: 'pipe1',
  })
  const pipeseg2 = new PipeSeg({
    length: 200,
    diameters: [0.9144],
    elevation: 1,
    name: 'pipe2',
  })
  const pipeseg3 = new PipeSeg({
    length: 200,
    diameters: [0.9144],
    elevation: 1,
    name: 'pipe2',
  })
  const pipeseg4 = new PipeSeg({
    length: 200,
    diameters: [0.9144],
    elevation: 1,
    name: 'pipe2',
  })
  pipeseg3.setDestination(pipeseg4)

  const splitter = new Splitter('splitter', { elevation: 1 }, pipeseg1)
  splitter.setDestinations([pipeseg2, pipeseg3])

  const reservoir1 = new Reservoir('Reservoir1', { elevation: 1 }, 10)
  const reservoir2 = new Reservoir('Reservoir2', { elevation: 1 }, 10)

  pipeseg2.setDestination(reservoir1)
  pipeseg3.setDestination(reservoir2)

  it('should return a value that produces the correct end pressure', () => {
    const result = pipeseg1.process(new Fluid(300000, 350, 100))

    expect((reservoir1.fluid as Fluid).pressure).toBeCloseTo(
      reservoir1.pressure,
    )
    expect((reservoir2.fluid as Fluid).pressure).toBeCloseTo(
      reservoir2.pressure,
    )
    expect(result).toBe(PressureSolution.Ok)
  })
})
