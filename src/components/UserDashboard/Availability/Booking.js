import React, { useState } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, doc, addDoc, query, getDocs, getDoc, updateDoc, orderBy, limit, writeBatch, setDoc ,where} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function Booking() {
  const [productCode, setProductCode] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Function to check availability based on overlapping bookings
// Function to check availability based on the new conditions
const checkAvailability = async (pickupDateObj, returnDateObj, bookingId) => {
  try {
    const productRef = doc(db, 'products', productCode);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      setErrorMessage('Product not found.');
      return 0;
    }

    const productData = productDoc.data();
    const maxAvailableQuantity = productData.quantity || 0;

    const bookingsRef = collection(productRef, 'bookings');

    // Fetch the "less" and "greater" bookings
    const qLess = query(bookingsRef, where('bookingId', '<', bookingId), orderBy('bookingId', 'asc'));
    const qGreater = query(bookingsRef, where('bookingId', '>', bookingId), orderBy('bookingId', 'asc'));

    const querySnapshotLess = await getDocs(qLess);
    const querySnapshotGreater = await getDocs(qGreater);

    const bookingsLess = [];
    const bookingsGreater = [];

    querySnapshotLess.forEach((doc) => {
      const bookingData = doc.data();
      bookingsLess.push({
        bookingId: bookingData.bookingId,
        pickupDate: bookingData.pickupDate.toDate(),
        returnDate: bookingData.returnDate.toDate(),
        quantity: bookingData.quantity,
      });
    });

    querySnapshotGreater.forEach((doc) => {
      const bookingData = doc.data();
      bookingsGreater.push({
        bookingId: bookingData.bookingId,
        pickupDate: bookingData.pickupDate.toDate(),
        returnDate: bookingData.returnDate.toDate(),
        quantity: bookingData.quantity,
      });
    });

    let availableQuantity = maxAvailableQuantity;

    // Logic when there are only "less" bookings
    if (bookingsLess.length > 0 && bookingsGreater.length === 0) {
      const overlappingBooking = bookingsLess.find(
        (booking) => booking.returnDate > pickupDateObj
      );

      if (overlappingBooking) {
        availableQuantity -= overlappingBooking.quantity;
      }

    // Logic when there are only "greater" bookings
    } else if (bookingsGreater.length > 0 && bookingsLess.length === 0) {
      const overlappingBookings = bookingsGreater.filter(
        (booking) => booking.pickupDate < returnDateObj
      );

      if (overlappingBookings.length > 0) {
        const totalOverlapQuantity = overlappingBookings.reduce((sum, booking) => sum + booking.quantity, 0);
        availableQuantity -= totalOverlapQuantity;
      }

    // Logic when there are both "less" and "greater" bookings
    } else if (bookingsLess.length > 0 && bookingsGreater.length > 0) {
      const lessOverlapBooking = bookingsLess.find(
        (booking) => booking.returnDate > pickupDateObj
      );
      const greaterOverlapBookings = bookingsGreater.filter(
        (booking) => booking.pickupDate < returnDateObj
      );

      let totalOverlapQuantity = 0;

      if (lessOverlapBooking) {
        totalOverlapQuantity += lessOverlapBooking.quantity;
      }

      if (greaterOverlapBookings.length > 0) {
        totalOverlapQuantity += greaterOverlapBookings.reduce((sum, booking) => sum + booking.quantity, 0);
      }

      availableQuantity -= totalOverlapQuantity;
    }

    console.log('Available quantity after updated checks:', availableQuantity);
    return availableQuantity;

  } catch (error) {
    console.error('Error checking availability:', error);
    setErrorMessage('Failed to check availability. Please try again.');
    return 0;
  }
};

  

  

  // Function to get the next booking ID and position the booking appropriately
  const getNextBookingId = async (pickupDateObj) => {
    try {
      const productRef = doc(db, 'products', productCode);
      const bookingsRef = collection(productRef, 'bookings');
      const q = query(bookingsRef, orderBy('pickupDate', 'asc'));
      const querySnapshot = await getDocs(q);
  
      const existingBookings = [];
      querySnapshot.forEach((doc) => {
        const bookingData = doc.data();
        existingBookings.push({
          id: doc.id,
          bookingId: bookingData.bookingId,
          pickupDate: bookingData.pickupDate.toDate(),
          returnDate: bookingData.returnDate.toDate(),
          quantity: bookingData.quantity,
        });
      });
  
      // Determine the new bookingId based on the pickupDate order
      let newBookingId = existingBookings.length + 1;
      for (let i = 0; i < existingBookings.length; i++) {
        if (pickupDateObj < existingBookings[i].pickupDate) {
          newBookingId = i + 1; // Insert before this booking
          break;
        }
      }
  
      // Reorder the booking IDs if necessary
      const batch = writeBatch(db);
      if (newBookingId <= existingBookings.length) {
        existingBookings.forEach((booking, index) => {
          if (index + 1 >= newBookingId) {
            const bookingDocRef = doc(bookingsRef, booking.id);
            batch.update(bookingDocRef, {
              bookingId: index + 2, // Increment the bookingId
            });
          }
        });
      }
      await batch.commit();
  
      return newBookingId;
    } catch (error) {
      console.error('Error getting next booking ID:', error);
      setErrorMessage('Failed to get booking ID. Please try again.');
      return null;
    }
  };
  
  // Updated handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const pickupDateObj = new Date(pickupDate);
      const returnDateObj = new Date(returnDate);
  
      // Ensure that the pickup date is before the return date
      if (pickupDateObj >= returnDateObj) {
        setErrorMessage('Return date must be after pickup date.');
        return;
      }
  
      // Get the next booking ID based on the pickup date
      const bookingId = await getNextBookingId(pickupDateObj);
  
      // Check availability for the new booking, considering adjacent bookings with bookingId - 1 and bookingId + 1
      const availableQuantity = await checkAvailability(pickupDateObj, returnDateObj, bookingId);
  
      if (availableQuantity >= quantity) {
        // Reference to the product document
        const productRef = doc(db, 'products', productCode);
        const bookingsRef = collection(productRef, 'bookings');
  
        // Add the new booking document
        await addDoc(bookingsRef, {
          bookingId: bookingId,  // Store the calculated bookingId
          pickupDate: pickupDateObj,
          returnDate: returnDateObj,
          quantity: parseInt(quantity, 10),
        });
  
        // Update the available quantity in the product document
      //   const newAvailableQuantity = availableQuantity - quantity;
      //  await updateDoc(productRef, {
      //   availableQuantity: newAvailableQuantity,  // Update availableQuantity instead of quantity
      //  });

  
        alert('Booking successful!');
        navigate('/bookingconfirmation');
      } else {
        setErrorMessage(`Not enough product available. Only ${availableQuantity} units left for the selected dates.`);
      }
    } catch (error) {
      console.error('Error processing booking:', error);
      setErrorMessage('Failed to process booking. Please try again.');
    }
  };
  

  
  return (
    <div className="booking-container">
      <h1>Create Booking</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Code</label>
          <input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Pickup Date</label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Return Date</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit">Book Product</button>
      </form>
    </div>
  );
}

export default Booking;
