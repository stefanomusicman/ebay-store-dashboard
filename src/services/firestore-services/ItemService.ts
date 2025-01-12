import { Item } from "types/item";
import { BaseFirebaseService } from "../BaseService";
import { storage } from "../config";
import { getCountFromServer, query, serverTimestamp, Timestamp, where } from "firebase/firestore";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";
import { ItemNotFoundError } from "../error-handling/ItemNotFoundError";
import { Status } from "types/status";

class ItemService extends BaseFirebaseService<Item> {

    constructor() {
        super('items');
    }

    async createItem(item: Omit<Item, 'id' | 'createdAt'>, photoFile: File): Promise<string> {
        const newItem: Omit<Item, 'id'> = {
            ...item,
            createdAt: serverTimestamp() as Timestamp,
        };
        const itemId = await this.create(newItem);

        try {
            const photoRef = ref(storage, `items/${itemId}/${newItem.name}`);
            await uploadBytes(photoRef, photoFile);

            const photoUrl = await getDownloadURL(photoRef);

            await this.update(itemId, { picture: photoUrl });

            return itemId;
        } catch (error) {
            console.error(`Error handling photo for item with ID ${itemId}:`, error);

            // Cleanup: Delete the Firestore document if photo upload fails
            await this.delete(itemId);
            throw new Error(`Failed to upload photo and update item with ID ${itemId}`);
        }
    }

    async getItemById(id: string): Promise<Item> {
        try {
            return await this.getById(id);
        } catch (error) {
            throw new ItemNotFoundError(id);
        }
    }

    async deleteItem(itemId: string): Promise<void> {
        try {
            // Step 1: Delete the Firestore document
            await this.delete(itemId);

            // Step 2: Get a reference to the folder in Storage
            const folderRef = ref(storage, `items/${itemId}`);

            // Step 3: List all files in the folder
            const files = await listAll(folderRef);

            // Step 4: Delete each file in the folder
            const deletePromises = files.items.map(fileRef => deleteObject(fileRef));
            await Promise.all(deletePromises);

            console.log(`Successfully deleted item with ID: ${itemId} and its storage folder.`);
        } catch (error) {
            console.error(`Error deleting item with ID: ${itemId}:`, error);
            throw new Error(`Failed to delete item with ID: ${itemId}`);
        }
    }

    async updateEntireItem(itemId: string, newItem: Item): Promise<void> {
        await this.update(itemId, newItem);
    }

    async getSoldItemCount(): Promise<number> {
        const itemCollectionRef = this.getCollectionRef();
        const soldItemsQuery = query(
            itemCollectionRef,
            where('status', '==', Status.SOLD)
        );

        const snapshot = await getCountFromServer(soldItemsQuery);
        return snapshot.data().count;
    }

    async getNotSoldItemCount(): Promise<number> {
        const itemCollectionRef = this.getCollectionRef();
        const soldItemsQuery = query(
            itemCollectionRef,
            where('status', '==', Status.LISTED)
        );

        const snapshot = await getCountFromServer(soldItemsQuery);
        return snapshot.data().count;
    }

    async getTotalItemCount(): Promise<number> {
        const itemCollectionRef = this.getCollectionRef();

        const totalItemQuery = query(itemCollectionRef);

        const snapshot = await getCountFromServer(totalItemQuery);
        return snapshot.data().count;
    }
}

export const itemService = new ItemService();