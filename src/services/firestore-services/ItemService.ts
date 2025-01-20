import { Item } from "types/item";
import { collection, getCountFromServer, getDocs, query, serverTimestamp, Timestamp, where } from "firebase/firestore";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";
import { Status } from "types/status";
import { BaseFirebaseService } from "../BaseService";
import { db, storage } from "../config";
import { ItemNotFoundError } from "../error-handling/ItemNotFoundError";

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

            await this.update(itemId, { itemId, picture: photoUrl });

            return itemId;
        } catch (error) {
            console.error(`Error handling photo for item with ID ${itemId}:`, error);

            // Cleanup: Delete the Firestore document if photo upload fails
            await this.delete(itemId);
            throw new Error(`Failed to upload photo and update item with ID ${itemId}`);
        }
    }

    async createItemWithoutImg(item: Omit<Item, 'id' | 'createdAt'>): Promise<string> {
        const newItem: Omit<Item, 'id'> = {
            ...item,
            createdAt: serverTimestamp() as Timestamp,
        };
        const itemId = await this.create(newItem);
        return itemId;
    }

    async getAllItems(): Promise<Item[]> {
        try {
            const querySnapshot = await getDocs(collection(db, this.collectionName));

            const items: Item[] = querySnapshot.docs.map((doc) => ({
                id: doc.id,             // Assign the document ID to the Item's `id` field
                ...doc.data() as Item,  // Spread and cast the document data to the Item type
            }));

            return items;
        } catch (error) {
            console.error('Error fetching all items:', error);
            throw new Error('Failed to fetch items');
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