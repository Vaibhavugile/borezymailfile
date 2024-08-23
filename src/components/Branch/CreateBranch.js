// src/components/CreateBranch.js
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { sendEmail } from '../../utils/sendEmail';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './createBranch.css'

const CreateBranch = () => {
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
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { emailId, branchCode, branchName, ownerName, subscriptionType, startDate, endDate, numberOfUsers, amount, password, location } = formData;

    if (new Date(startDate) < new Date(today)) {
      setError('Start date cannot be before today.');
      return;
    }

    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, emailId, password);

      await addDoc(collection(db, 'branches'), {
        emailId,
        branchCode,
        branchName,
        ownerName,
        subscriptionType,
        startDate,
        endDate,
        numberOfUsers,
        amount,
        password,
        location
      });

      await sendEmail(emailId, password, ownerName, startDate, endDate, amount);

      setSuccess('Branch created, user account set up, and email sent successfully.');
      navigate('/admin-dashboarda/client');
    } catch (error) {
      setError('Failed to create branch or user. Please try again.');
    }
  };

  return (
    <div className="create-branch">
      <h2>Add A Branch</h2>
      <form onSubmit={handleCreateBranch}>
        <div className="field-row">
          <div>
            <label>Email ID</label>
            <input 
              type="email" 
              name="emailId" 
              value={formData.emailId} 
              onChange={handleChange} 
              placeholder="Enter Email ID" 
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
              placeholder="Enter Password" 
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
              placeholder="Enter Branch Code" 
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
              placeholder="Enter Location" 
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
          placeholder="Enter Branch Name" 
          required 
        />
        
        <label>Owner Name</label>
        <input 
          type="text" 
          name="ownerName" 
          value={formData.ownerName} 
          onChange={handleChange} 
          placeholder="Enter Owner Name" 
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

        <button type="submit">Create Branch</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default CreateBranch;
