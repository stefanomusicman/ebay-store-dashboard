import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { attachId } from "src/helper-functions/attach-id";
import { db } from "./config";

export type WithId<T> = T & { id: string };
export type WithoutId<T> = Omit<T, 'id'>;

export class BaseFirebaseService<T> {
    protected collectionName: string;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    protected getCollectionRef() {
        return collection(db, this.collectionName);
    }

    async create(data: WithoutId<T>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, this.collectionName), data);
            return docRef.id;
        } catch (error) {
            console.error(`Error creating document in ${this.collectionName}:`, error);
            throw new Error(`Failed to create document in ${this.collectionName}`);
        }
    }

    async getById(id: string): Promise<WithId<T>> {
        try {
            const docRef = doc(db, this.collectionName, id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error(`Document with ID ${id} not found in ${this.collectionName}`);
            }

            return attachId(docSnap) as WithId<T>;
        } catch (error) {
            console.error(`Error getting document from ${this.collectionName}:`, error);
            throw error;
        }
    }

    async update(id: string, data: Partial<WithoutId<T>>): Promise<void> {
        try {
            const docRef = doc(db, this.collectionName, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error(`Error updating document in ${this.collectionName}:`, error);
            throw new Error(`Failed to update document in ${this.collectionName}`);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const docRef = doc(db, this.collectionName, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting document from ${this.collectionName}:`, error);
            throw new Error(`Failed to delete document from ${this.collectionName}`);
        }
    }
}