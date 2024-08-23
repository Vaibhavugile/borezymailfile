import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import Papa from 'papaparse'; // Import PapaParse
import './Leads.css';
import editIcon from '../../assets/Edit.png';
import deleteIcon from '../../assets/Trash Can - Copy.png';
import Header from './Header';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import search from '../../assets/Search.png';
import downloadIcon from '../../assets/Download.png'; // Add icon for download
import uploadIcon from '../../assets/Upload.png'; // Add icon for upload

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [importedData, setImportedData] = useState(null); // For storing imported CSV data
  const navigate = useNavigate();
  const location = useLocation();

  const handleBusinessNameClick = (lead) => {
    setSelectedLead(lead);
    setRightSidebarOpen(true);
  };

  const closeRightSidebar = () => {
    setRightSidebarOpen(false);
  };

  // Fetch all leads once
  useEffect(() => {
    const fetchLeads = async () => {
      const leadsCollection = collection(db, 'leads');
      const leadSnapshot = await getDocs(leadsCollection);
      const leadList = leadSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadList);
    };

    fetchLeads();
  }, []);

  // Apply filter based on the route and search query
  useEffect(() => {
    const path = location.pathname;
    const status = path.split('/').pop(); // Extract status from path

    // Filter leads based on the route and search query
    const applyFilter = () => {
      let filtered = leads;

      // Apply route-based filter
      if (status === 'demo-scheduled') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'demo scheduled');
      }

      else if (status === 'detail-shared') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'details shared');
      }

      else if (status === 'demo-done') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'demo done');
      }

      else if (status === 'lead-won') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'lead won');
      }

      else if (status === 'lead-lost') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'lead lost');
      }

      // Apply search query filter
      filtered = filtered.filter(lead => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        return (
          lead.businessName?.toLowerCase().includes(lowerCaseQuery) ||
          lead.contactNumber?.toLowerCase().includes(lowerCaseQuery) ||
          lead.emailId?.toLowerCase().includes(lowerCaseQuery) ||
          lead.location?.toLowerCase().includes(lowerCaseQuery) ||
          lead.assignedTo?.toLowerCase().includes(lowerCaseQuery) ||
          lead.source?.toLowerCase().includes(lowerCaseQuery) ||
          lead.status?.toLowerCase().includes(lowerCaseQuery)
        );
      });

      setFilteredLeads(filtered);
    };

    applyFilter();
  }, [leads, location, searchQuery]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'leads', id));
      setLeads(leads.filter(lead => lead.id !== id));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-lead/${id}`);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric' 
    });
  };

  const filterTitleMap = {
    'all': 'All Leads',
    'fresh-leads': 'Fresh Leads',
    'detail-shared': 'Detail Shared',
    'demo-scheduled': 'Demo Scheduled',
    'demo-done': 'Demo Done',
    'lead-won': 'Lead Won',
    'lead-lost': 'Lead Lost',
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredLeads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'leads.csv');
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
          const importedLeads = result.data.map((row) => ({
            ...row,
            nextFollowup: new Date(row.nextFollowup).toISOString(), // Ensure date format
          }));
          setImportedData(importedLeads);
          // Optionally, you can now handle imported data (e.g., save to Firestore)
          console.log(importedLeads);
        },
      });
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <Header onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>
          {filterTitleMap[location.pathname.split('/').pop()] || 'Total Leads'} ({filteredLeads.length})
        </h2>
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
           <button onClick={() => navigate('/create-lead')}>Add Lead</button>
          </div>
        </div>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Serial No.</th>
                <th>Business Name</th>
                <th>Business Type</th>
                <th>Contact Number</th>
                <th>Email ID</th>
                <th>Location</th>
                <th>Assigned To</th>
                <th>Source</th>
                <th>Status</th>
                <th>Next Followup Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <tr key={lead.id}>
                  <td>{index + 1}</td>
                  <td
                    onClick={() => handleBusinessNameClick(lead)}
                    style={{ cursor: 'pointer' }}
                  >
                    {lead.businessName}
                  </td>
                  <td>{lead.businessType}</td>
                  <td>{lead.contactNumber}</td>
                  <td>{lead.emailId}</td>
                  <td>{lead.location}</td>
                  <td>{lead.assignedTo}</td>
                  <td>{lead.source}</td>
                  <td>{lead.status}</td>
                  <td>{formatDate(lead.nextFollowup)}</td>
                  <td className="actions">
                    <button className='button' onClick={() => handleEdit(lead.id)}>
                      <img src={editIcon} alt="Edit" className="icon" />
                    </button>
                    {/* <button onClick={() => handleDelete(lead.id)}>
                      <img src={deleteIcon} alt="Delete" className="icon" />
                    </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <RightSidebar isOpen={rightSidebarOpen} onClose={closeRightSidebar} selectedLead={selectedLead} />
    </div>
  );
};

export default Leads;
