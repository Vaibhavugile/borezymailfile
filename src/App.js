import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import ChangePassword from './components/Auth/ChangePassword';
import AdminDashboard from './components/Admin/AdminDashboard';
import Welcome from './components/Welcome';
import CreateBranch from './components/Branch/CreateBranch';
import EditBranch from './components/Branch/EditBranch';
import ActiveLog from './components/Log/ActiveLog';
import Leads from './components/Leads/Leads';
import Product from './components/Product/Product';
import Customize from './components/Customize/Customize';
import CreateSuperAdmin from './components/Profile/CreateSuperAdmin';
import Profile from './components/Profile/Profile';
import Layout from './components/Profile/Layout';
import Lead from './components/./Leads/Addlead';
import { UserProvider } from './components/Auth/UserContext';
import DetailsShared from './components/Leads/Leads';
import DemoScheduled from './components/Leads/Leads';
import DemoDone from './components/Leads/Leads';
import LeadWon from './components/Leads/Leads';
import LeadLost from './components/Leads/Leads';

const App = () => (
  <UserProvider>
  <Router>
    <Routes>
      {/* Uncomment and use if you have a Landing component */}
      {/* <Route path="/" element={<Landing />} /> */}
      <Route path="/" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/create-branch" element={<CreateBranch />} />
      <Route path="/edit-branch/:id" element={<EditBranch />} />
      <Route path="/product" element={<Product />} />
      <Route path="/customize" element={<Customize />} />
      <Route path="/active-log" element={<ActiveLog />} />
      <Route path="/create-lead" element={<Lead />} />
      <Route path="/leads/detail-shared" element={<DetailsShared />} />
      <Route path="/leads/demo-scheduled" element={<DemoScheduled />} />
      <Route path="/leads/demo-done" element={<DemoDone />} />
      <Route path="/leads/lead-won" element={<LeadWon />} />
      <Route path="/leads/lead-lost" element={<LeadLost/>} />

      <Route path="/" element={<Layout />}>
      <Route path="superadmin" element={<CreateSuperAdmin />} /> {/* Route for the LeadForm */}
      <Route path="profile" element={<Profile />} />
    </Route>
    </Routes>
  </Router>
  </UserProvider>
);

export default App;
