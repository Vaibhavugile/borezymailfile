import React, { useState } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

function BookProduct() {
  const [productCode, setProductCode] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleBooking = async () => {
    try {
      // Step 1: Create a booking entry in the 'bookings' collection
      await addDoc(collection(db, 'bookings'), {
        productCode,
        pickupDate,
        returnDate,
        quantity
      });

      // Step 2: Reduce the product quantity in the 'products' collection
      const productRef = doc(db, 'products', productCode); // Use productCode to identify the document
      await updateDoc(productRef, {
        quantity: quantity - 1
      });

      alert('Product booked successfully!');
    } catch (error) {
      console.error('Error booking product: ', error);
      alert('Failed to book product.');
    }
  };

  return (
    <div>
      <h1>Book Product</h1>
      <input
        type="text"
        placeholder="Enter Product Code"
        value={productCode}
        onChange={(e) => setProductCode(e.target.value)}
      />
      <input
        type="date"
        placeholder="Pickup Date"
        value={pickupDate}
        onChange={(e) => setPickupDate(e.target.value)}
      />
      <input
        type="date"
        placeholder="Return Date"
        value={returnDate}
        onChange={(e) => setReturnDate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <button onClick={handleBooking}>Book Product</button>
    </div>
  );
}

export default BookProduct;
