import TreeNode from '../treeNode'

describe('constructor', () => {
  it('should set the value of the node', () => {
    const tn = new TreeNode(6, 'treenode')

    expect(tn.value).toBe(6)
  })

  it('should set the name of the node', () => {
    const tn = new TreeNode(6, 'treenode')

    expect(tn.name).toBe('treenode')
  })
})
