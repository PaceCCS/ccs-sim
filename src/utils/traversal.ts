export const preOrderTraverse = (elem: any, cb: any) => {
  if (!elem) return;
  cb(elem);

  if (elem.destinations) {
    for (const child of elem.destinations) {
      preOrderTraverse(child, cb);
    }
  } else if (elem.destination) {
    preOrderTraverse(elem.destination, cb);
  }
};
