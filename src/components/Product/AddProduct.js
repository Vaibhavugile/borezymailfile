import React, { useState, useEffect } from 'react';
import './Addproduct.css';
import UserHeader from '../UserDashboard/UserHeader';
import { db } from '../../firebaseConfig'; // Ensure firebaseConfig is correctly set up
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserSidebar from '../UserDashboard/UserSidebar';
import { useUser } from '../Auth/UserContext'; // Access user data from context

function AddProduct() {
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [productCode, setProductCode] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [branchCode, setBranchCode] = useState(''); // Store branch code

  const { userData } = useUser(); // Get user data from context

  // Set branchCode based on user data if available
  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  // Handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);  // Store selected image
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Reference to Firebase Storage
      const storage = getStorage();
      let imageUrl = '';

      // If an image was selected, upload it
      if (image) {
        const storageRef = ref(storage, `products/${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Add product details to Firestore with the image URL and branchCode
      await addDoc(collection(db, 'products'), {
        productName,
        brandName,
        quantity: parseInt(quantity, 10), // Convert quantity to a number
        price: parseFloat(price),         // Convert price to a float
        deposit: parseFloat(deposit),     // Convert deposit to a float
        productCode,
        description,
        imageUrl,                         // Save the image URL in Firestore
        branchCode,                       // Store the branch code with the product
      });

      alert('Product added successfully!');
      // Optionally, reset the form here
      setProductName('');
      setBrandName('');
      setQuantity('');
      setPrice('');
      setDeposit('');
      setProductCode('');
      setDescription('');
      setImage(null);

    } catch (error) {
      console.error('Error adding product: ', error);
      alert('Failed to add product');
    }
  };

  return (
    <div className='add-product-container'>
      <UserHeader onMenuClick={toggleSidebar} />
      <div className='issidebar'>
        <UserSidebar isOpen={isSidebarOpen} />
        <div className="add-user-container">
          <h1>Add New Product</h1>
          <p className="subheading">Fill out the form below to add a new product</p>
          
          <form className="add-user-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input 
                type="text" 
                id="name" 
                placeholder="Enter name" 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="brand">Brand Name</label>
              <input 
                type="text" 
                id="brand" 
                placeholder="Enter brand name" 
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input 
                type="number" 
                id="quantity" 
                placeholder="Enter quantity" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input 
                type="text" 
                id="price" 
                placeholder="Enter price" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="productCode">Product Code</label>
              <input 
                type="text" 
                id="productCode" 
                placeholder="Enter product code" 
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input 
                type="text" 
                id="description" 
                placeholder="Enter description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="image">Upload Image</label>
              <input 
                type="file" 
                id="image" 
                onChange={handleImageChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="deposit">Deposit</label>
              <input 
                type="text" 
                id="deposit" 
                placeholder="Enter deposit" 
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="branchCode">Branch Code</label>
              <input 
                type="text" 
                id="branchCode" 
                value={branchCode} 
                readOnly
                placeholder="Branch Code"
              />
            </div>

            <div className="button-group">
              <button type="button" className="btn cancel">Cancel</button>
              <button type="button" className="btn customise">Customise</button>
              <button type="submit" className="btn add-employee">Add Product</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
