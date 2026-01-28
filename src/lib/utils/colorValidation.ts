// src/utils/colorValidation.ts

/**
 * Validates if a string is a valid CSS color name or hex code
 * Uses browser's native CSS validation - NO HARDCODED LIST!
 */
export const isValidCSSColor = (color: string): boolean => {
  if (!color || typeof color !== 'string') return false;
  
  const trimmedColor = color.trim().toLowerCase();
  
  // Create a temporary element to test color validity
  const tempElement = document.createElement('div');
  tempElement.style.color = trimmedColor;
  
  // If the browser accepts it as a valid color, style.color will be set
  // If invalid, it remains empty string
  return tempElement.style.color !== '';
};

/**
 * Normalizes color names for consistency
 * e.g., "Red" → "red", "BLUE" → "blue"
 */
export const normalizeColorName = (color: string): string => {
  return color.trim().toLowerCase();
};

/**
 * Get color hex value from color name
 * Returns null if invalid
 */
export const getColorHex = (colorName: string): string | null => {
  if (!isValidCSSColor(colorName)) return null;
  
  const tempElement = document.createElement('div');
  tempElement.style.color = colorName;
  document.body.appendChild(tempElement);
  
  const computedColor = window.getComputedStyle(tempElement).color;
  document.body.removeChild(tempElement);
  
  // Convert rgb/rgba to hex
  if (computedColor.startsWith('rgb')) {
    const rgbMatch = computedColor.match(/\d+/g);
    if (!rgbMatch || rgbMatch.length < 3) return null;
    
    const r = parseInt(rgbMatch[0]);
    const g = parseInt(rgbMatch[1]);
    const b = parseInt(rgbMatch[2]);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }
  
  return computedColor;
};

/**
 * Enhanced validation with suggestions for common typos
 */
export const getColorSuggestions = (input: string): string[] => {
  const normalized = input.toLowerCase().trim();
  
  if (!normalized) return [];
  
  // Common color names that browsers support (comprehensive list)
  const commonColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'black', 'white', 'gray', 'grey', 'navy', 'teal', 'cyan', 'magenta',
    'lime', 'indigo', 'violet', 'gold', 'silver', 'maroon', 'olive',
    'aqua', 'fuchsia', 'coral', 'salmon', 'khaki', 'lavender', 'plum',
    'beige', 'tan', 'ivory', 'crimson', 'turquoise', 'mint', 'peach',
    'aliceblue', 'antiquewhite', 'aquamarine', 'azure', 'bisque', 'blanchedalmond',
    'blueviolet', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'cornflowerblue',
    'cornsilk', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen',
    'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid',
    'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
    'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue',
    'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
    'gainsboro', 'ghostwhite', 'goldenrod', 'greenyellow', 'honeydew', 'hotpink',
    'indianred', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
    'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen',
    'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
    'limegreen', 'linen', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
    'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
    'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite',
    'oldlace', 'olivedrab', 'orangered', 'orchid', 'palegoldenrod', 'palegreen',
    'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'powderblue',
    'rosybrown', 'royalblue', 'saddlebrown', 'sandybrown', 'seagreen', 'seashell',
    'sienna', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
    'steelblue', 'thistle', 'tomato', 'wheat', 'whitesmoke', 'yellowgreen'
  ];
  
  // Filter suggestions based on input
  return commonColors
    .filter(color => color.startsWith(normalized) || color.includes(normalized))
    .slice(0, 10);
};

/**
 * Validate and suggest corrections for typos
 */
export const validateColorWithSuggestions = (input: string): {
  isValid: boolean;
  normalized: string;
  hex: string | null;
  suggestions: string[];
} => {
  const normalized = normalizeColorName(input);
  const isValid = isValidCSSColor(normalized);
  
  return {
    isValid,
    normalized,
    hex: isValid ? getColorHex(normalized) : null,
    suggestions: !isValid ? getColorSuggestions(input) : [],
  };
};

/**
 * Check if an attribute key is color-related
 */
export const isColorAttribute = (key: string): boolean => {
  const normalizedKey = key.toLowerCase().trim();
  return ['color', 'colour', 'shade', 'hue', 'tint'].includes(normalizedKey);
};