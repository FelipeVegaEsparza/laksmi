/**
 * Utilidades para colores dinámicos del tema
 * Estos colores se cargan desde la configuración de la empresa
 */

export const themeColors = {
  // Colores principales
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover, #be123c)',
  primaryLight: 'var(--color-primary-light, #fecdd3)',
  
  // Colores secundarios
  secondary: 'var(--color-secondary)',
  secondaryHover: 'var(--color-secondary-hover, #7e22ce)',
  secondaryLight: 'var(--color-secondary-light, #e9d5ff)',
  
  // Colores de fondo y texto
  background: 'var(--color-background)',
  text: 'var(--color-text)',
  
  // Gradientes
  gradientPrimary: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
  gradientLight: 'linear-gradient(to bottom right, var(--color-primary-light, #fecdd3), var(--color-secondary-light, #e9d5ff))',
  gradientHero: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
};

/**
 * Genera estilos inline para colores dinámicos
 */
export const dynamicStyles = {
  // Backgrounds
  bgPrimary: { backgroundColor: themeColors.primary },
  bgPrimaryHover: { backgroundColor: themeColors.primaryHover },
  bgPrimaryLight: { backgroundColor: themeColors.primaryLight },
  bgSecondary: { backgroundColor: themeColors.secondary },
  bgSecondaryHover: { backgroundColor: themeColors.secondaryHover },
  bgSecondaryLight: { backgroundColor: themeColors.secondaryLight },
  bgGradient: { background: themeColors.gradientPrimary },
  bgGradientLight: { background: themeColors.gradientLight },
  bgGradientHero: { background: themeColors.gradientHero },
  
  // Text colors
  textPrimary: { color: themeColors.primary },
  textSecondary: { color: themeColors.secondary },
  textWhite: { color: 'white' },
  
  // Borders
  borderPrimary: { borderColor: themeColors.primary },
  borderSecondary: { borderColor: themeColors.secondary },
  
  // Combined styles
  btnPrimary: {
    backgroundColor: themeColors.primary,
    color: 'white',
  },
  btnPrimaryOutline: {
    borderColor: themeColors.primary,
    color: themeColors.primary,
    backgroundColor: 'transparent',
    borderWidth: '2px',
  },
  btnSecondary: {
    backgroundColor: themeColors.secondary,
    color: 'white',
  },
  btnWhite: {
    backgroundColor: 'white',
    color: themeColors.primary,
  },
};

/**
 * Utilidades para hover effects con colores dinámicos
 */
export const createHoverEffect = (
  baseStyle: React.CSSProperties,
  hoverStyle: React.CSSProperties
) => ({
  style: baseStyle,
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    Object.assign(e.currentTarget.style, hoverStyle);
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    Object.assign(e.currentTarget.style, baseStyle);
  },
});

/**
 * Presets comunes para hover effects
 */
export const hoverEffects = {
  primaryButton: createHoverEffect(
    dynamicStyles.btnPrimary,
    { backgroundColor: themeColors.primaryHover, color: 'white' }
  ),
  secondaryButton: createHoverEffect(
    dynamicStyles.btnSecondary,
    { backgroundColor: themeColors.secondaryHover, color: 'white' }
  ),
  outlineButton: createHoverEffect(
    dynamicStyles.btnPrimaryOutline,
    { backgroundColor: themeColors.primary, color: 'white' }
  ),
  whiteButton: createHoverEffect(
    dynamicStyles.btnWhite,
    { backgroundColor: 'rgba(255,255,255,0.9)', color: themeColors.primary }
  ),
  textLink: createHoverEffect(
    { color: themeColors.primary },
    { color: themeColors.primaryHover }
  ),
};

/**
 * Utilidad para generar color mix CSS
 */
export const colorMix = (color: string, percentage: number, mixWith: string = 'white') => 
  `color-mix(in srgb, ${color} ${percentage}%, ${mixWith})`;

/**
 * Utilidades CSS personalizadas
 */
export const cssUtils = {
  primaryMix10: colorMix('var(--color-primary)', 10),
  primaryMix20: colorMix('var(--color-primary)', 20),
  primaryMix5: colorMix('var(--color-primary)', 5),
  secondaryMix10: colorMix('var(--color-secondary)', 10),
  secondaryMix20: colorMix('var(--color-secondary)', 20),
};
