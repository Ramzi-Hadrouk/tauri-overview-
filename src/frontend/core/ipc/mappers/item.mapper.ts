import type { Item as ItemDto } from '@/frontend/shared/types/generated/Item';

export interface ItemViewModel extends ItemDto {
  displayName: string;
  createdAtFormatted: string;
}

export function mapItemToViewModel(dto: ItemDto): ItemViewModel {
  return {
    ...dto,
    displayName: dto.name,
    createdAtFormatted: new Date(dto.created_at).toLocaleDateString(),
  };
}
