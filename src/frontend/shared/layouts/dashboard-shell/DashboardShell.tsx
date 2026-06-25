'use client';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemText } from '@mui/material';
import { useUiStore } from '@/frontend/store/ui-store';
import { ThemeToggle } from '@/frontend/shared/ui/ThemeToggle';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const DRAWER_WIDTH = 240;
const NAV = [
  { label: 'Clients',  path: '/clients' },
  { label: 'Settings', path: '/settings' },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Top bar */}
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Client Manager</Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}>
        <Toolbar /> {/* Spacer to push content below AppBar */}
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

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}