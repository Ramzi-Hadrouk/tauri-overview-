'use client';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemText } from '@mui/material';
import { ThemeToggle } from '@/frontend/shared/ui/ThemeToggle';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const DRAWER_WIDTH = 240;
const NAV = [
  { label: 'Items',  path: '/items' },
  { label: 'Settings', path: '/settings' },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Item Manager</Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}>
        <Toolbar />
        <List>
          {NAV.map(({ label, path }) => (
            <ListItemButton
              key={path}
              selected={pathname === path}
              onClick={() => router.push(path)}
            >
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
