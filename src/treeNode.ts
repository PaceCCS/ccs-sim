export default class TreeNode {
  value: number
  name: string
  sources: TreeNode[]
  destination: TreeNode | null

  constructor(value: number, name: string) {
    this.value = value
    this.name = name
    this.sources = []
    this.destination = null
  }
}
