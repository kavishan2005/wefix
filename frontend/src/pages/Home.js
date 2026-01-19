import React from 'react';
import { Link } from 'react-router-dom';
import { FaTools, FaUserTie, FaSearch, FaStar, FaShieldAlt } from 'react-icons/fa';

const services = [
  { icon: '🛠️', name: 'Gardener', color: 'bg-green-100' },
  { icon: '🚗', name: 'Driver', color: 'bg-blue-100' },
  { icon: '🔧', name: 'Plumber', color: 'bg-red-100' },
  { icon: '⚡', name: 'Electrician', color: 'bg-yellow-100' },
  { icon: '🏠', name: 'Maid', color: 'bg-purple-100' },
  { icon: '📚', name: 'Teacher/Tutor', color: 'bg-indigo-100' },
  { icon: '🔨', name: 'Carpenter', color: 'bg-orange-100' },
  { icon: '🎨', name: 'Painter', color: 'bg-pink-100' },
];

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-2xl p-8 mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Connect with Trusted Service Providers in Sri Lanka
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Find skilled professionals for every job. Verified, rated, and ready to help.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
            >
              Get Started as Consumer
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition duration-300"
            >
              Register as Service Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-2">Services We Offer</h2>
        <p className="text-gray-600 text-center mb-8">Find the perfect service for your needs</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((service, index) => (
            <div 
              key={index} 
              className={`${service.color} rounded-xl p-6 text-center hover:shadow-lg transition duration-300 cursor-pointer`}
            >
              <div className="text-4xl mb-3">{service.icon}</div>
              <h3 className="font-semibold text-lg">{service.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaSearch className="text-2xl text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Find a Provider</h3>
            <p className="text-gray-600">Browse verified service providers with ratings and reviews</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUserTie className="text-2xl text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Book & Confirm</h3>
            <p className="text-gray-600">Select your provider, discuss details, and confirm the job</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTools className="text-2xl text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Get it Done</h3>
            <p className="text-gray-600">Provider completes the job, you review and release payment</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <FaShieldAlt className="text-2xl text-green-600 mr-3" />
              <h3 className="text-xl font-semibold">Verified Providers</h3>
            </div>
            <p className="text-gray-700">
              Every service provider is verified through phone OTP and background checks for your safety.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <FaStar className="text-2xl text-yellow-600 mr-3" />
              <h3 className="text-xl font-semibold">Ratings & Reviews</h3>
            </div>
            <p className="text-gray-700">
              Read genuine reviews from other customers to make informed decisions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;