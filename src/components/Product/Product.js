import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './Product.css';
import UserHeader from '../UserDashboard/UserHeader';
import UserSidebar from '../UserDashboard/UserSidebar';
import searchIcon from '../../assets/Search.png';
import downloadIcon from '../../assets/Download.png';
import uploadIcon from '../../assets/Upload.png';
import { useUser } from '../Auth/UserContext';
import ProductDetailSidebar from './ProductDetailSidebar';

const ProductDashboard = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('productName');
  const [importedData, setImportedData] = useState(null);
  const navigate = useNavigate();
  const { userData } = useUser();
  const [customFields, setCustomFields] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);  // State for selected product

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('branchCode', '==', userData.branchCode)
        );
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Gather all custom fields from products
        const allCustomFields = new Set();
        fetchedProducts.forEach((product) => {
          if (product.customFields) {
            Object.keys(product.customFields).forEach(field => allCustomFields.add(field));
          }
        });

        setProducts(fetchedProducts);
        setTotalProducts(fetchedProducts.length);
        setCustomFields([...allCustomFields]);
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
      setProducts(products); // Show all products if search query is empty
    } else {
      const filteredProducts = products.filter(product =>
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
          }));
          setImportedData(importedProducts);
        },
      });
    }
  };
  const handleProductCodeClick = (product) => {
    setSelectedProduct(product);
    setRightSidebarOpen(true);
  };
  const closeRightSidebar = () => {
    setRightSidebarOpen(false);
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>
          Total Products
        </h2>
        <p style={{ marginLeft: '10px' }}>{totalProducts} Products</p>
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
            <div className="create-branch-container">
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
                  <th>Rent</th>
                  <th>Deposit</th>
                  {/* Dynamically add custom field headers */}
                  {customFields.map((field, index) => (
                    <th key={index}>{field.replace(/([A-Z])/g, ' $1')}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>
                      {Array.isArray(product.imageUrls) && product.imageUrls.length > 0 ? (
                        <img src={product.imageUrls[0]} alt={product.productName} className="product-image" />
                      ) : (
                        product.imageUrl && (
                          <img src={product.imageUrl} alt={product.productName} className="product-image" />
                        )
                      )}
                    </td>
                    <td>{product.productName}</td>
                    <td onClick={() => handleProductCodeClick(product)} style={{ cursor: 'pointer' }} className="clickable">
                      {product.productCode}
                    </td>

                    <td>{product.brandName}</td>
                    <td>{product.description}</td>
                    <td>{product.quantity}</td>
                    <td>{product.price}</td>
                    <td>{product.deposit}</td>
                    {/* Render custom field values */}
                    {customFields.map((field, fieldIndex) => (
                      <td key={fieldIndex}>{product.customFields?.[field] || '-'}</td>
                    ))}
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
        <ProductDetailSidebar
          isOpen={rightSidebarOpen}
          onClose={() =>  closeRightSidebar(false)}
          product={selectedProduct}
          customFields={customFields}
        />
      </div>
    </div>
  );
};

export default ProductDashboard;
