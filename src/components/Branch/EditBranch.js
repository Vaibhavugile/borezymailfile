// src/components/EditBranch.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useParams, useNavigate } from 'react-router-dom';
import './editBranch.css';
 
const EditBranch = () => {
  const { id } = useParams(); // Get branch ID from URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    emailId: '',
    branchCode: '',
    branchName: '',
    ownerName: '',
    subscriptionType: 'monthly',
    startDate: '',
    endDate: '',
    numberOfUsers: 5,
    amount: '',
    password: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get today's date in yyyy-mm-dd format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        const branchDoc = doc(db, 'branches', id);
        const branchSnapshot = await getDoc(branchDoc);
        if (branchSnapshot.exists()) {
          setFormData(branchSnapshot.data());
        } else {
          setError('Branch not found.');
        }
      } catch (error) {
        setError('Error fetching branch details.');
      }
    };

    fetchBranchData();
  }, [id]);

  // Function to handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  // Function to increase or decrease the number of users
  // const handleNumberChange = (operation) => {
  //   setFormData(prevState => ({
  //     ...prevState,
  //     numberOfUsers: operation === 'increase' ? prevState.numberOfUsers + 1 : Math.max(prevState.numberOfUsers - 1, 5),
  //   }));
  // };

  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { startDate } = formData;
    if (new Date(startDate) < new Date(today)) {
      setError('Start date cannot be before today.');
      return;
    }

    try {
      const branchDoc = doc(db, 'branches', id);
      await updateDoc(branchDoc, formData);
      setSuccess('Branch details updated successfully.');
      navigate('/admin-dashboard');
    } catch (error) {
      setError('Failed to update branch details. Please try again.');
    }
  };

  return (
    <div className="create-branch">
      <h2>Edit Branch</h2>
      <form onSubmit={handleUpdateBranch}>
        {/* Email ID and Password */}
        <div className="field-row">
          <div>
            <label>Email ID</label>
            <input 
              type="email" 
              name="emailId" 
              value={formData.emailId} 
              onChange={handleChange} 
              
              required 
            />
          </div>
          <div>
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
             
              required 
            />
          </div>
        </div>
        <div className="field-row">
          <div>
            <label>Branch Code</label>
            <input 
              type="text" 
              name="branchCode" 
              value={formData.branchCode} 
              onChange={handleChange} 
              
              required 
            />
          </div>
          <div>
            <label>Location</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              
              required 
            />
          </div>
        </div>
        <label>Branch Name</label>
        <input 
          type="text" 
          name="branchName" 
          value={formData.branchName} 
          onChange={handleChange} 
          
          required 
        />
        
        <label>Owner Name</label>
        <input 
          type="text" 
          name="ownerName" 
          value={formData.ownerName} 
          onChange={handleChange} 
          
          required 
        />
        
        <label>Subscription Type</label>
        <select 
          name="subscriptionType" 
          value={formData.subscriptionType} 
          onChange={handleChange} 
          required
        >
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        
        <div className="date-fields-container">
          <div>
            <label>Start Date</label>
            <input 
                type="date" 
                name="startDate" 
                value={formData.startDate} 
                onChange={handleChange} 
                min={today} 
                required 
            />
          </div>
          <div>
            <label>End Date</label>
            <input 
                type="date" 
                name="endDate" 
                value={formData.endDate} 
                onChange={handleChange} 
                required 
            />
          </div>
        </div>

        <div className="number-of-users-amount-container">
          <div className="number-of-users-container">
            <label htmlFor="numberOfUsers">Number of Users</label>
            <input
              type="number"
              id="numberOfUsers"
              name="numberOfUsers"
              value={formData.numberOfUsers}
              onChange={handleChange}
            />
          </div>
          <div className="amount-container">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit">Edit Branch</button>
      </form>
      
      {/* Success/Error Message */}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default EditBranch;
