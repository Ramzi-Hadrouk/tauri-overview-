'use client';
import { TablePagination, type TablePaginationProps } from '@mui/material';
import { PAGE_SIZE_OPTIONS } from '@/frontend/shared/constants/pagination';

export interface PaginationProps
  extends Omit<TablePaginationProps, 'rowsPerPageOptions' | 'component' | 'count'> {
  total: number;
}

export function Pagination({ total, page, rowsPerPage, onPageChange, onRowsPerPageChange, ...rest }: PaginationProps) {
  return (
    <TablePagination
      component="div"
      count={total}
      page={page}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={Array.from(PAGE_SIZE_OPTIONS)}
      onPageChange={onPageChange ?? (() => {})}
      onRowsPerPageChange={onRowsPerPageChange ?? (() => {})}
      {...rest}
    />
  );
}
