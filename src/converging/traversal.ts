import TreeNode from './treeNode';

export function postOrder(node: TreeNode | null, cb: (...args: any[]) => void) {
  if (!node) return;

  for (const child of node.sources) {
    postOrder(child, cb);
  }

  cb(node);
}
