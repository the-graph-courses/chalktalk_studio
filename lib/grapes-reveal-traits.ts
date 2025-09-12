import type { Editor, Component } from 'grapesjs'

// Grapes plugin to add Reveal.js-related traits to components
// - TTS script text (stored on element as data-tts)
// - Fragment animation (adds class "fragment" and data-fragment)
// - Fragment index (data-fragment-index)
export default function grapesRevealTraits(editor: Editor) {
  const addRevealTraits = (cmp: Component) => {
    const origTraits = cmp.get('traits') || []

    // Only add once per component instance
    const alreadyHas = Array.isArray(origTraits)
      ? origTraits.some((t: any) => t?.name === 'data-tts' || t?.name === 'fragment')
      : false
    if (alreadyHas) return

    cmp.addTrait(([
      {
        type: 'text',
        name: 'data-tts',
        label: 'TTS Script',
        placeholder: 'Optional speech text for this element',
      },
      {
        type: 'select',
        name: 'fragment',
        label: 'Reveal Fragment',
        options: [
          { id: '', name: 'None' },
          { id: 'fade-in', name: 'Fade In' },
          { id: 'fade-out', name: 'Fade Out' },
          { id: 'grow', name: 'Grow' },
          { id: 'shrink', name: 'Shrink' },
          { id: 'strike', name: 'Strike' },
          { id: 'highlight-red', name: 'Highlight Red' },
          { id: 'highlight-green', name: 'Highlight Green' },
          { id: 'highlight-blue', name: 'Highlight Blue' },
          { id: 'appear', name: 'Appear' },
        ],
      },
      {
        type: 'number',
        name: 'data-fragment-index',
        label: 'Fragment Index',
        placeholder: '0,1,2…',
      },
    ]) as any)
  }

  // Attach traits to common component types
  editor.on('component:add', (cmp: Component) => {
    // Skip the global wrapper/body
    if (cmp.is('wrapper')) return
    addRevealTraits(cmp)
  })

  // Ensure existing components also get traits on init
  editor.on('load', () => {
    const wrapper = (editor as any).getWrapper?.() || editor.getWrapper?.()
    if (wrapper) {
      wrapper.components().forEach((cmp: Component) => addRevealTraits(cmp))
    }
  })

  // Keep 'fragment' class and data-fragment attribute in sync
  const syncFragment = (cmp: Component) => {
    const attrs = cmp.getAttributes() as any
    const value = attrs?.fragment || attrs?.['data-fragment']
    const current = ((cmp as any).getClasses?.() || (cmp as any).getClass?.() || []) as string[]
    const classes = new Set(current)
    if (value) classes.add('fragment')
    else classes.delete('fragment')
    ;(cmp as any).setClass?.(Array.from(classes))
    if (value) cmp.addAttributes({ 'data-fragment': value })
    else cmp.addAttributes({ 'data-fragment': undefined })
  }
  editor.on('component:update:attributes', (cmp: Component) => syncFragment(cmp))
}
