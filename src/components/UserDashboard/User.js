import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './User.css';
import UserHeader from './UserHeader';
import UserSidebar from './UserSidebar';
import { useUser } from '../Auth/UserContext'; // User context for fetching logged-in user data

const UserDashboard = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0); // State to keep track of total users
  const [loading, setLoading] = useState(true); // Loading state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { userData } = useUser(); // Fetch the logged-in user's data

  useEffect(() => {
    const fetchUsersAndBranchData = async () => {
      try {
        if (userData && userData.branchCode) {
          // Fetch subusers where branchCode matches the logged-in user's branchCode
          const q = query(
            collection(db, 'subusers'),
            where('branchCode', '==', userData.branchCode)
          );
          const querySnapshot = await getDocs(q);
          const fetchedUsers = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setUsers(fetchedUsers); // Set the filtered subusers

          // Fetch the branch document for the logged-in user's branchCode
          const branchRef = doc(db, 'branches', userData.branchCode);
          const branchSnap = await getDoc(branchRef);
          if (branchSnap.exists()) {
            const branchData = branchSnap.data();
            setTotalUsers(branchData.numberOfUsers || 0); // Update total number of users
          } else {
            console.error('Branch not found. Branch Code:', userData.branchCode);
          }
        } else {
          console.log('No userData or branchCode available.');
        }
      } catch (error) {
        console.error('Error fetching users or branch data:', error);
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchUsersAndBranchData();
  }, [userData]); // Re-run when userData updates

  const handleDelete = async (id) => {
    try {
      // Get the document reference and fetch user data
      const userDocRef = doc(db, 'subusers', id);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const branchCode = userData.branchCode;

        // Delete the user document
        await deleteDoc(userDocRef);

        // Fetch the corresponding branch document
        const branchRef = doc(db, 'branches', branchCode);
        const branchSnap = await getDoc(branchRef);
        if (branchSnap.exists()) {
          const branchData = branchSnap.data();
          const currentUsers = branchData.numberOfUsers || 0;

          // Decrement the number of users in the branch
          await updateDoc(branchRef, {
            numberOfUsers: currentUsers + 1,
          });

          console.log('Branch user count updated.');
        } else {
          console.error('Branch not found. Branch Code:', branchCode);
        }

        // Remove deleted user from the state
        setUsers(users.filter((user) => user.id !== id));
        setTotalUsers(totalUsers + 1); // Update total number of users
      } else {
        console.error('User not found. ID:', id);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edituser/${id}`);
  };

  const handleAddUser = () => {
    navigate('/adduser');
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <h2 style={{ marginLeft: '10px', marginTop: '100px', fontFamily: 'Public Sans', fontStyle: 'normal', fontWeight: '600', fontSize: '24px', lineHeight: '28px', color: '#000000' }}>
          Total Users
        </h2>
        <p style={{ marginLeft: '10px', fontFamily: 'Public Sans', fontStyle: 'normal', fontWeight: '400', fontSize: '20px', lineHeight: '24px', color: '#000000' }}>
          {totalUsers} Users
        </p>
        <div className="toolbar-container">
          <button onClick={handleAddUser} className="create-branch-container">
            Add New User
          </button>
        </div>
        <div className="table-container">
          {loading ? (
            <p>Loading users...</p> // Display loading state
          ) : users.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Salary</th>
                  <th>Contact Number</th>
                  <th>Role</th>
                  <th>Permission</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.salary}</td>
                    <td>{user.contactNumber}</td>
                    <td>{user.role}</td>
                    <td>{user.permission}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(user.id)} className="action-button edit">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="action-button delete">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No users found for this branch.</p> // Display message when no users are found
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
