import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useUser } from '../Auth/UserContext';
import { useNavigate } from 'react-router-dom';
import './Salesreport.css';

const SalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productReportData, setProductReportData] = useState([]);
  const { userData } = useUser();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 50;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSalesData = async () => {
      if (userData && userData.branchCode) {
        const branchCode = userData.branchCode;
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, where('branchCode', '==', branchCode));
        const productsSnapshot = await getDocs(productsQuery);

        const allSalesData = [];
        const uniqueProducts = new Set();

        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          const bookingsRef = collection(db, 'products', productDoc.id, 'bookings');
          const bookingsSnapshot = await getDocs(bookingsRef);

          uniqueProducts.add(productData.productName);

          bookingsSnapshot.forEach((bookingDoc) => {
            const bookingData = bookingDoc.data();
            allSalesData.push({
              productId: productDoc.id,
              productName: productData.productName,
              productType: productData.type,
              pickupDate: bookingData.pickupDate ? bookingData.pickupDate.toDate() : null,
              quantity: bookingData.quantity,
              price: bookingData.price || 0,
              deposit: bookingData.deposit || 0,
              totalCost: bookingData.totalCost || 0,
              bookingId: bookingDoc.id,
            });
          });
        }

        setSalesData(allSalesData);
        setAllProducts(Array.from(uniqueProducts));
      }
    };

    fetchSalesData();
  }, [userData]);

  // Fetch total product report
  useEffect(() => {
    const fetchProductReportData = async () => {
      if (userData && userData.branchCode) {
        const branchCode = userData.branchCode;
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, where('branchCode', '==', branchCode));
        const productsSnapshot = await getDocs(productsQuery);

        const productReport = [];

        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          const bookingsRef = collection(db, 'products', productDoc.id, 'bookings');
          const bookingsSnapshot = await getDocs(bookingsRef);

          let totalQuantity = 0;
          let totalBooked = 0;
          let totalPrice = 0;
          let totalDeposit = 0;

          bookingsSnapshot.forEach((bookingDoc) => {
            const bookingData = bookingDoc.data();
            totalQuantity += bookingData.quantity || 0;
            totalBooked += 1;
            totalPrice += (bookingData.price || 0) * (bookingData.quantity || 0);
            totalDeposit += bookingData.deposit || 0;
          });

          productReport.push({
            productId: productDoc.id,
            productName: productData.productName,
            brandName: productData.brandName || 'N/A',
            totalBooked,
            totalPrice,
            totalDeposit,
            totalQuantity,
          });
        }

        setProductReportData(productReport);
      }
    };

    fetchProductReportData();
  }, [userData]);

  // Filter product report data
  const filteredProductReportData = productReportData.filter((product) => {
    const productName = product.productName ? product.productName.toLowerCase() : '';
    const productId = product.productId ? product.productId.toLowerCase() : '';

    return productName.includes(searchTerm.toLowerCase()) || productId.includes(searchTerm.toLowerCase());
  });

  const filteredSalesData = salesData
    .filter((sale) => {
      const saleDate = new Date(sale.pickupDate);
      const isWithinDateRange =
        (!startDate || saleDate >= new Date(startDate)) &&
        (!endDate || saleDate <= new Date(endDate));

      const productName = sale.productName ? sale.productName.toLowerCase() : '';
      const productId = sale.productId ? sale.productId.toLowerCase() : '';
      const productType = sale.productType ? sale.productType.toLowerCase() : '';

      const matchesSearchTerm =
        productName.includes(searchTerm.toLowerCase()) ||
        productId.includes(searchTerm.toLowerCase()) ||
        productType.includes(searchTerm.toLowerCase());

      return isWithinDateRange && matchesSearchTerm;
    })
    .sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate)); // Sort recent to old

  const totalEntries = filteredSalesData.length;
  const totalSalesAmount = filteredSalesData.reduce((total, sale) => total + sale.totalCost, 0);
  const totalRentAmount = filteredSalesData.reduce((total, sale) => total + (sale.price * sale.quantity), 0);

  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfFirstEntry = (currentPage - 1) * entriesPerPage;
  const indexOfLastEntry = indexOfFirstEntry + entriesPerPage;

  // Most Rented and Never Rented Products Logic
  const mostRentedProducts = filteredProductReportData
    .filter((product) => product.totalBooked > 0)
    .sort((a, b) => b.totalBooked - a.totalBooked);

  const neverRentedProducts = filteredProductReportData.filter((product) => product.totalBooked === 0);

  return (
    <div className="sales-report-container">
      <h2>Sales Report</h2>
      <button className="back-button" onClick={() => navigate('/welcome')}>
        Back to Dashboard
      </button>
       {/* Most Rented Products Table */}
       <h3>Most Rented Products</h3>
      <table className="sales-table">
        <thead>
          <tr>
            <th>SR.No</th>
            <th>Product Code</th>
            <th>Product Name</th>
            <th>Total Booked</th>
            <th>Total Rent</th>
            <th>Total Deposit</th>
            <th>Total Quantity</th>
          </tr>
        </thead>
        <tbody>
          {mostRentedProducts.length === 0 ? (
            <tr>
              <td colSpan="7">No product data found</td>
            </tr>
          ) : (
            mostRentedProducts.map((product, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{product.productId}</td>
                <td>{product.productName}</td>
                <td>{product.totalBooked}</td>
                <td>{product.totalPrice.toFixed(2)}</td>
                <td>{product.totalDeposit.toFixed(2)}</td>
                <td>{product.totalQuantity}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
       {/* Never Rented Products Table */}
       <h3>Never Rented Products</h3>
      <table className="sales-table">
        <thead>
          <tr>
            <th>SR.No</th>
            <th>Product Code</th>
            <th>Product Name</th>
          </tr>
        </thead>
        <tbody>
          {neverRentedProducts.length === 0 ? (
            <tr>
              <td colSpan="3">No product data found</td>
            </tr>
          ) : (
            neverRentedProducts.map((product, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{product.productId}</td>
                <td>{product.productName}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Date filters and search bar */}
      <div className="filters">
        <div className="date-filters">
          <label>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by product name or Code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {/* Daily Product Report Table */}
      <h3>Daily Product Report</h3>
      <table className="sales-table">
        <thead>
          <tr>
            <th>SR.No</th>
            <th>Date</th>
            <th>Product Code</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Rent Amount</th>
            <th>Deposit</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredSalesData.length === 0 ? (
            <tr>
              <td colSpan="8">No sales data found</td>
            </tr>
          ) : (
            filteredSalesData.slice(indexOfFirstEntry, indexOfLastEntry).map((sale, index) => (
              <tr key={index}>
                <td>{indexOfFirstEntry + index + 1}</td>
                <td>{sale.pickupDate ? sale.pickupDate.toDateString() : 'N/A'}</td>
                <td>{sale.productId}</td>
                <td>{sale.productName}</td>
                <td>{sale.quantity}</td>
                <td>{(sale.price * sale.quantity).toFixed(2)}</td>
                <td>{sale.deposit.toFixed(2)}</td>
                <td>{(sale.totalCost || (sale.price * sale.quantity) + sale.deposit).toFixed(2)}</td>
              </tr>
            ))
          )}
          {/* Total Rent and Total Amount */}
          {filteredSalesData.length > 0 && (
            <tr className="totals-row">
              <td colSpan="5" className="totals-label">Total</td>
              <td>{totalRentAmount.toFixed(2)}</td>
              <td></td>
              <td>{totalSalesAmount.toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
  <span>{${indexOfFirstEntry + 1}-${Math.min(indexOfLastEntry, totalEntries)} out of ${totalEntries}}</span>
  <div>
    <button 
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
      disabled={currentPage === 1}
    >
      Previous
    </button>
    <button 
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
      disabled={currentPage === totalPages}
    >
      Next
    </button>
  </div>
</div>
{/* Total Product Report */}
<h3>Total Product Report</h3>

{/* Search Bar */}
<div style={{ position: 'relative', textAlign: 'right', marginBottom: '10px' }}>
  <input
    type="text"
    placeholder="Search by product name or Code"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    style={{
      padding: '8px 35px 8px 10px', // Padding adjusted to fit the icon inside
      borderRadius: '4px',
      border: '1px solid #ccc',
      width: '250px', // Adjust as needed
    }}
  />
  {/* SVG Search Icon */}
  <span 
    style={{
      position: 'absolute',
      right: '10px', // Distance from the right of the input box
      top: '50%',
      transform: 'translateY(-50%)', // Vertically center the icon
      pointerEvents: 'none', // Make the icon non-clickable
    }}
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      fill="gray" 
      viewBox="0 0 16 16"
    >
      <path 
        d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.207 1.318a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"
      />
    </svg>
  </span>
</div>

{/* Product Table */}
<table className="sales-table">
  <thead>
    <tr>
      <th>SR.No</th>
      <th>Product Code</th>
      <th>Product Name</th>
      <th>Total Quantity</th>
      <th>Total Booked</th>
      <th>Total Rent</th>
      <th>Total Deposit</th>
    </tr>
  </thead>
  <tbody>
    {filteredProductReportData.length === 0 ? (
      <tr>
        <td colSpan="7">No product data found</td>
      </tr>
    ) : (
      filteredProductReportData.map((product, index) => (
        <tr key={index}>
          <td>{index + 1}</td>
          <td>{product.productId}</td>
          <td>{product.productName}</td>
          <td>{product.totalQuantity}</td>
          <td>{product.totalBooked}</td>
          <td>{product.totalPrice.toFixed(2)}</td>
          <td>{product.totalDeposit.toFixed(2)}</td>
        </tr>
      ))
      )}
      </tbody>
      </table>
    </div>
  );
};

export default SalesReport;
