/**
 * Whether Bullet simulates a body: `'sleeping'` bodies rest until something touches them,
 * `'never-sleep'` keeps a body awake, `'simulation-disabled'` freezes it.
 */
export type ActivationState = 'active' | 'sleeping' | 'wants-sleep' | 'never-sleep' | 'simulation-disabled'
