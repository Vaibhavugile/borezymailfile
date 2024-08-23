import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './product.css';

const Product = () => {
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    const fetchCustomization = async () => {
      if (!auth.currentUser) {
        alert('User is not authenticated');
        return;
      }

      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomFields(docSnap.data().customFields || []);
        }
      } catch (error) {
        console.error('Error fetching custom fields: ', error);
      }
    };

    fetchCustomization();
  }, []);

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <div key={field.label}>
            <label>{field.label}:</label>
            <input type="text" name={field.label} />
          </div>
        );
      case 'number':
        return (
          <div key={field.label}>
            <label>{field.label}:</label>
            <input type="number" name={field.label} />
          </div>
        );
      case 'date':
        return (
          <div key={field.label}>
            <label>{field.label}:</label>
            <input type="date" name={field.label} />
          </div>
        );
      case 'time':
        return (
          <div key={field.label}>
            <label>{field.label}:</label>
            <input type="time" name={field.label} />
          </div>
        );
      case 'dropdown':
        return (
          <div key={field.label}>
            <label>{field.label}:</label>
            <select name={field.label}>
              {field.options.split(',').map((option, index) => (
                <option key={index} value={option.trim()}>
                  {option.trim()}
                </option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="product-form">
      <h2>Add Product</h2>
      <form>
        {customFields.map((field) => renderField(field))}
        <button type="submit">Add Product</button>
      </form>
    </div>
  );
};

export default Product;
