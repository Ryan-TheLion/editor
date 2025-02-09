import { Node } from 'prosemirror-model'

/**
 * Prosemirror Node 의 content children
 */
export class ContentChildList {
  /**
   * node content child의 배열(children)을 반환
   */
  static from(node: Node) {
    const children: Node[] = []

    for (let i = 0; i < node.content.childCount; i++) {
      children.push(node.content.child(i))
    }

    return new Array<Node>(...children)
  }
}
