import IElement, { IPhysicalElement, PressureSolution } from './element'
import Fluid from './fluid'
import PipeSeg from './pipeSeg'

export default class Splitter implements IElement {
  source: PipeSeg
  destinations: IElement[] = []
  fluid?: Fluid
  physical: IPhysicalElement
  type: string = 'Splitter'
  name: string

  constructor(name: string, physical: IPhysicalElement, source: PipeSeg) {
    this.name = name
    this.physical = physical
    this.source = source

    this.source.setDestination(this as IElement)
  }

  addDestination(dest: IElement) {
    if (dest.physical.elevation !== this.physical.elevation) {
      throw new Error(`Destination elevation does not match splitter elevation`)
    }
    this.destinations.push(dest)
    dest.source = this as IElement
  }

  setDestinations(destinations: IElement[]) {
    destinations.forEach((d) => this.addDestination(d))
  }

  applyFlowrate(branch: number, flowrate: number): PressureSolution {
    if (!this.fluid) {
      throw new Error(
        `Splitter has no fluid - unable to calculate end pressure`,
      )
    }

    const newFluid = new Fluid(
      this.fluid.pressure,
      this.fluid.temperature,
      flowrate,
    )

    return this.destinations[branch].process(newFluid)
  }

  searchBranchFlowrate(branch: number, fluid: Fluid) {
    let low = 0
    let high = fluid.flowrate
    let mid = 0

    const stepSize = 0.001
    let guesses = 0
    const maxGuesses = 25

    let pressureSolution = PressureSolution.Low

    while (pressureSolution !== PressureSolution.Ok) {
      if (guesses++ > maxGuesses) {
        console.log(`max guesses (${maxGuesses}) reached`)
        break
      }

      mid = (low + high) / 2

      pressureSolution = this.applyFlowrate(branch, mid)
      if (pressureSolution === PressureSolution.Low) {
        high = mid - stepSize
      } else if (pressureSolution === PressureSolution.High) {
        low = mid + stepSize
      }
    }

    return { flowrate: mid, pressureSolution }
  }

  process(fluid: Fluid): PressureSolution {
    this.fluid = fluid

    const newFluid = new Fluid(
      this.fluid.pressure,
      this.fluid.temperature,
      this.fluid.flowrate,
    )

    for (let i = 0; i < this.destinations.length - 1; i++) {
      const { flowrate, pressureSolution } = this.searchBranchFlowrate(
        i,
        newFluid,
      )

      if (pressureSolution !== PressureSolution.Ok) {
        return pressureSolution
      }
      newFluid.flowrate -= flowrate
    }

    return this.searchBranchFlowrate(this.destinations.length - 1, newFluid)
      .pressureSolution
  }
}
