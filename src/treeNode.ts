interface ITNode {
  value?: number
  name: string
}

export default class TreeNode {
  value: number
  name: string
  sources: TreeNode[]
  destination: TreeNode | null

  constructor(props: ITNode = { name: 'treenode' }) {
    this.value = props.value || 0
    this.name = props.name
    this.sources = []
    this.destination = null
  }

  addChildNode(node: TreeNode) {
    this.sources.push(node)
  }
}
