import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, arrayRemove, collection, deleteDoc, doc, getDocs, setDoc, Timestamp, updateDoc } from "firebase/firestore";

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

import { limit, orderBy, query } from "firebase/firestore";

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

interface Property {
    id: string;
    locationTitle: string;
    locationDescription: string;
    imageUrl: string;
    images: string[];
    ownerPropertyName: string;
    placeType: string;
    hostingType: string;
    email: string;
    isAvailable: boolean;
    isBooked: boolean;
    facilitiesName?: string[];
    rentalUnit?: string;
    reviewData?: Record<string, any>;
    squareFeet?: string;
    cancelationPolicy?: string;
}

import { getDoc } from "firebase/firestore";

export async function fetchPropertyById(propertyId: string) {
    try {
        console.log("Firebase : Fetching property with ID:" , propertyId )
        const propertyRef = doc(db, "properties", propertyId);
        const propertyDoc = await getDoc(propertyRef);

        if (propertyDoc.exists()) {
            return { id: propertyDoc.id, ...propertyDoc.data()} as Property;
        } else {
            console.error("Property not found.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching property:", error);
        return null;
    }
}

// Delete an image from the property in Firestore
export async function deletePropertyImage(propertyId: string, imageUrl: string) {
    try {
        const propertyRef = doc(db, "properties", propertyId);
        await updateDoc(propertyRef, {
            images: arrayRemove(imageUrl),
        });
        console.log(`Image deleted from property: ${propertyId}`);
        return true;
    } catch (error) {
        console.error("Error deleting image:", error);
        return false;
    }
}

// Update property title in Firestore
export async function updatePropertyTitle(propertyId: string, newTitle: string) {
    try {
        const propertyRef = doc(db, "properties", propertyId);
        await updateDoc(propertyRef, { locationTitle: newTitle });
        console.log(`Title updated for property: ${propertyId}`);
        return true;
    } catch (error) {
        console.error("Error updating property title:", error);
        return false;
    }
}

// Update property description in Firestore
export async function updatePropertyDescription(propertyId: string, newDescription: string) {
    try {
        const propertyRef = doc(db, "properties", propertyId);
        await updateDoc(propertyRef, { locationDescription: newDescription });
        console.log(`Description updated for property: ${propertyId}`);
        return true;
    } catch (error) {
        console.error("Error updating property description:", error);
        return false;
    }
}

// Fetch all vouchers
export async function fetchVouchers() {
    try {
        const querySnapshot = await getDocs(collection(db, "vouchers"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching vouchers:", error);
        return [];
    }
}

// Add new vouchers
export async function addVouchers(value: number, quantity: number, exported: boolean) {
    try {
        const vouchersRef = collection(db, "vouchers");
        const voucherPromises = [];

        for (let i = 0; i < quantity; i++) {
            const code = generateVoucherCode();
            const voucherData = {
                code,
                createdAt: Timestamp.now(),
                isRedeemed: false,
                value,
                exported, // Store exported status
            };
            voucherPromises.push(addDoc(vouchersRef, voucherData));
        }

        await Promise.all(voucherPromises);
        console.log(`${quantity} vouchers of ${value} LYD created.`);
        return true;
    } catch (error) {
        console.error("Error adding vouchers:", error);
        return false;
    }
}

// Delete a voucher
export async function deleteVoucher(voucherId: string) {
    try {
        const voucherRef = doc(db, "vouchers", voucherId);
        await deleteDoc(voucherRef);
        console.log(`Voucher ${voucherId} deleted.`);
        return true;
    } catch (error) {
        console.error("Error deleting voucher:", error);
        return false;
    }
}

// Update voucher export status in Firestore
export async function updateVoucherExportStatus(voucherIds: string[]) {
    try {
        const batchPromises = voucherIds.map(async (id) => {
            const voucherRef = doc(db, "vouchers", id);
            await updateDoc(voucherRef, { exported: true });
        });

        await Promise.all(batchPromises);
        console.log(`Export status updated for vouchers: ${voucherIds.join(", ")}`);
        return true;
    } catch (error) {
        console.error("Error updating voucher export status:", error);
        return false;
    }
}


// Helper function to generate a random voucher code
function generateVoucherCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Create a new admin user
export async function createAdminUser(email: string, password: string) {
    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Add user to Firestore with admin role, using the UID as the document ID
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            email: email,
            role: "admin",
            createdAt: Timestamp.now(),
        });

        console.log(`Admin user created with UID as document ID: ${user.uid}`);
        return true;
    } catch (error) {
        console.error("Error creating admin user:", error);
        return false;
    }
}
