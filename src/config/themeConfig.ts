/**
 * Application Theme & Festival Configuration
 * 
 * Manage festival themes centrally from this file:
 * - `isDussehraThemeEnabled`: Set to true to activate Dussehra / Vijayadashami theme (Divine Kodanda Bow & Arrow, Marigold Mango Leaf Toran, Golden Shami 'Sona' leaves, Victory Fireworks).
 * - `isDiwaliThemeEnabled`: Set to true to activate Diwali theme (Fairy light garland, Clay oil diyas, Star lanterns, Skycrackers).
 * - `enableSkycrackers`: Set to true to enable skycracker fireworks bursts.
 * 
 * Note: If both festival flags are set to false, the clean modern default theme will be used.
 */

export const THEME_CONFIG = {
  /** Set to true to turn on Dussehra (Vijayadashami) theme */
  isDussehraThemeEnabled: false,
  /** Set to true to turn on Diwali theme */
  isDiwaliThemeEnabled: false,
  /** Enable aerial skycrackers bursting at random intervals */
  enableSkycrackers: false,
};

export const isDussehraMode = THEME_CONFIG.isDussehraThemeEnabled;
export const isDiwaliMode = THEME_CONFIG.isDiwaliThemeEnabled;
export const isFestivalMode = isDussehraMode || isDiwaliMode;
export const isSkycrackersEnabled = isFestivalMode && THEME_CONFIG.enableSkycrackers;
export default THEME_CONFIG;
