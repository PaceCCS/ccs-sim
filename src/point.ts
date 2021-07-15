import TreeNode from './treeNode'
import { postOrder } from './traversal'
import PipeSegment from './pipeSegment'

export default class Point extends TreeNode {
  constructor(props?: any) {
    super(props)
  }

  get pressure(): number {
    let min = Infinity
    const selectLowerPressure = (n: PipeSegment | Point) => {
      if (n !== this) min = Math.min(min, n.pressure)
    }
    postOrder(this, selectLowerPressure)

    return min
  }

  get flowrate(): number {
    let sum = 0
    const addFlow = (n: PipeSegment | Point) => {
      if (n !== this) sum += n.flowrate
    }
    postOrder(this, addFlow)
    return sum
  }

  get temperature(): number {
    return 10
  }
}
