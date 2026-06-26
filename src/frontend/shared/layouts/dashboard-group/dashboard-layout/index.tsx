'use client';
import { Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SettingsIcon from '@mui/icons-material/Settings';
import { ThemeToggle } from '@/frontend/shared/ui/ThemeToggle';
import { useRouter, usePathname } from 'next/navigation';
import { useUiStore } from '@/frontend/store/ui-store';
import type { ReactNode } from 'react';

const DRAWER_OPEN_WIDTH = 240;
const DRAWER_CLOSED_WIDTH = 57;
const NAV = [
  { label: 'Items',  path: '/items',  icon: <Inventory2Icon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);

  const drawerWidth = drawerOpen ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH;

  return (
    <Box sx={{ display: 'flex', height: '100vh', position: 'relative' }}>
      <Drawer variant="permanent" sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: 'width 0.2s ease',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.2s ease',
        },
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', py: 0.5, pr: 0.5 }}>
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} size="small">
            {drawerOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
        <List sx={{ pt: 0 }}>
          {NAV.map(({ label, path, icon }) => (
            <Tooltip key={path} title={drawerOpen ? '' : label} placement="right">
              <ListItemButton
                selected={pathname === path}
                onClick={() => router.push(path)}
                sx={{ minHeight: 48, justifyContent: drawerOpen ? 'initial' : 'center', px: 2.5 }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: drawerOpen ? 2 : 'auto', justifyContent: 'center' }}>
                  {icon}
                </ListItemIcon>
                {drawerOpen && <ListItemText primary={label} />}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center', py: 1 }}>
          <ThemeToggle />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
