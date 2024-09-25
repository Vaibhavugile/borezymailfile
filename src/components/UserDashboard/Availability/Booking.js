import React, { useState,useEffect } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, doc, addDoc, getDoc, query, getDocs, orderBy, writeBatch, where } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL,listAll } from "firebase/storage"; 
import { useNavigate } from 'react-router-dom';
import UserHeader from '../../UserDashboard/UserHeader';
import UserSidebar from '../../UserDashboard/UserSidebar';
import { useUser } from '../../Auth/UserContext';
import "../Availability/Booking.css"
function Booking() {

  const [productCode, setProductCode] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false); 
  const [isAvailabilityFormVisible, setIsAvailabilityFormVisible] = useState(true); 
  const [isAvailability1FormVisible, setIsAvailability1FormVisible] = useState(false); 
  
  const [visibleForm, setVisibleForm] = useState(''); // Track visible form by its id
  const [userDetails, setUserDetails] = useState({ name: '', email: '', contact: '' });

  const [receipt, setReceipt] = useState(null); // Store receipt details
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false); // Track if payment is confirmed
  const [productImageUrl, setProductImageUrl] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [availableQuantity, setAvailableQuantity] = useState(null);
  const [deposit, setDeposit] = useState(0); // Add a state for deposit
  const [price, setPrice] = useState(0); // Add a state for price
  const [numDays, setNumDays] = useState(0);
   // Number of days between pickup and return
  const [products, setProducts] = useState([
    { productCode: '', pickupDate: '', returnDate: '', quantity: '', availableQuantity: null, errorMessage: '',price:'',deposit:'',},
  ]);
  const navigate = useNavigate();
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
 

  const fetchProductImage = async (productCode, index) => {
    try {
      const productRef = doc(db, 'products', productCode);
      const productDoc = await getDoc(productRef);

      if (productDoc.exists()) {
        const productData = productDoc.data();
        const imagePath = productData.imageUrls ? productData.imageUrls[0] : null;

        if (imagePath) {
          const storage = getStorage();
          const imageRef = ref(storage, imagePath);
          const url = await getDownloadURL(imageRef);
          
          // Update the specific product's image URL
          setProducts((prevProducts) => {
            const newProducts = [...prevProducts];
            newProducts[index] = { ...newProducts[index], imageUrl: url }; // Store the image URL in the specific product
            return newProducts;
          });
          console.log('Fetched Image URL:', url);
        } else {
          console.log('No image path found for this product');
          setProducts((prevProducts) => {
            const newProducts = [...prevProducts];
            newProducts[index] = { ...newProducts[index], imageUrl: 'path/to/placeholder-image.jpg' }; // Default image
            return newProducts;
          });
        }
      } else {
        console.log('Product not found in Firestore');
      }
    } catch (error) {
      console.error('Error fetching product image:', error);
    }
  };


  const handleProductChange = (index, event) => {
    const { name, value } = event.target;
    const newProducts = [...products];
    newProducts[index][name] = value;
    if (name === 'productCode') {
      fetchProductImage(value, index);
    } // Update based on input name
    setProducts(newProducts);
  };

  const checkAvailability = async (index) => {
    const { productCode, pickupDate, returnDate, quantity } = products[index];
    const pickupDateObj = new Date(pickupDate);
    const returnDateObj = new Date(returnDate);
    const bookingId = await getNextBookingId(pickupDateObj,productCode);
     // Replace with actual booking ID logic if needed

    try {
      const productRef = doc(db, 'products', productCode);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        const newProducts = [...products];
        newProducts[index].errorMessage = 'Product not found.';
        setProducts(newProducts);
        return;
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
      console.log('Bookings Less:', bookingsLess);  // Log bookings before current booking
      console.log('Bookings Greater:', bookingsGreater);  // Log bookings after current booking
  

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

      const newProducts = [...products];
      newProducts[index].availableQuantity = availableQuantity;
      newProducts[index].errorMessage = ''; // Clear error message if successful
      setProducts(newProducts);

    } catch (error) {
      console.error('Error checking availability:', error);
      const newProducts = [...products];
      newProducts[index].errorMessage = 'Failed to check availability. Please try again.';
      setProducts(newProducts);
    }
  };

  const addProductForm = () => {
    setProducts([...products, { productCode: '', pickupDate: '', returnDate: '', quantity: '', availableQuantity: null, errorMessage: '', productImageUrl: '' }]);
  };




  const getNextBookingId = async (pickupDateObj, productCode) => {
    try {
      // Check if productCode is valid
      if (!productCode) {
        throw new Error('Invalid product code');
      }
  
      // Firestore reference to the specific product's bookings
      const productRef = doc(db, 'products', productCode);
      const bookingsRef = collection(productRef, 'bookings');
      const q = query(bookingsRef, orderBy('pickupDate', 'asc'));
  
      const querySnapshot = await getDocs(q);
  
      const existingBookings = [];
  
      // Loop through the query snapshot to gather existing bookings
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
  
      // Calculate the next booking ID
      let newBookingId = existingBookings.length + 1;
      for (let i = 0; i < existingBookings.length; i++) {
        if (pickupDateObj < existingBookings[i].pickupDate) {
          newBookingId = i + 1;
          break;
        }
      }
  
      // Update existing bookings if necessary
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
  
      // Return the new booking ID for the current product
      return newBookingId;
    } catch (error) {
      console.error('Error getting next booking ID:', error);
      setErrorMessage('Failed to get booking ID. Please try again.');
      return null;
    }
  };
  
  
  
  

  

  const handleBookingConfirmation = async (e) => {
    e.preventDefault();
    
    try {
      let bookingDetails = [];
  
      for (const product of products) {
        const pickupDateObj = new Date(product.pickupDate);
        const returnDateObj = new Date(product.returnDate);
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const days = Math.ceil((returnDateObj - pickupDateObj) / millisecondsPerDay);
  
        const productRef = doc(db, 'products', product.productCode);
        const productDoc = await getDoc(productRef);
  
        if (!productDoc.exists()) {
          product.errorMessage = 'Product not found.';
          continue; // Skip this product if not found
        }
  
        const productData = productDoc.data();
        const { price, deposit } = productData;
        const calculateTotalPrice = (price, deposit, days, quantity) => {
          const totalPrice = price * days * quantity;
          return {
            totalPrice,
            deposit,
            grandTotal: totalPrice + deposit,
          };
        };
  
        const totalCost = calculateTotalPrice(price, deposit, days, product.quantity);
  
        const newBookingId = await getNextBookingId(pickupDateObj, product.productCode);
  
        // Log booking details for debugging
        console.log("Booking details:", {
          bookingId: newBookingId,
          pickupDate: pickupDateObj,
          returnDate: returnDateObj,
          quantity: parseInt(product.quantity, 10),
          userDetails,
          price,
          deposit,
          totalCost: totalCost.totalPrice,
        });
  
        // Save booking details to Firestore
        
  
        bookingDetails.push({
          productCode: product.productCode,
          productImageUrl: product.imageUrl,
          deposit,
          price,
          numDays: days,
          quantity: product.quantity,
          totalPrice: totalCost.totalPrice,
          grandTotal: totalCost.grandTotal,
        });
      }
  
      setReceipt({
        products: bookingDetails,
      });
  
    } catch (error) {
      console.error('Error confirming booking:', error);
      setErrorMessage('An error occurred while confirming your booking. Please try again.');
    }
  };
  
  


  const handleConfirmPayment = async () => {
    try {
      for (const product of products) {
      const pickupDateObj = new Date(product.pickupDate);
      const returnDateObj = new Date(product.returnDate);
      const productRef = doc(db, 'products', product.productCode);
      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const days = Math.ceil((returnDateObj - pickupDateObj) / millisecondsPerDay);
        const productDoc = await getDoc(productRef);
  
        if (!productDoc.exists()) {
          product.errorMessage = 'Product not found.';
          continue; // Skip this product if not found
        }
        const productData = productDoc.data();

        const { price, deposit } = productData;
        const calculateTotalPrice = (price, deposit, days, quantity) => {
          const totalPrice = price * days * quantity;
          return {
            totalPrice,
            deposit,
            grandTotal: totalPrice + deposit,
          };
        };
  
  

      const totalCost = calculateTotalPrice(price, deposit, days, product.quantity);
  
      const newBookingId = await getNextBookingId(pickupDateObj, product.productCode);
      // Ensure receipt.products is an array
      await addDoc(collection(productRef, 'bookings'), {
        bookingId: newBookingId,
        pickupDate: pickupDateObj,
        returnDate: returnDateObj,
        quantity: parseInt(product.quantity, 10),
        userDetails, // Assuming userDetails is the same for all products
        price, // Save price
        deposit, // Save deposit
        totalCost: totalCost.totalPrice, // Save total price
      });
    }

  
      // Iterate through each product and validate its details
      
  
      setIsPaymentConfirmed(true);
      alert('Payment Confirmed! Booking has been saved.');
      navigate('/thank-you');
    } catch (error) {
      console.error('Error confirming payment:', error);
      setErrorMessage(error.message);
    }
  };
  

  
  

  
  
  const toggleAvailabilityForm = () => {
    setIsAvailabilityFormVisible(!isAvailabilityFormVisible);
  };

  const toggleAvailability1Form = () => {
    setIsAvailability1FormVisible(!isAvailability1FormVisible);
  };

  return (
    <div className="booking-container1">
      <UserHeader onMenuClick={toggleSidebar} />
     <div className='issidebar'>
     <UserSidebar isOpen={isSidebarOpen} />
     <button onClick={toggleAvailabilityForm} className='availability-toogle-button'>
          {isAvailabilityFormVisible ? 'Hide Availability Form' : 'Show Availability Form'}
      </button>
      
      {isAvailabilityFormVisible  && (
     
     <div>
      <h2>Check Product Availability </h2>
      {products.map((product, index) => (
        <div key={index} className="product-check" style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <div className="form-group1" style={{ marginTop: '120px' }}>
            <label>Product Code</label>
            <input
              type="text"
              name="productCode"
              value={product.productCode}
              onChange={(e) => handleProductChange(index, e)} 
              required
            />
          </div>
          <div className="form-group1">
            <label>Pickup Date</label>
            <input
              type="datetime-local"
              name="pickupDate"
              value={product.pickupDate}
              onChange={(e) => handleProductChange(index, e)}
              required
            />
          </div>
          <div className="form-group1">
            <label>Return Date</label>
            <input
              type="datetime-local"
              name="returnDate"
              value={product.returnDate}
              onChange={(e) => handleProductChange(index, e)}
              required
            />
          </div>
          <div className="form-group1">
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              value={product.quantity}
              onChange={(e) => handleProductChange(index, e)}
              required
            />
          </div>
          <div className="product-image-container1">
            {product.imageUrl && ( // Change from productImageUrl to product.imageUrl
              <img src={product.imageUrl} alt="Product" className="product-image1" />
            )}
          </div>
          <button type="button" className='checkavailability' onClick={() => checkAvailability(index)}>Check Availability</button>
          <div className="available-quantity-display">
            {product.errorMessage ? (
              <span style={{ color: 'red' }}>{product.errorMessage}</span>
            ) : (
              product.availableQuantity !== null && (
                <p>Available Quantity: {product.availableQuantity}</p>
              )
            )}
          </div>
        </div>
      ))}
      <button className='checkavailability11' onClick={addProductForm}>Add Product</button>
     </div>
      )}

      <button onClick={toggleAvailability1Form} className='availability1-toogle-button'>
          {isAvailability1FormVisible ? 'Hide Customer Details Form' : 'Show Customer Detail  Form'}
      </button>
      
     
      { isAvailability1FormVisible &&  (
       
        <form onSubmit={handleBookingConfirmation}>
          <h3>Customer Details</h3>
         
          
          <div className="form-group1" style={{ marginTop: '80px' }} >
            <label>Name</label>
            <input
              type="text"
              value={userDetails.name}
              onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group1">
            <label>Email</label>
            <input
              type="email"
              value={userDetails.email}
              onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group1">
            <label>Contact</label>
            <input
              type="text"
              value={userDetails.contact}
              onChange={(e) => setUserDetails({ ...userDetails, contact: e.target.value })}
              required
            />
          </div>
          <button type="submit" className='confirm-booking-button'>Confirm Booking</button>
        </form>
      )}

          {receipt && (
            <div className="receipt-container">
              

              {/* Render the headings only once */}
              <div className="receipt-row">
                <div className="receipt-column">
                  <strong>Product Image:</strong>
                </div>
                <div className="receipt-column">
                  <strong>Product Code:</strong>
                </div>
                <div className="receipt-column">
                  <strong>Deposit:</strong>
                </div>
                <div className="receipt-column">
                  <strong>Price per Day:</strong>
                </div>
                <div className="receipt-column">
                  <strong>Quantity:</strong>
                </div>
                <div className="receipt-column">
                  <strong>Number of Days:</strong>
                </div>
                <div className="receipt-column">
                  <strong>Total Price:</strong>
                  
                </div>
                <div className="receipt-column">
                  <strong>Grand Total:</strong>
                </div>
              </div>

              {/* Now map over products and display only the values */}
              {receipt.products.map((product, index) => (
                <div key={index} className="receipt-values">
                  <div className="receipt-column">
                    {product.productImageUrl && (
                      <img src={product.productImageUrl} alt="Product" style={{ width: '30px', height: '30px' }} />
                    )}
                  </div>
                  <div className="receipt-column">{product.productCode}</div>
                  <div className="receipt-column">₹{product.deposit}</div>
                  <div className="receipt-column">₹{product.price}</div>
                  <div className="receipt-column">{product.quantity}</div>
                  <div className="receipt-column">{product.numDays}</div>
                  <div className="receipt-column">₹{product.totalPrice}</div>
                  <div className="receipt-column">₹{product.grandTotal}</div>
                </div>
              ))}

              {!isPaymentConfirmed && (
                <button onClick={handleConfirmPayment}>Confirm Payment</button>
              )}
              {isPaymentConfirmed && (
                <p className="success-message">Payment confirmed! Your booking has been saved.</p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export default Booking;