import React, { useState, useEffect } from 'react';
import { Button, Checkbox, TextField, IconButton, InputAdornment } from '@mui/material';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { collection, query, where, getDocs,updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext'; // Import the context
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './login.css';
import Logo from '../../assets/logo.png';
import BgAbstract from '../../assets/sd.jpg';
import { fetchRealTimeDate } from '../../utils/fetchRealTimeDate';

const Login = () => {
  const { setUserData } = useUser(); // Access setUserData from the context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const checkAuthToken = async () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        try {
          const auth = getAuth();
          const user = await auth.verifyIdToken(token); // Check token validity
          if (user) {
            // If token is valid, set user data and redirect
            setUserData({ name: user.name, role: user.role, email: user.email });
            navigate(user.role === 'Super Admin' ? '/admin-dashboard' : '/user-dashboard');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          // Clear invalid token
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
        }
      }
    };

    checkAuthToken();
  }, [setUserData, navigate]);

  useEffect(() => {
    // Autofill email if token is present
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      const userEmail = JSON.parse(localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail'));
      if (userEmail) {
        setEmail(userEmail);
      }
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const auth = getAuth();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate a token
      const token = await user.getIdToken();

      // Store the token
      if (rememberMe) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userEmail', JSON.stringify(email));
      } else {
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('userEmail', JSON.stringify(email));
      }

      // Check user role
      const superAdminQuery = query(collection(db, 'superadmins'), where('email', '==', email));
      const superAdminSnapshot = await getDocs(superAdminQuery);

      if (!superAdminSnapshot.empty) {
        const superAdminData = superAdminSnapshot.docs[0].data();
        setUserData({ name: superAdminData.name, role: 'Super Admin', email });
        navigate('/leads');
        return;
      }

      const adminQuery = query(collection(db, 'admins'), where('email', '==', email));
      const adminSnapshot = await getDocs(adminQuery);

      if (!adminSnapshot.empty) {
        const adminData = adminSnapshot.docs[0].data();
        setUserData({ name: adminData.name, role: 'Admin', email });
        navigate('/leads');
        return;
      }

      const branchQuery = query(collection(db, 'branches'), where('emailId', '==', email));
      const branchSnapshot = await getDocs(branchQuery);

      if (!branchSnapshot.empty) {
        const branchData = branchSnapshot.docs[0].data();
        setUserData({ name: branchData.name, role: 'Branch Manager', email });
        // if (branchData.firstLogin) {
        //   navigate('/change-password');
        //   await updateDoc(branchData, { firstLogin: false });
        //   return;
        // }
        navigate('/welcome');
        return;
      }

      const branchData = branchSnapshot.docs[0].data();
      const today = await fetchRealTimeDate();

      const activeDate = new Date(branchData.activeDate);
      const deactiveDate = new Date(branchData.deactiveDate);

      if (today < activeDate) {
       
        setLoading(false);
        return;
      }

      if (today > deactiveDate) {
        setLoading(false);
        return;
      }

      const userQuery = query(collection(db, 'users'), where('email', '==', email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        setUserData({ name: userData.name, role: 'User', email });
        navigate('/user-dashboard');
        return;
      }

      setError('No user found with the provided credentials.');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <img src={BgAbstract} alt="Background" className="background-image" />

      <div className="logo-container">
        <img src={Logo} alt="Logo" className="logo-image" />
      </div>

      <div className="welcome-text">
        Welcome <br /> Back!
      </div>

      <div className="form-container">
        <div className="title">Sign In</div>
        <div className="subtitle">
          Welcome back! Please sign in to your account
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <TextField
              label="Email ID"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
          </div>
          <div className="form-group">
            <TextField
              label="Password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'} // Toggle password visibility
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ background: 'transparent' }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <div className="remember-me">
            <Checkbox
              checked={rememberMe}
              onChange={() => setRememberMe(prev => !prev)}
            />
            <label>Remember Me</label>
          </div>

          <div className="forgot-password">
            Forgot your password
          </div>

          <Button fullWidth variant="contained" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>

          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
