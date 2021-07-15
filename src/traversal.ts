import TreeNode from './treeNode'

export function postOrder(node: TreeNode | null, cb: Function) {
  if (!node) return

  for (let child of node.sources) {
    postOrder(child, cb)
  }

  cb(node)
}
