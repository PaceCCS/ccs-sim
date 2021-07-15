import { postOrder } from '../traversal'
import TreeNode from '../treeNode'

describe('postOrder', () => {
  it('should visit each node', () => {
    const root = new TreeNode({ name: 'parent', value: 1 })
    const child = new TreeNode({ name: 'child', value: 10 })
    const child2 = new TreeNode({ name: 'child2', value: 10 })
    root.addChildNode(child)
    root.addChildNode(child2)

    let sum = 0
    postOrder(root, (n: TreeNode) => (sum += n.value))

    expect(sum).toBe(21)
  })

  it('should visit each node in the correct order (1)', () => {
    const root = new TreeNode({ name: 'parent', value: 1 })
    const child = new TreeNode({ name: 'child', value: 2 })
    const child2 = new TreeNode({ name: 'child2', value: 3 })
    root.addChildNode(child)
    root.addChildNode(child2)

    let order = ''
    postOrder(root, (n: TreeNode) => (order += n.value))

    expect(order).toBe('231')
  })

  it('should visit each node in the correct order (2)', () => {
    const root = new TreeNode({ name: 'parent', value: 1 })
    const child = new TreeNode({ name: 'child', value: 2 })
    const child2 = new TreeNode({ name: 'child2', value: 3 })
    root.addChildNode(child)
    root.addChildNode(child2)
    const grandchild = new TreeNode({ name: 'grandchild', value: 4 })
    const grandchild2 = new TreeNode({ name: 'grandchild', value: 5 })
    child.addChildNode(grandchild)
    child.addChildNode(grandchild2)

    let order = ''
    postOrder(root, (n: TreeNode) => (order += n.value))

    expect(order).toBe('45231')
  })
})
