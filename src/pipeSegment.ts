import TreeNode from './treeNode'
import { postOrder } from './traversal'

interface IPipeSeg {
  name: string
  flowrate?: number
  pressure?: number
}

export default class PipeSegment extends TreeNode {
  properties: {
    flowrate: number
    pressure: number
  }

  constructor(props: IPipeSeg = { name: 'pipeseg' }) {
    super(props)
    this.properties = {
      flowrate: props.flowrate || 0,
      pressure: props.pressure || 2e6,
    }
  }

  inflow(): number {
    let sum = 0
    const addFlow = (node: PipeSegment) => (sum += node.properties.flowrate)
    postOrder(this, addFlow)
    return sum
  }
}
