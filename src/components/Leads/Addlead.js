import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import '../Branch/createBranch.css'; // Using the same CSS file

const Lead = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    contactNumber: '',
    emailId: '',
    location: '',
    assignedTo: '',
    source: '',
    nextFollowup: '',
    status: 'details shared',
    comment: '' // Added comment field
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { businessName, businessType, contactNumber, emailId, location, assignedTo, source, nextFollowup, status, comment } = formData;

    try {
      await addDoc(collection(db, 'leads'), {
        businessName,
        businessType,
        contactNumber,
        emailId,
        location,
        assignedTo,
        source,
        nextFollowup,
        status,
        comment // Storing comment in the database
      });

      setSuccess('Lead created successfully.');
      navigate('/admin-dashboard');
    } catch (error) {
      setError('Failed to create lead. Please try again.');
    }
  };

  return (
    <div className="create-branch">
      <h2>Add A Lead</h2>
      <form onSubmit={handleCreateLead}>
        <div className="field-row">
          <div>
            <label>Business Name</label>
            <input 
              type="text" 
              name="businessName" 
              value={formData.businessName} 
              onChange={handleChange} 
              placeholder="Enter Business Name" 
              required 
            />
          </div>
          <div>
            <label>Business Type</label>
            <input 
              type="text" 
              name="businessType" 
              value={formData.businessType} 
              onChange={handleChange} 
              placeholder="Enter Business Type" 
              required 
            />
          </div>
        </div>
        <div className="field-row">
          <div>
            <label>Contact Number</label>
            <input 
              type="text" 
              name="contactNumber" 
              value={formData.contactNumber} 
              onChange={handleChange} 
              placeholder="Enter Contact Number" 
              required 
            />
          </div>
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
        </div>
        <div className="field-row">
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
          <div>
            <label>Assigned To</label>
            <input 
              type="text" 
              name="assignedTo" 
              value={formData.assignedTo} 
              onChange={handleChange} 
              placeholder="Enter Assigned To" 
              required 
            />
          </div>
        </div>

        <label>Source</label>
        <input 
          type="text" 
          name="source" 
          value={formData.source} 
          onChange={handleChange} 
          placeholder="Enter Source" 
          required 
        />

        <label>Next Follow-Up</label>
        <input 
          type="datetime-local" 
          name="nextFollowup" 
          value={formData.nextFollowup} 
          onChange={handleChange} 
          required 
        />

        <label>Status</label>
        <select 
          name="status" 
          value={formData.status} 
          onChange={handleChange} 
          required
        >
          <option value="details shared">Details Shared</option>
          <option value="demo scheduled">Demo Scheduled</option>
          <option value="demo done">Demo Done</option>
          <option value="lead won">Lead Won</option>
          <option value="lead lost">Lead Lost</option>
        </select>

        <label>Comment</label> {/* New label for comments */}
        <textarea
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          placeholder="Enter any comments here"
        />

        <button type="submit">Create Lead</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default Lead;
