'use client';
import { IconButton, Tooltip, TableRow, TableCell, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import RestoreIcon from '@mui/icons-material/RestoreFromTrash';
import type { Client } from '@/backend/modules/(core-domain)/clients/domain/entities';
import { getClientFullName } from '@/frontend/shared/utils/client-display';
import { formatDate } from '@/frontend/shared/utils/format-date';

export interface ClientRowProps {
  client: Client;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ClientRow({ client, onEdit, onDelete }: ClientRowProps) {
  return (
    <TableRow hover>
      <TableCell>
        <strong>{getClientFullName(client)}</strong>
      </TableCell>
      <TableCell>{client.email ?? '—'}</TableCell>
      <TableCell>{client.phone ?? '—'}</TableCell>
      <TableCell>
        {client.archived ? (
          <Chip label="Archived" size="small" color="default" />
        ) : (
          <Chip label="Active" size="small" color="success" variant="outlined" />
        )}
      </TableCell>
      <TableCell>{formatDate(client.createdAt)}</TableCell>
      <TableCell align="right">
        <Tooltip title={client.archived ? 'Edit / unarchive' : 'Edit'}>
          <IconButton size="small" onClick={() => onEdit(client.id)} aria-label="Edit client">
            {client.archived ? <RestoreIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(client.id)}
            aria-label="Delete client"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
