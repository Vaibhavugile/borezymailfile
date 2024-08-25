import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse'; // Import PapaParse for CSV handling
import editIcon from '../../assets/Edit.png';
import deleteIcon from '../../assets/Trash Can - Copy.png';
import downloadIcon from '../../assets/Download.png'; // Add icon for download
import uploadIcon from '../../assets/Upload.png'; // Add icon for upload
import Sidebar from '../Leads/Sidebar';
import Header from '../Leads/Header';
import '../Profile/Profile.css';
import search from '../../assets/Search.png';

const AdminDashboard = () => {
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [importedData, setImportedData] = useState(null); // For storing imported CSV data
  
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const fetchBranches = async () => {
      const branchesCollection = collection(db, 'branches');
      const branchSnapshot = await getDocs(branchesCollection);
      const branchList = branchSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });
      setBranches(branchList);
    };

    fetchBranches();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'branches', id));
      setBranches(branches.filter(branch => branch.id !== id));
    } catch (error) {
      console.error('Error deleting branch:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-branch/${id}`);
  };

  const calculateRemainingDays = (deactiveDate) => {
    if (!deactiveDate) return 'N/A';
    const end = new Date(deactiveDate);
    const today = new Date();
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const applyFilter = (branches) => {
    switch (activeFilter) {
      case 'ongoing':
        return branches.filter(branch => calculateRemainingDays(branch.deactiveDate) > 0);
      case 'expiring':
        return branches.filter(branch => calculateRemainingDays(branch.deactiveDate) > 0 && calculateRemainingDays(branch.deactiveDate) <= 5);
      case 'expired':
        return branches.filter(branch => calculateRemainingDays(branch.deactiveDate) <= 0);
      case 'all':
      default:
        return branches;
    }
  };

  const filteredBranches = applyFilter(branches).filter(branch => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      branch.branchCode.toLowerCase().includes(lowerCaseQuery) ||
      branch.branchName.toLowerCase().includes(lowerCaseQuery) ||
      branch.emailId.toLowerCase().includes(lowerCaseQuery) ||
      branch.location.toLowerCase().includes(lowerCaseQuery) ||
      branch.ownerName.toLowerCase().includes(lowerCaseQuery) ||
      branch.subscriptionType.toLowerCase().includes(lowerCaseQuery) ||
      branch.amount.toString().includes(lowerCaseQuery) ||
      branch.numberOfUsers.toString().includes(lowerCaseQuery) ||
      (calculateRemainingDays(branch.deactiveDate) > 0 ? 'active' : 'deactive').includes(lowerCaseQuery)
    );
  });

  const handleImport = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        console.log(result.data);
        setImportedData(result.data); // Store imported data
        // You can now process the data and push it to Firestore if needed
      },
    });
  };

  const handleExport = () => {
    const csv = Papa.unparse(branches); // Convert branch data to CSV format
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'branches.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <Header onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
      </div>
      <div class="toolbar-container">
        <div className="search-bar-container">
          <img src={search} alt="search icon" className="search-icon" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="action-buttons">
          <button onClick={handleExport} className="action-button">
            <img src={downloadIcon} alt="Export" className="icon" />
            Export
          </button>
          <label htmlFor="import" className="action-button">
            <img src={uploadIcon} alt="Import" className="icon" />
            Import
            <input
              type="file"
              id="import"
              accept=".csv"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <div className="create-branch-container">
           <button onClick={() => navigate('/create-branch')}>Create Branch</button>
          </div>
        </div>
        </div>
      
      <h2 style={{marginLeft: '10px', marginTop: '100px', fontFamily: 'Public Sans', fontStyle: 'normal', fontWeight: '600', fontSize: '24px', lineHeight: '28px', color: '#000000' }}>
        Total Branches ({filteredBranches.length})
      </h2>
      <div className="filter-buttons-container">
        <span 
          className={activeFilter === 'all' ? 'active-filter' : ''} 
          onClick={() => setActiveFilter('all')}
        >
          Show All
        </span>
        <span 
          className={activeFilter === 'ongoing' ? 'active-filter' : ''} 
          onClick={() => setActiveFilter('ongoing')}
        >
          Ongoing Subscriptions
        </span>
        <span 
          className={activeFilter === 'expiring' ? 'active-filter' : ''} 
          onClick={() => setActiveFilter('expiring')}
        >
          Expiring Soon
        </span>
        <span 
          className={activeFilter === 'expired' ? 'active-filter' : ''} 
          onClick={() => setActiveFilter('expired')}
        >
          Expired
        </span>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Serial No.</th>
              <th>Branch Code</th>
              <th>Branch Name/Email</th>
              <th>Location</th>
              <th>Owner Name</th>
              <th>Subscription Type</th>
              <th>Users</th>
              <th>Password</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Subscription Fees</th>
              <th>Remaining Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.map((branch, index) => (
              <tr key={branch.id}>
                <td>{index + 1}</td>
                <td>{branch.branchCode}</td>
                <td>{branch.branchName}<br />{branch.emailId}</td>
                <td>{branch.location}</td>
                <td>{branch.ownerName}</td>
                <td>{branch.subscriptionType}</td>
                <td>{branch.numberOfUsers}</td>
                <td>{branch.password}</td>
                <td>{branch.activeDate || 'N/A'}</td>
                <td>{branch.deactiveDate || 'N/A'}</td>
                <td>{branch.amount}</td>
                <td>{calculateRemainingDays(branch.deactiveDate)}</td>
                <td className={calculateRemainingDays(branch.deactiveDate) > 0 ? 'status-active' : 'status-deactive'}>
                  {calculateRemainingDays(branch.deactiveDate) > 0 ? 'Active' : 'Deactive'}
                </td>
                <td className="actions">
                  <button className="button1" onClick={() => handleEdit(branch.id)}>
                    <img src={editIcon} alt="Edit" className="icon" />
                  </button>
                  {/* <button className="button1" onClick={() => handleDelete(branch.id)}>
                    <img src={deleteIcon} alt="Delete" className="icon" />
                  </button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
