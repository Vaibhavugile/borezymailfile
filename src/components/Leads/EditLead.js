import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useParams, useNavigate } from 'react-router-dom';
import './EditLead.css';



const EditLead = () => {
    const { id } = useParams(); // Get lead ID from URL
    const navigate = useNavigate();
  
    const [formData, setFormData] = useState({
      businessName: '',
      contactNumber: '',
      emailId: '',
      location: '',
      assignedTo: '',
      source: '',
      status: '',
      dateTimestamp: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
  
    // Get today's date in yyyy-mm-dd format
    const today = new Date().toISOString().split('T')[0];
  
    useEffect(() => {
      const fetchLeadData = async () => {
        try {
          const leadDoc = doc(db, 'leads', id);
          const leadSnapshot = await getDoc(leadDoc);
          if (leadSnapshot.exists()) {
            setFormData(leadSnapshot.data());
          } else {
            setError('Lead not found.');
          }
        } catch (error) {
          setError('Error fetching lead details.');
        }
      };
  
      fetchLeadData();
    }, [id]);
  
    // Function to handle input changes
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prevState => ({ ...prevState, [name]: value }));
    };
  
    const handleUpdateLead = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
  
      const { dateTimestamp } = formData;
      if (new Date(dateTimestamp) < new Date(today)) {
        setError('Date timestamp cannot be in the past.');
        return;
      }
  
      try {
        const leadDoc = doc(db, 'leads', id);
        await updateDoc(leadDoc, formData);
        setSuccess('Lead details updated successfully.');
        navigate('/leads-dashboard');
      } catch (error) {
        setError('Failed to update lead details. Please try again.');
      }
    };
  
    return (
      <div className="create-branch">
        <h2>Edit Lead</h2>
        <form onSubmit={handleUpdateLead}>
          <div className="field-row">
            <div>
              <label>Business Name</label>
              <input 
                type="text" 
                name="businessName" 
                value={formData.businessName} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label>Contact Number</label>
              <input 
                type="text" 
                name="contactNumber" 
                value={formData.contactNumber} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
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
          <label>Assigned To</label>
          <input 
            type="text" 
            name="assignedTo" 
            value={formData.assignedTo} 
            onChange={handleChange} 
            required 
          />
          
          <label>Source</label>
          <input 
            type="text" 
            name="source" 
            value={formData.source} 
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
          
          <div className="date-fields-container">
            <div>
              <label>Date Timestamp</label>
              <input 
                  type="datetime-local" 
                  name="dateTimestamp" 
                  value={formData.dateTimestamp} 
                  onChange={handleChange} 
                  required 
              />
            </div>
          </div>
  
          <button type="submit">Edit Lead</button>
        </form>
        
        {/* Success/Error Message */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
    );
  };
  
  export default EditLead;
  