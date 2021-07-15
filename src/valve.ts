import Point from './point'

interface IValve {
  outPressure: number
}

export default class Valve extends Point {
  outPressure: number

  constructor(props: IValve) {
    super()
    this.outPressure = props.outPressure
  }

  get temperature(): number {
    return this.inPressure / this.outPressure + 5
  }

  get inPressure(): number {
    return super.calcPressure()
  }
}
