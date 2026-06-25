'use client';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import type { Client } from '@/domain/clients/entities';
import { ClientRow } from './ClientRow';

export interface ClientTableProps {
  items: Client[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ClientTable({ items, onEdit, onDelete }: ClientTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((c) => (
            <ClientRow key={c.id} client={c} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
