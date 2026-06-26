'use client';
import { IconButton, Tooltip, TableRow, TableCell, Chip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import type { Item } from '@/frontend/shared/types/generated/Item';

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
      <TableCell>{item.description ?? '—'}</TableCell>
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
