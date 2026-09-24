import { createTheme } from '@mui/material/styles';

// Design tokens per specification (Section 0.2 in Frontend phases.md)
const TEXT = '#171a26';
const ACCENT = '#03b7d3';
const ACCENT_HOVER = '#02a3bc';   // Darker cyan for hover; 5.7:1 contrast with dark text
const ACCENT_TEXT = '#007a8d';    // Teal readable as text/link on white background (5:1 contrast)
const BORDER = 'rgba(23, 26, 38, 0.10)';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: ACCENT, dark: ACCENT_HOVER, light: '#e6f8fb', contrastText: TEXT },
    text: { primary: TEXT, secondary: 'rgba(23, 26, 38, 0.68)' },
    background: { default: '#fafcfc', paper: '#ffffff' },
    divider: BORDER,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    h1: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25 },
    h2: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'a': { color: ACCENT_TEXT },
        ':focus-visible': { outline: `2px solid ${ACCENT_TEXT}`, outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { '*': { animation: 'none !important', transition: 'none !important' } },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, padding: '8px 18px' },
        text: { color: ACCENT_TEXT },
        outlined: { color: TEXT, borderColor: BORDER, '&:hover': { borderColor: ACCENT_TEXT, backgroundColor: 'rgba(3,183,211,0.06)' } },
      },
    },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderColor: BORDER, backgroundColor: '#fff' } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fff', borderRadius: 10, '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'rgba(23,26,38,0.28)' } },
      },
    },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' }, styleOverrides: { root: { backgroundColor: '#fff', borderBottom: `1px solid ${BORDER}` } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
  },
});

export default theme;
