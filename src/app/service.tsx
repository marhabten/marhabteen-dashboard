import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";

// Fetch properties from Firestore
export async function fetchProperties() {
    const propertiesRef = collection(db, "properties");
    const querySnapshot = await getDocs(propertiesRef);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id, 
        ...doc.data(),
    }));
}

// Delete a property by ID
export async function deletePropertyById(propertyId: string) {
    try {
        await deleteDoc(doc(db, "properties", propertyId));
        return true;
    } catch (error) {
        console.error("Error deleting property:", error);
        return false;
    }
}

// Fetch users from Firestore
export async function fetchUsers() {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id, 
        ...doc.data(),
    }));
}

// Delete a user by ID
export async function deleteUserById(userId: string) {
    try {
        await deleteDoc(doc(db, "users", userId));
        return true;
    } catch (error) {
        console.error("Error deleting user:", error);
        return false;
    }
}

import { limit, orderBy, query, Timestamp } from "firebase/firestore";

// Fetch total properties & recently added properties
export async function fetchPropertyStats() {
    const propertiesRef = collection(db, "properties");

    // Get total properties count
    const totalSnapshot = await getDocs(propertiesRef);
    const totalProperties = totalSnapshot.size;

    // Get recently added properties (last 7 days)
    const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const recentQuery = query(propertiesRef, orderBy("createdAt", "desc"), limit(5)); 
    const recentSnapshot = await getDocs(recentQuery);
    const recentProperties = recentSnapshot.docs.map(doc => doc.data());

    return { totalProperties, recentProperties };
}

// Fetch total users count
export async function fetchUserStats() {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    const totalUsers = usersSnapshot.size;

    return { totalUsers };
}