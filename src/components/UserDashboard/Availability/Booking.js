import React, { useState } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, doc, addDoc, query, getDocs, getDoc, updateDoc, orderBy, limit, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function Booking() {
  const [productCode, setProductCode] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Function to check availability based on overlapping bookings
  const checkAvailability = async (pickupDateObj, returnDateObj) => {
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
      const q = query(bookingsRef, orderBy('pickupDate', 'asc'));
      const querySnapshot = await getDocs(q);

      let totalBookedQuantity = 0;
      let isFirstBooking = true;
      let totalAvailableQuantity = maxAvailableQuantity; // Initialize properly

      console.log('Fetched Bookings:'); // Debugging log statement
      querySnapshot.forEach((doc) => {
        const bookingData = doc.data();
        const bookingPickupDate = bookingData.pickupDate.toDate(); // Convert Firestore Timestamp to Date
        const bookingReturnDate = bookingData.returnDate.toDate(); // Convert Firestore Timestamp to Date

        // Log each booking
        console.log('Booking:', {
          bookingPickupDate,
          bookingReturnDate,
          quantity: bookingData.quantity,
        });

        if (pickupDateObj < bookingPickupDate && returnDateObj < bookingPickupDate) {
          totalBookedQuantity += bookingData.quantity;
        } else if (pickupDateObj > bookingReturnDate) {
          totalAvailableQuantity += bookingData.quantity;
        } else if (pickupDateObj > bookingPickupDate && returnDateObj > bookingPickupDate) {
          totalAvailableQuantity -= bookingData.quantity;
        }

        isFirstBooking = false; // There's at least one existing booking
      });

      console.log('Total Available Quantity:', totalAvailableQuantity);

      return totalAvailableQuantity;
    } catch (error) {
      console.error('Error checking availability:', error);
      setErrorMessage('Failed to check availability. Please try again.');
      return 0;
    }
  };

  // Function to get the next booking ID and position the booking appropriately
  const getNextBookingId = async (pickupDateObj, returnDateObj) => {
    try {
      const productRef = doc(db, 'products', productCode);
      const bookingsRef = collection(productRef, 'bookings');
      const q = query(bookingsRef, orderBy('pickupDate', 'asc'));
      const querySnapshot = await getDocs(q);

      const existingBookings = [];
      querySnapshot.forEach((doc) => {
        const bookingData = doc.data();
        const bookingPickupDate = bookingData.pickupDate.toDate();
        const bookingReturnDate = bookingData.returnDate.toDate();
        const bookingId = bookingData.bookingId;

        existingBookings.push({
          bookingId,
          pickupDate: bookingPickupDate,
          returnDate: bookingReturnDate,
        });
      });

      console.log('Existing Bookings:', existingBookings);

      // Determine new booking ID
      let newBookingId = 1;
      let idUpdated = false;

      for (let i = 0; i < existingBookings.length; i++) {
        const booking = existingBookings[i];
        const { bookingId, pickupDate } = booking;

        if (pickupDateObj < pickupDate) {
          // New booking should be inserted before the current booking
          newBookingId = bookingId;
          idUpdated = true;
          break;
        } else {
          newBookingId = bookingId + 1;
        }
      }

      if (!idUpdated) {
        newBookingId = existingBookings.length + 1;
      }

      // Update existing booking IDs if necessary
      const batch = writeBatch(db);
      existingBookings.forEach((booking) => {
        const { bookingId, pickupDate } = booking;
        if (pickupDateObj < pickupDate && bookingId >= newBookingId) {
          const bookingDocRef = doc(bookingsRef, `${bookingId}`);
          batch.update(bookingDocRef, {
            bookingId: bookingId + 1,
          });
        }
      });

      await batch.commit();

      console.log('New Booking ID:', newBookingId);

      return newBookingId;
    } catch (error) {
      console.error('Error getting next booking ID:', error);
      setErrorMessage('Failed to get booking ID. Please try again.');
      return 1; // Default to 1 if there's an error
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const pickupDateObj = new Date(pickupDate);
      const returnDateObj = new Date(returnDate);

      if (pickupDateObj >= returnDateObj) {
        setErrorMessage('Return date must be after pickup date.');
        return;
      }

      // Check availability for overlapping dates and include past quantities
      const availableQuantity = await checkAvailability(pickupDateObj, returnDateObj);

      if (availableQuantity >= quantity) {
        // Get the next booking ID and determine the position
        const bookingId = await getNextBookingId(pickupDateObj, returnDateObj);

        const productRef = doc(db, 'products', productCode);
        const bookingsRef = collection(productRef, 'bookings');

        // Add the booking to Firestore
        await addDoc(bookingsRef, {
          bookingId: bookingId,
          pickupDate: pickupDateObj,
          returnDate: returnDateObj,
          quantity: parseInt(quantity, 10),
        });

        // Update the product quantity
        const newAvailableQuantity = availableQuantity - quantity;
        await updateDoc(productRef, {
          quantity: newAvailableQuantity
        });

        alert('Booking successful!');
        navigate('/bookingconfirmation');
      } else {
        setErrorMessage(
          `Not enough product available. Only ${availableQuantity} units left for the selected dates.`
        );
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
