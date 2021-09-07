import TreeNode from '../treeNode';

describe('constructor', () => {
  it('should set the value of the node', () => {
    const tn = new TreeNode({ value: 6, name: 'treenode' });

    expect(tn.value).toBe(6);
  });

  it('should have a default name', () => {
    const tn = new TreeNode();

    expect(tn.name).toBe('treenode');
  });

  it('should set the name of the node', () => {
    const tn = new TreeNode({ value: 6, name: 'namednode' });

    expect(tn.name).toBe('namednode');
  });

  it('should default destination of `null`', () => {
    const tn = new TreeNode();

    expect(tn.destination).toBeNull();
  });

  it('should have no sources by default', () => {
    const tn = new TreeNode();

    expect(tn.sources.length).toBe(0);
  });
});

describe('sources', () => {
  it('should add a node to the list of sources', () => {
    const tn = new TreeNode();
    const tnChild = new TreeNode();

    tn.addSource(tnChild);

    expect(tn.sources).toContain(tnChild);
  });

  it('should become the destination of its source nodes', () => {
    const tn = new TreeNode();
    const tnChild = new TreeNode();

    tn.addSource(tnChild);

    expect(tnChild.destination).toBe(tn);
  });
});
