import React, { useState } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, doc, addDoc, getDoc, query, getDocs, orderBy, writeBatch, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function Booking() {
  const [productCode, setProductCode] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false); 
  const [userDetails, setUserDetails] = useState({ name: '', email: '', contact: '' });
  const [receipt, setReceipt] = useState(null); // Store receipt details
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false); // Track if payment is confirmed
  const navigate = useNavigate();

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

      if (bookingsLess.length > 0 && bookingsGreater.length === 0) {
        const overlappingBooking = bookingsLess.find(
          (booking) => booking.returnDate > pickupDateObj
        );

        if (overlappingBooking) {
          availableQuantity -= overlappingBooking.quantity;
        }
      } else if (bookingsGreater.length > 0 && bookingsLess.length === 0) {
        const overlappingBookings = bookingsGreater.filter(
          (booking) => booking.pickupDate < returnDateObj
        );

        if (overlappingBookings.length > 0) {
          const totalOverlapQuantity = overlappingBookings.reduce((sum, booking) => sum + booking.quantity, 0);
          availableQuantity -= totalOverlapQuantity;
        }
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

      return availableQuantity;

    } catch (error) {
      console.error('Error checking availability:', error);
      setErrorMessage('Failed to check availability. Please try again.');
      return 0;
    }
  };

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

      let newBookingId = existingBookings.length + 1;
      for (let i = 0; i < existingBookings.length; i++) {
        if (pickupDateObj < existingBookings[i].pickupDate) {
          newBookingId = i + 1;
          break;
        }
      }

      const batch = writeBatch(db);
      if (newBookingId <= existingBookings.length) {
        existingBookings.forEach((booking, index) => {
          if (index + 1 >= newBookingId) {
            const bookingDocRef = doc(bookingsRef, booking.id);
            batch.update(bookingDocRef, {
              bookingId: index + 2,
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

  const calculateTotalPrice = (price, deposit, numDays, quantity) => {
    const totalPrice = price * numDays * quantity;
    return {
      totalPrice,
      deposit,
      grandTotal: totalPrice + deposit,
    };
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

      const bookingId = await getNextBookingId(pickupDateObj);

      const availableQuantity = await checkAvailability(pickupDateObj, returnDateObj, bookingId);

      if (availableQuantity >= quantity) {
        setIsFormVisible(true);
      } else {
        setErrorMessage(`Not enough product available. Only ${availableQuantity} units left for the selected dates.`);
        setIsFormVisible(false);
      }
    } catch (error) {
      console.error('Error processing booking:', error);
      setErrorMessage('Failed to process booking. Please try again.');
    }
  };

  const handleBookingConfirmation = async (e) => {
    e.preventDefault();

    try {
      const pickupDateObj = new Date(pickupDate);
      const returnDateObj = new Date(returnDate);
      const numDays = (returnDateObj - pickupDateObj) / (1000 * 60 * 60 * 24);

      const productRef = doc(db, 'products', productCode);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        setErrorMessage('Product not found.');
        return;
      }

      const productData = productDoc.data();
      const { price, deposit } = productData;

      const totalCost = calculateTotalPrice(price, deposit, numDays, quantity);

      await addDoc(collection(productRef, 'bookings'), {
        bookingId: await getNextBookingId(pickupDateObj),
        pickupDate: pickupDateObj,
        returnDate: returnDateObj,
        quantity: parseInt(quantity, 10),
        userDetails,
        price,
        totalCost: totalCost.totalPrice,
        deposit: totalCost.deposit,
      });

      setReceipt(totalCost);

    } catch (error) {
      console.error('Error confirming booking:', error);
      setErrorMessage('Failed to confirm booking. Please try again.');
    }
  };

  const handleConfirmPayment = async () => {
    try {
      const pickupDateObj = new Date(pickupDate);
      const returnDateObj = new Date(returnDate);

      const productRef = doc(db, 'products', productCode);

      // Storing the booking data in the Firestore database
      await addDoc(collection(productRef, 'bookings'), {
        bookingId: await getNextBookingId(pickupDateObj),
        pickupDate: pickupDateObj,
        returnDate: returnDateObj,
        quantity: parseInt(quantity, 10),
        userDetails,
        price: receipt.totalPrice,
        deposit: receipt.deposit,
        totalCost: receipt.grandTotal,
      });

      setIsPaymentConfirmed(true);
      alert('Payment Confirmed! Booking has been saved.');
      navigate('/thank-you'); // Redirect after confirmation, change route as needed
    } catch (error) {
      console.error('Error confirming payment:', error);
      setErrorMessage('Failed to confirm payment. Please try again.');
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
        <button type="submit">Check Availability</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {isFormVisible && (
        <form onSubmit={handleBookingConfirmation}>
          <h2>Customer Details</h2>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={userDetails.name}
              onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={userDetails.email}
              onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Contact</label>
            <input
              type="text"
              value={userDetails.contact}
              onChange={(e) => setUserDetails({ ...userDetails, contact: e.target.value })}
              required
            />
          </div>
          <button type="submit">Confirm Booking</button>
        </form>
      )}

      {receipt && (
        <div className="receipt-container">
          <h2>Payment Receipt</h2>
          <p>Deposit: ${receipt.deposit}</p>
          <p>Total Price: ${receipt.totalPrice}</p>
          <p>Grand Total: ${receipt.grandTotal}</p>

          {!isPaymentConfirmed && (
            <button onClick={handleConfirmPayment}>Confirm Payment</button>
          )}

          {isPaymentConfirmed && (
            <p className="success-message">Payment confirmed! Your booking has been saved.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Booking;
