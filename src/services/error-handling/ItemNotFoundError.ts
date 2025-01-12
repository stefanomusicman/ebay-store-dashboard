export class ItemNotFoundError extends Error {
    constructor(itemId: string) {
        super(`Item with ID ${itemId} not found`);
        this.name = 'PlaylistNotFoundError';
    }
}