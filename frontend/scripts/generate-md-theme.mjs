import { argbFromHex, themeFromSourceColor, hexFromArgb } from '@material/material-color-utilities';

const seed = '#8b5cf6';
const theme = themeFromSourceColor(argbFromHex(seed));

const roleKeys = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
  'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'outline', 'outlineVariant',
  'inverseSurface', 'inverseOnSurface', 'inversePrimary',
  'shadow', 'scrim',
];

function printScheme(name, scheme) {
  console.log(`\n--- ${name} ---`);
  for (const key of roleKeys) {
    if (key in scheme.props) {
      console.log(`${key}: ${hexFromArgb(scheme.props[key])}`);
    }
  }
}

printScheme('LIGHT', theme.schemes.light);
printScheme('DARK', theme.schemes.dark);
