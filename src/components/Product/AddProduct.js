import React, { useState, useEffect } from 'react';
import './Addproduct.css';
import UserHeader from '../UserDashboard/UserHeader';
import { db } from '../../firebaseConfig'; // Ensure firebaseConfig is correctly set up
import { collection, doc, addDoc, setDoc } from 'firebase/firestore'; // Import setDoc for custom document ID
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserSidebar from '../UserDashboard/UserSidebar';
import { useUser } from '../Auth/UserContext'; // Access user data from context
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function AddProduct() {
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [productCode, setProductCode] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); // Handle multiple images
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [branchCode, setBranchCode] = useState(''); // Store branch code
  const [customFields, setCustomFields] = useState([]); // Store custom fields
  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false); // Toggle form visibility
  const [newFieldLabel, setNewFieldLabel] = useState(''); // New field label
  const [newFieldType, setNewFieldType] = useState('text'); // New field input type
  const [customFieldValues, setCustomFieldValues] = useState({}); // Store values for custom fields
  const [bookingId, setBookingId] = useState(''); // State for booking ID

  const { userData } = useUser(); // Get user data from context
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files)); // Convert FileList to an array
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAddCustomField = () => {
    if (newFieldLabel) {
      setCustomFields([...customFields, { label: newFieldLabel, type: newFieldType }]);
      setNewFieldLabel('');
      setNewFieldType('text');
      setShowCustomFieldForm(false);
    }
  };

  const handleDeleteCustomField = (index) => {
    const updatedCustomFields = customFields.filter((_, i) => i !== index);
    setCustomFields(updatedCustomFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const storage = getStorage();
      const imageUrls = [];

      for (const image of images) {
        const storageRef = ref(storage, `products/${image.name}`);
        await uploadBytes(storageRef, image);
        const imageUrl = await getDownloadURL(storageRef);
        imageUrls.push(imageUrl);
      }

      const productData = {
        productName,
        brandName,
        quantity: parseInt(quantity, 10),
        price: parseFloat(price),
        deposit: parseFloat(deposit),
        productCode,
        description,
        imageUrls,
        branchCode,
        customFields: customFieldValues,
      };

      // Use setDoc to explicitly set the document ID as productCode
      const productRef = doc(collection(db, 'products'), productCode);
      await setDoc(productRef, productData);

      // Add an empty bookings sub-collection
       // Initially empty sub-collection
       
        await setDoc(doc(collection(productRef, 'bookings'), bookingId), {}); // Empty document with bookingId as ID
      

      alert('Product and bookings added successfully!');
      navigate('/productdashboard');
      
      // Reset form
      setProductName('');
      setBrandName('');
      setQuantity('');
      setPrice('');
      setDeposit('');
      setProductCode('');
      setDescription('');
      setImages([]);
      setCustomFieldValues({});

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
                multiple
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

            {/* Render custom fields */}
            {customFields.map((field, index) => (
              <div className="form-group" key={index}>
                <label htmlFor={field.label}>{field.label}</label>
                <input 
                  type={field.type} 
                  id={field.label}
                  placeholder={`Enter ${field.label}`} 
                  value={customFieldValues[field.label] || ''}
                  onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.label]: e.target.value })}
                  required
                />
                <button type="button" onClick={() => handleDeleteCustomField(index)}>Delete</button>
              </div>
            ))}

            {/* Custom Field Section */}
            {showCustomFieldForm && (
              <div className="form-group">
                <label htmlFor="newFieldLabel">Custom Field Label</label>
                <input 
                  type="text" 
                  id="newFieldLabel" 
                  placeholder="Enter custom label" 
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                />
                <label htmlFor="newFieldType">Input Type</label>
                <select 
                  id="newFieldType" 
                  value={newFieldType} 
                  onChange={(e) => setNewFieldType(e.target.value)}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
                <button type="button" className="btn customise" onClick={handleAddCustomField}>Add Custom Field</button>
              </div>
            )}

            <div className="button-group">
              <button type="button" className="btn customise" onClick={() => setShowCustomFieldForm(!showCustomFieldForm)}>
                {showCustomFieldForm ? 'Cancel' : 'Add Custom Field'}
              </button>
              <button type="submit" className="btn add-product">Add Product</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
