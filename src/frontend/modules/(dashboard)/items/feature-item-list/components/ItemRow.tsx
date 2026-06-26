'use client';
import { useEffect, useState } from 'react';
import { IconButton, Tooltip, TableRow, TableCell, Chip, Typography, Avatar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import type { Item } from '@/frontend/shared/types/generated/Item';
import { itemsCommands } from '@/frontend/core/ipc/contracts/items';

function ItemThumbnail({ path }: { path: string | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    itemsCommands.getItemImage(path).then((res) => {
      if (!cancelled && res.data) setSrc(res.data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [path]);

  if (!path) return <Typography variant="caption" color="text.disabled">—</Typography>;
  if (!src) return <Typography variant="caption" color="text.disabled">Loading…</Typography>;
  return <Avatar src={src} variant="rounded" sx={{ width: 36, height: 36 }} />;
}

export interface ItemRowProps {
  item: Item;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ItemRow({ item, onEdit, onDelete }: ItemRowProps) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography component="strong" sx={{ fontWeight: 'bold' }}>{item.name}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{item.sku}</Typography>
      </TableCell>
      <TableCell>${Number(item.price).toFixed(2)}</TableCell>
      <TableCell>{Number(item.quantity)}</TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.tags || '—'}
        </Typography>
      </TableCell>
      <TableCell><ItemThumbnail path={item.image_path} /></TableCell>
      <TableCell>
        {item.is_active ? (
          <Chip label="Active" size="small" color="success" variant="outlined" />
        ) : (
          <Chip label="Inactive" size="small" color="default" />
        )}
      </TableCell>
      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
      <TableCell align="right">
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(item.id)} aria-label="Edit item">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(item.id)}
            aria-label="Delete item"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
