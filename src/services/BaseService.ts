import { collection } from "firebase/firestore";
import { db } from "./config";

export type WithId<T> = T & { id: string };
export type WthoutId<T> = Omit<T, 'id'>;

export class BaseFirebaseService<T> {
    protected collectionName: string;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    protected getCollectionRef() {
        return collection(db, this.collectionName);
    }
}