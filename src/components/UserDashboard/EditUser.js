import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig'; // Firebase config import
import './EditUser.css';

const EditUser = () => {
  const { id } = useParams();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false); // Active/Deactive state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const docRef = doc(db, 'subusers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUser(userData);
          setIsActive(userData.isActive || false); // Set active status
        } else {
          console.error('User not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'subusers', id);
      await updateDoc(docRef, {
        ...user,
        isActive, // Save the active/deactive state
      });
      alert('User updated successfully!'); // Show success notification
      navigate('/users'); // Redirect back to user dashboard
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.'); // Show error notification
    }
  };

  return (
    <div className="edit-user-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="edit-user-form">
          <h2>Edit User</h2>
          <label>Name:</label>
          <input
            type="text"
            value={user.name || ''}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />

          <label>Email:</label>
          <input
            type="text"
            value={user.email || ''}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />

          <label>Salary:</label>
          <input
            type="text"
            value={user.salary || ''}
            onChange={(e) => setUser({ ...user, salary: e.target.value })}
          />

          <label>Contact Number:</label>
          <input
            type="text"
            value={user.contactNumber || ''}
            onChange={(e) => setUser({ ...user, contactNumber: e.target.value })}
          />

          <label>Role:</label>
          <input
            type="text"
            value={user.role || ''}
            onChange={(e) => setUser({ ...user, role: e.target.value })}
          />

          <label>Permission:</label>
          <input
            type="text"
            value={user.permission || ''}
            onChange={(e) => setUser({ ...user, permission: e.target.value })}
          />

          <label>Active:</label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={() => setIsActive(!isActive)} // Toggle active status
          />

          <button onClick={handleSave}>Save</button>
        </div>
      )}
    </div>
  );
};

export default EditUser;
