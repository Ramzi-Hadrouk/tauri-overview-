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

const shape = { borderRadius: 10 };

export const lightTheme: Theme = createTheme({
  typography: { ...typography },
  shape,
  spacing: 8,
  palette: {
    mode: 'light',
    primary:    { main: '#00B16A', contrastText: '#FFFFFF' },
    secondary:  { main: '#00a2a3', contrastText: '#eef7f7' },
    success:    { main: '#009843', contrastText: '#ecf9ee' },
    warning:    { main: '#da9600', contrastText: '#211300' },
    error:      { main: '#df2225', contrastText: '#fff0ee' },
    info:       { main: '#0081d0', contrastText: '#eaf7ff' },
    background: { default: '#FFFFFF', paper: '#FCFCFC' },
    text:       { primary: '#0a140f', secondary: '#535a56' },
    divider:    '#dbe4de',
  },
});

export const darkTheme: Theme = createTheme({
  typography: { ...typography },
  shape,
  spacing: 8,
  palette: {
    mode: 'dark',
    primary:    { main: '#00975a', contrastText: '#090f0c' },
    secondary:  { main: '#00a2a3', contrastText: '#080f0f' },
    success:    { main: '#009843', contrastText: '#071009' },
    warning:    { main: '#da9600', contrastText: '#1c0f00' },
    error:      { main: '#df2225', contrastText: '#150a09' },
    info:       { main: '#0081d0', contrastText: '#060e15' },
    background: { default: '#070505', paper: '#15201E' },
    text:       { primary: '#d3e2d9', secondary: '#bec7c1' },
    divider:    '#010201',
  },
});