import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse'; // Import PapaParse for CSV operations
import './Product.css'; // Import your CSS file
import UserHeader from '../UserDashboard/UserHeader';
import UserSidebar from '../UserDashboard/UserSidebar';
import searchIcon from '../../assets/Search.png'; // Import search icon
import downloadIcon from '../../assets/Download.png'; // Import download icon
import uploadIcon from '../../assets/Upload.png'; // Import upload icon
import { useUser } from '../Auth/UserContext'; 

const ProductDashboard = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0); // State to keep track of total products
  const [loading, setLoading] = useState(true); // Loading state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const [searchField, setSearchField] = useState('productName'); // Search field state
  const [importedData, setImportedData] = useState(null); // Imported data state
  const navigate = useNavigate();
  const { userData } = useUser(); 
  const [originalProducts, setOriginalProducts] = useState([]);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('branchCode', '==', userData.branchCode) // Filter by branch code if needed
        );
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(fetchedProducts);
        setOriginalProducts(fetchedProducts);
        setTotalProducts(fetchedProducts.length);
      } catch (error) {
        console.error('Error fetching products data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, [userData]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter((product) => product.id !== id));
      setTotalProducts(totalProducts - 1);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/editproduct/${id}`);
  };

  const handleAddProduct = () => {
    navigate('/addproduct');
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSearch = () => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    if (lowerCaseQuery === '') {
      setProducts(originalProducts); // Show all products if search query is empty
    } else {
      const filteredProducts = originalProducts.filter(product =>
        product[searchField]?.toLowerCase().includes(lowerCaseQuery)
      );
      setProducts(filteredProducts);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, searchField]);

  const exportToCSV = () => {
    const csv = Papa.unparse(products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'products.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (result) => {
          const importedProducts = result.data.map(row => ({
            ...row,
            // Convert date fields if needed
          }));
          setImportedData(importedProducts);
          console.log(importedProducts);
        },
      });
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <h2>Total Products</h2>
        <p>{totalProducts} Products</p>
        <div className="toolbar-container">
          <div className="search-bar-container">
            <img src={searchIcon} alt="search icon" className="search-icon" />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="search-dropdown"
            >
              <option value="productName">Product Name</option>
              <option value="brandName">Brand Name</option>
              <option value="productCode">Product Code</option>
              <option value="description">Description</option>
            </select>
            <input
              type="text"
              placeholder={`Search by ${searchField.replace(/([A-Z])/g, ' $1')}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button onClick={exportToCSV} className="action-button">
              <img src={downloadIcon} alt="Export" className="icon" />
              Export
            </button>
            <label htmlFor="import" className="action-button">
              <img src={uploadIcon} alt="Import" className="icon" />
              Import
              <input
                type="file"
                id="import"
                accept=".csv"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <div className="create-product-container">
              <button onClick={handleAddProduct}>Add New Product</button>
            </div>
          </div>
        </div>
        <div className="table-container">
          {loading ? (
            <p>Loading products...</p>
          ) : products.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Product Code</th>
                  <th>Brand Name</th>
                  <th>Description</th>
                  <th>Quantity</th>

                  <th>Price</th>
                  <th>Deposit</th>
                  
                  
                  
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product,index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.productName} className="product-image" />
                      )}
                    </td>
                    <td>{product.productName}</td>
                    <td>{product.productCode}</td>
                    <td>{product.brandName}</td>
                    <td>{product.description}</td>
                    <td>{product.quantity}</td>
                    <td>{product.price}</td>
                    <td>{product.deposit}</td>
                   
                    
                    
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(product.id)}>Edit</button>
                        <button onClick={() => handleDelete(product.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No products found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDashboard;
