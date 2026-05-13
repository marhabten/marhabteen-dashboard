import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, getDoc, limit, orderBy, query, setDoc, Timestamp, updateDoc } from "firebase/firestore";

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

// Update a user's wallet balance
export async function updateUserWallet(userId: string, newBalance: number) {
    try {
        await updateDoc(doc(db, "users", userId), { wallet: newBalance });
        return true;
    } catch (error) {
        console.error("Error updating wallet:", error);
        return false;
    }
}

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

// Update multiple property fields at once
export async function updatePropertyDetails(
  propertyId: string,
  fields: Record<string, any>
) {
  try {
    const propertyRef = doc(db, "properties", propertyId);
    await updateDoc(propertyRef, fields);
    return true;
  } catch (error) {
    console.error("Error updating property details:", error);
    return false;
  }
}

// Toggle isFeatured on a property
export async function toggleFeatured(propertyId: string, isFeatured: boolean) {
    try {
        const propertyRef = doc(db, "properties", propertyId);
        await updateDoc(propertyRef, { isFeatured });
        return true;
    } catch (error) {
        console.error("Error toggling featured:", error);
        return false;
    }
}

// Fetch all bookings
export async function fetchBookings() {
    try {
        const bookingsRef = collection(db, "bookings");
        const querySnapshot = await getDocs(bookingsRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
    }
}

// Delete a booking by ID
export async function deleteBookingById(bookingId: string) {
    try {
        await deleteDoc(doc(db, "bookings", bookingId));
        return true;
    } catch (error) {
        console.error("Error deleting booking:", error);
        return false;
    }
}

export async function createManualBooking(booking: {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  guests: number;
  checkIn: string;   // "dd/MM/yyyy"
  checkOut: string;  // "dd/MM/yyyy"
  billingMethod: string;
  paymentStatus: string;
  notes: string;
  propertyId: string;
  hostId: string;
  guestId: string;
  totalPrice: number;
  remainingToPay: number;
  paid: number;
}) {
  try {
    // 1. Write booking document
    await setDoc(doc(db, 'bookings', booking.id), {
      ...booking,
      hostStatus: 'pending',
      guestStatus: 'pending',
    });

    // 2. Add booking ID to user's bookings array (only for real users)
    if (booking.guestId) {
      try {
        await updateDoc(doc(db, 'users', booking.guestId), {
          bookings: arrayUnion(booking.id),
        });
      } catch { /* user may not exist — skip */ }
    }

    // 3. Mark property dates as booked
    const propertyRef = doc(db, 'properties', booking.propertyId);
    const propertySnap = await getDoc(propertyRef);
    if (propertySnap.exists()) {
      const data = propertySnap.data();
      const dates: any[] = data.dates || [];

      const parseFS = (s: string) => {
        const [d, m, y] = s.split('/').map(Number);
        return new Date(y, m - 1, d);
      };

      const checkIn = parseFS(booking.checkIn);
      const checkOut = parseFS(booking.checkOut);

      const updated = dates.map((entry) => {
        const entryDate = parseFS(entry.date);
        if (entryDate >= checkIn && entryDate < checkOut) {
          return { ...entry, isBooked: true, isAvailable: false, bookingId: booking.id };
        }
        return entry;
      });

      await updateDoc(propertyRef, { dates: updated });
    }

    return true;
  } catch (error) {
    console.error('Error creating manual booking:', error);
    return false;
  }
}

export async function updateBooking(
  bookingId: string,
  oldCheckIn: string,   // "dd/MM/yyyy" — original dates to free
  oldCheckOut: string,
  updated: {
    fullName: string;
    email: string;
    phoneNumber: string;
    guests: number;
    checkIn: string;    // "dd/MM/yyyy" — new dates
    checkOut: string;
    billingMethod: string;
    paymentStatus: string;
    hostStatus: string;
    guestStatus: string;
    notes: string;
    totalPrice: number;
    remainingToPay: number;
    paid: number;
    propertyId: string;
  }
) {
  try {
    const parseFS = (s: string) => {
      const [d, m, y] = s.split('/').map(Number);
      return new Date(y, m - 1, d);
    };

    const propertyRef = doc(db, 'properties', updated.propertyId);
    const propertySnap = await getDoc(propertyRef);

    if (propertySnap.exists()) {
      const data = propertySnap.data();
      const dates: any[] = data.dates || [];

      const oldCI = parseFS(oldCheckIn);
      const oldCO = parseFS(oldCheckOut);
      const newCI = parseFS(updated.checkIn);
      const newCO = parseFS(updated.checkOut);

      const patchedDates = dates.map((entry) => {
        const d = parseFS(entry.date);
        const wasBooked = entry.bookingId === bookingId && d >= oldCI && d < oldCO;
        const willBeBooked = d >= newCI && d < newCO;

        if (wasBooked && !willBeBooked) {
          // Free this date
          return { ...entry, isBooked: false, isAvailable: true, bookingId: null };
        }
        if (!wasBooked && willBeBooked) {
          // Reserve this date
          return { ...entry, isBooked: true, isAvailable: false, bookingId };
        }
        if (wasBooked && willBeBooked) {
          // Still reserved — keep bookingId
          return { ...entry, isBooked: true, isAvailable: false, bookingId };
        }
        return entry;
      });

      await updateDoc(propertyRef, { dates: patchedDates });
    }

    await updateDoc(doc(db, 'bookings', bookingId), {
      ...updated,
    });

    return true;
  } catch (error) {
    console.error('Error updating booking:', error);
    return false;
  }
}