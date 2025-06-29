// Fix for tiptap autolinks being parsed as <https://link.com> in markdown
import { Link } from '@tiptap/extension-link'

export default Link.extend({
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        serialize: {
          open: '[',
          close: (_: any, state: any) => {
            return `](${state.attrs.href})`
          }
        }
      }
    }
  }
})
