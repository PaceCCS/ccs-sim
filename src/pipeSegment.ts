import TreeNode from './treeNode'
import { postOrder } from './traversal'

interface IPipeSeg {
  name: string
  diameter?: number
  length?: number
  flowrate?: number
  roughness?: number
  start?: {
    pressure?: number
    viscosity?: number
    x?: number
  }
}

export default class PipeSegment extends TreeNode {
  properties: {
    diameter: number
    length: number
    roughness: number
    flowrate: number
    start: {
      pressure: number
      viscosity: number
      x: number
    }
  }

  constructor(props: IPipeSeg = { name: 'pipeseg' }) {
    super(props)
    this.properties = {
      diameter: props.diameter || 2,
      length: props.length || 200,
      roughness: props.roughness || 0,
      flowrate: props.flowrate || 0,
      start: {
        pressure: (props.start && props.start.pressure) || 2e6,
        viscosity: (props.start && props.start.viscosity) || 0,
        x: (props.start && props.start.x) || 0,
      },
    }
  }

  inflow(): number {
    let sum = 0
    const addFlow = (node: PipeSegment) => (sum += node.properties.flowrate)
    postOrder(this, addFlow)
    return sum
  }

  pressureDrop(): number {
    return 0
  }
}
