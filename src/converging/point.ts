import TreeNode from './treeNode';
import { postOrder } from './traversal';

export default class Point extends TreeNode {
  constructor(props?: any) {
    super(props);
  }

  calcPressure(): number {
    let min = Infinity;
    const selectLowerPressure = (n: Point) => {
      if (n !== this) min = Math.min(min, n.pressure);
    };
    postOrder(this, selectLowerPressure);

    return min;
  }

  get pressure(): number {
    return this.calcPressure();
  }

  get flowrate(): number {
    let sum = 0;
    const addFlow = (n: Point) => {
      if (n !== this) sum += n.flowrate;
    };
    postOrder(this, addFlow);
    return sum;
  }

  get temperature(): number {
    return 10;
  }
}
