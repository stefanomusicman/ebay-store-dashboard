import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export const attachId = <T extends DocumentData>(doc: QueryDocumentSnapshot<T>): T & { id: string } => ({
    id: doc.id,
    ...doc.data()
});