import React, { useState, useEffect } from 'react';
import { Button, Checkbox, TextField, IconButton, InputAdornment } from '@mui/material';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
          const user = await auth.verifyIdToken(token);
          if (user) {
            setUserData({ name: user.name, role: user.role, email: user.email });
            navigate(user.role === 'Super Admin' ? '/admin-dashboard' : '/user-dashboard');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
        }
      }
    };
    checkAuthToken();
  }, [setUserData, navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const auth = getAuth();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const token = await user.getIdToken();

      if (rememberMe) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userEmail', JSON.stringify(email));
      } else {
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('userEmail', JSON.stringify(email));
      }
      const superAdminQuery = query(collection(db, 'superadmins'), where('email', '==', email));
      const superAdminSnapshot = await getDocs(superAdminQuery);

      if (!superAdminSnapshot.empty) {
        const superAdminData = superAdminSnapshot.docs[0].data();
        setUserData({ name: superAdminData.name, role: 'Super Admin', email });
        navigate('/leads');
        return;
      }

      const branchQuery = query(collection(db, 'branches'), where('emailId', '==', email));
      const branchSnapshot = await getDocs(branchQuery);

      if (!branchSnapshot.empty) {
        const branchData = branchSnapshot.docs[0].data();

        // Set user data with branchCode and branchName for branch managers
        setUserData({
          name: branchData.ownerName,
          role: 'Branch Manager',
          email,
          branchCode: branchData.branchCode,  // Add branch code to user data
          branchName: branchData.branchName,
          numberOfUsers: branchData.numberOfUsers,  // Add branch name to user data
        });

        navigate('/welcome');
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
    <div className="sign-in-container">
      <div className="sign-in-left">
        
      
       <h1>Welcome Back!</h1>

      </div>

     
      
      <div className="logo-container">
        <img src={Logo} alt="Logo" className="logo-image" />
      </div>


    <div className="sign-in-right">
      <p>Sign In</p>
      <p>Welcome back! Please sign in to your account</p>

        <form onSubmit={handleLogin} >
          <div className="input-group">
            <TextField
              label="Email ID"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
          </div>
          <div className="input-group">
            <TextField
              label="Password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
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
              onChange={() => setRememberMe((prev) => !prev)}
            />
            <label>Remember Me</label>
          </div>

          <div className="forgot-password">Forgot your password</div>

          <Button className='sign-in-button' fullWidth variant="contained" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>

          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
