import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './Profile.css';

const data = [
  { name: 'Jan', activity: 4000, subscriptions: 2400, revenue: 2400 },
  { name: 'Feb', activity: 3000, subscriptions: 1398, revenue: 2210 },
  { name: 'Mar', activity: 2000, subscriptions: 9800, revenue: 2290 },
  { name: 'Apr', activity: 2780, subscriptions: 3908, revenue: 2000 },
  { name: 'May', activity: 1890, subscriptions: 4800, revenue: 2181 },
  { name: 'Jun', activity: 2390, subscriptions: 3800, revenue: 2500 },
  { name: 'Jul', activity: 3490, subscriptions: 4300, revenue: 2100 },
];

const SingleComponent = () => {
  const [superAdmins, setSuperAdmins] = useState([]);

  const fetchSuperAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'superadmins'));
      const adminsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSuperAdmins(adminsData);
    } catch (error) {
      console.error('Error fetching Super Admins:', error);
    }
  };

  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  return (
    <div className="dashboard-container2">
      <div className="content-wrapper">
        <h1>Overview</h1>
        <div className="overview">
          <div className="overview-item">
            <h3>User Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activity" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overview-item">
            <h3>Total Subscriptions</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="subscriptions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overview-item">
            <h3>Total Revenue</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="performance">
          <h3>Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="super-admin-table">
          <h3>Recently Created Super Admin</h3>
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {superAdmins.length > 0 ? (
                superAdmins.map((admin, index) => (
                  <tr key={admin.id}>
                    <td>{index + 1}</td>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No Data Available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SingleComponent;
