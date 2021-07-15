import { postOrder } from '../traversal'
import TreeNode from '../treeNode'

describe('postOrder', () => {
  it('should visit each node', () => {
    const tn = new TreeNode({ name: 'parent', value: 1 })
    const tnChild = new TreeNode({ name: 'child', value: 10 })
    const tnChild2 = new TreeNode({ name: 'child2', value: 10 })
    tn.addChildNode(tnChild)
    tn.addChildNode(tnChild2)

    let sum = 0
    postOrder(tn, (n: TreeNode) => (sum += n.value))

    expect(sum).toBe(21)
  })
})
