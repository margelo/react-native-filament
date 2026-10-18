/**
 * Shadow filtering. `'vsm'` blurs with variance shadow maps and does not need depth-compare
 * samplers; `'dpcf'` and `'pcss'` soften shadows with distance from the caster.
 */
export type ShadowType = 'pcf' | 'vsm' | 'dpcf' | 'pcss'
