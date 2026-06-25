// src/frontend/core/theme.ts
import { createTheme, type Theme } from '@mui/material/styles';

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontSize: '1.75rem', fontWeight: 700 },
  h2: { fontSize: '1.5rem',  fontWeight: 600 },
  h3: { fontSize: '1.25rem', fontWeight: 600 },
  body1: { fontSize: '0.9375rem' },
  body2: { fontSize: '0.875rem' },
};

const shape = { borderRadius: 8 };

export const lightTheme: Theme = createTheme({
  typography: { ...typography },
  shape,
  palette: {
    mode: 'light',
    primary:    { main: '#2563EB', contrastText: '#fff' },
    secondary:  { main: '#7C3AED' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text:       { primary: '#0F172A', secondary: '#475569' },
    divider:    '#E2E8F0',
  },
});

export const darkTheme: Theme = createTheme({
  typography: { ...typography },
  shape,
  palette: {
    mode: 'dark',
    primary:    { main: '#3B82F6', contrastText: '#fff' },
    secondary:  { main: '#8B5CF6' },
    background: { default: '#0F172A', paper: '#1E293B' },
    text:       { primary: '#F1F5F9', secondary: '#94A3B8' },
    divider:    '#334155',
  },
});