'use client';
import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useRef, useState } from 'react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
}

export function SearchBar({ value, onChange, placeholder = 'Search…', delay = 300 }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      setLocal(value);
    }
  }, [value]);

  useEffect(() => {
    if (local === lastEmittedRef.current) return;
    const handle = setTimeout(() => {
      lastEmittedRef.current = local;
      onChange(local);
    }, delay);
    return () => clearTimeout(handle);
  }, [local, delay, onChange]);

  return (
    <TextField
      size="small"
      fullWidth
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
        htmlInput: { 'aria-label': placeholder },
      }}
    />
  );
}
