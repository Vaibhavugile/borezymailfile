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
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('branchName'); // Default search by branch name
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

  useEffect(() => {
    const applyFilter = () => {
      let filtered = branches;
      
      if (searchQuery) {
        filtered = filtered.filter(branch => {
          const query = searchQuery.toLowerCase();
          const fieldValue = branch[searchField]?.toString().toLowerCase();
          return fieldValue?.includes(query);
        });
      }
      
      setFilteredBranches(filtered);
    };

    applyFilter();
  }, [branches, searchQuery, searchField]);

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

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredBranches);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'branches.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (result) => {
          const importedBranches = result.data.map((row) => ({
            ...row,
            deactiveDate: new Date(row.deactiveDate).toISOString(),
          }));
          setImportedData(importedBranches);
        },
      });
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <Header onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>All Branches ({filteredBranches.length})</h2>

        <div className="toolbar-container">
          <div className="search-bar-container">
            <img src={search} alt="search icon" className="search-icon" />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="search-dropdown"
            >
              <option value="branchName">Branch Name</option>
              <option value="emailId">Email Id</option>
              <option value="branchCode">Branch Code</option>
              <option value="location">Location</option>
              <option value="ownerName">Owner Name</option>
              <option value="subscriptionType">Subscription Type</option>
              <option value="numberOfUsers">Number of Users</option>
              <option value="activeDate">Active Date</option>
              <option value="deactiveDate">Deactive Date</option>
              <option value="status">Status</option>
            </select>
            <input
              type="text"
              placeholder={`Search by ${searchField.replace(/([A-Z])/g, ' $1')}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button onClick={exportToCSV} className="action-button">
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
    </div>
  );
};

export default AdminDashboard;
