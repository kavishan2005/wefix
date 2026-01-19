import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <nav style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0' }}>
          <h1>WeFix - Service Platform</h1>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/">Home</Link>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
            <Link to="/providers">Find Providers</Link>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/providers" element={<Providers />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div>
      <h2>Welcome to WeFix!</h2>
      <p>Connect with trusted service providers in Sri Lanka</p>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none' }}>
          <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Get Started</Link>
        </button>
        <button style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none' }}>
          <Link to="/providers" style={{ color: 'white', textDecoration: 'none' }}>Browse Providers</Link>
        </button>
      </div>
    </div>
  );
}

function Register() {
  return (
    <div>
      <h2>Register</h2>
      <form style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '10px' }}>
        <input type="text" placeholder="Full Name" style={{ padding: '8px' }} />
        <input type="email" placeholder="Email" style={{ padding: '8px' }} />
        <input type="tel" placeholder="Phone Number" style={{ padding: '8px' }} />
        <input type="password" placeholder="Password" style={{ padding: '8px' }} />
        <select style={{ padding: '8px' }}>
          <option value="">Select User Type</option>
          <option value="consumer">Consumer</option>
          <option value="provider">Service Provider</option>
        </select>
        <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none' }}>
          Register
        </button>
      </form>
    </div>
  );
}

function Login() {
  return (
    <div>
      <h2>Login</h2>
      <form style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '10px' }}>
        <input type="email" placeholder="Email" style={{ padding: '8px' }} />
        <input type="password" placeholder="Password" style={{ padding: '8px' }} />
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>
          Login
        </button>
      </form>
    </div>
  );
}

function Providers() {
  const services = ['Plumber', 'Electrician', 'Gardener', 'Driver', 'Maid', 'Teacher/Tutor'];
  
  return (
    <div>
      <h2>Service Providers</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {services.map((service, index) => (
          <div key={index} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px', width: '200px' }}>
            <h3>{service}</h3>
            <p>Find skilled {service.toLowerCase()}s</p>
            <button style={{ padding: '5px 10px', background: '#17a2b8', color: 'white', border: 'none' }}>
              Browse
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
