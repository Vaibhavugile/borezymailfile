import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore'; // Firestore methods
import { db } from '../../firebaseConfig'; // Firebase config
import { useNavigate } from 'react-router-dom'; // Navigation
import { useUser } from '../Auth/UserContext'; // Access user data from context
import './Adduser.css';

const AddUser = () => {
  const { userData } = useUser(); // Get user data from context
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [permission, setPermission] = useState('');
  const [date, setDate] = useState('');
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [branchCode, setBranchCode] = useState(''); // Store branch code

  const navigate = useNavigate(); // For navigation

  // Directly set branchCode if userData is available
  if (userData && userData.branchCode && branchCode === '') {
    setBranchCode(userData.branchCode); // Set branch code from userData
    console.log('Fetched branch code:', userData.branchCode); // Debugging
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare new user data
    const newUser = {
      name,
      email,
      salary,
      contactNumber,
      password,
      role,
      permission,
      date,
      isCheckboxChecked,
      branchCode,
    };

    try {
      // Add new user to Firestore 'subusers' collection
      const docRef = await addDoc(collection(db, 'subusers'), newUser);
      console.log('User added with ID: ', docRef.id);

      // Fetch the corresponding branch document using branchCode
      const branchRef = doc(db, 'branches', branchCode);
      console.log('Branch Reference Path:', branchRef.path); // Debugging
      const branchSnap = await getDoc(branchRef);

      if (branchSnap.exists()) {
        const branchData = branchSnap.data();
        
        const currentUsers = branchData.numberOfUsers || 0;

        // Decrement the number of users in the branch
        await updateDoc(branchRef, {
          numberOfUsers: Math.max(0, currentUsers - 1), // Ensure the number of users does not go below 0
        });

        console.log('Branch user count updated.');
      } else {
        console.error('Branch not found. Branch Code:', branchCode);
      }

      // Reset form fields after submission
      setName('');
      setEmail('');
      setSalary('');
      setContactNumber('');
      setPassword('');
      setRole('');
      setPermission('');
      setDate('');
      setIsCheckboxChecked(false);

      alert('User added successfully');
      navigate('/userdashboard'); // Redirect to user dashboard after success
    } catch (error) {
      console.error('Error adding user: ', error);
      alert('Failed to add user');
    }
  };

  const handleCancel = () => {
    navigate('/userdashboard'); // Redirect to user dashboard on cancel
  };

  return (
    <div className="add-user-container">
      <h1>Add New User</h1>
      <p className="subheading">Fill out the form below to add a new user to your account</p>

      <form className="add-user-form" onSubmit={handleSubmit}>
        <div className="form-left">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Id</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email id"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="salary">Salary</label>
            <input
              type="number"
              id="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Enter salary"
              required
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="datetime-local"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-right">
          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              type="text"
              id="contactNumber"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter mobile number"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="text"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter role"
              required
            />
          </div>
          <div className="form-group">
            <label>Permission</label>
            <div className="permission-container">
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                required
              >
                <option value="">Select permission</option>
                <option value="invoice">Invoice</option>
                <option value="users">Users</option>
                <option value="product">Product</option>
                <option value="whatsapp_template">Whatsapp Template</option>
                <option value="sales">Sales</option>
              </select>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isCheckboxChecked}
                onChange={(e) => setIsCheckboxChecked(e.target.checked)}
              />
              Grant all permissions
            </label>
          </div>
          <div className="form-group">
            <label>Branch Code</label>
            <input
              type="text"
              value={branchCode}
              readOnly
              placeholder="Branch code"
            />
          </div>
        </div>

        <div className="button-group">
          <button type="button" className="btn cancel" onClick={handleCancel}>Cancel</button>
          <button type="submit" className="btn add-employee">Add Employee</button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
