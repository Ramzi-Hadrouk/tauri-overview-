import { invoke } from '../base/invoke';
import type { IpcResponse } from '@/frontend/shared/types/generated/IpcResponse';
import type { PaginatedData } from '@/frontend/shared/types/generated/PaginatedData';
import type { Item } from '@/frontend/shared/types/generated/Item';
import type { CreateItemInput } from '@/frontend/shared/types/generated/CreateItemInput';
import type { UpdateItemInput } from '@/frontend/shared/types/generated/UpdateItemInput';

export const itemsCommands = {
  listItems: (
    page = 1,
    size = 20,
  ): Promise<IpcResponse<PaginatedData<Item>>> =>
    invoke('list_items', { page, size }),

  getItem: (id: string): Promise<IpcResponse<Item>> =>
    invoke('get_item', { id }),

  createItem: (data: CreateItemInput): Promise<IpcResponse<Item>> =>
    invoke('create_item', { data }),

  updateItem: (id: string, data: UpdateItemInput): Promise<IpcResponse<Item>> =>
    invoke('update_item', { id, data }),

  deleteItem: (id: string): Promise<IpcResponse<null>> =>
    invoke('delete_item', { id }),

  getItemImage: (path: string): Promise<IpcResponse<string>> =>
    invoke('get_item_image', { path }),
} as const;
