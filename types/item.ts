import { Timestamp } from "firebase/firestore";
import { Category } from "./category";
import { Platform } from "./platforms";
import { Status } from "./status";

export interface Item {
    itemId?: string,
    name: string,
    cost: number,
    picture: string,
    salePrice?: number,
    category: Category,
    condition: number,            // Number out of 10, 1 being worst condition and 10 being perfect condition
    description?: string,
    status: Status,
    createdAt: Timestamp,
    isComplete: boolean,
    listedPlatforms?: Platform[], // Places where item is listed for sale
    platformOfSale?: Platform     // Place where item was sold
}