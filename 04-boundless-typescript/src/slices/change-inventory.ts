import { getStore } from '../store/setup.js';

export interface ChangeInventoryCommand {
  productId: string;
  inventory: number;
}

export async function executeChangeInventory(command: ChangeInventoryCommand): Promise<void> {
  await (await getStore()).append([
    { type: 'InventoryChanged', data: { productId: command.productId, inventory: command.inventory } },
  ], null);
}
