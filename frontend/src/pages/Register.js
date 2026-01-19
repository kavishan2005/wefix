import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserTie, FaTools } from 'react-icons/fa';

const servicesList = [
  'gardener', 'driver', 'plumber', 'electrician', 'maid', 'teacher', 'tutor', 'carpenter', 'painter', 'cleaner'
];

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      if (step === 1) {
        setUserType(data.userType);
        setStep(2);
        return;
      }

      if (step === 2) {
        const response = await axios.post('http://localhost:5001/api/auth/register', {
          ...data,
          userType
        });
        
        localStorage.setItem('token', response.data.token);
        setOtpSent(true);
        toast.success('OTP sent to your phone number');
        setStep(3);
        return;
      }

      if (step === 3) {
        const response = await axios.post('http://localhost:5001/api/auth/verify-otp', {
          phone: watch('phone'),
          otp
        });
        
        toast.success('Phone number verified successfully');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
        <p className="text-gray-600 mt-2">Join our trusted community</p>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {s}
            </div>
            <span className="text-sm mt-2">
              {s === 1 ? 'Type' : s === 2 ? 'Details' : 'Verify'}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div>
            <h3 className="text-xl font-semibold mb-6 text-center">Who are you?</h3>
            <div className="space-y-4">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500">
                <input
                  type="radio"
                  value="consumer"
                  {...register('userType', { required: 'Please select user type' })}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Consumer</div>
                  <div className="text-sm text-gray-600">Looking for service providers</div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500">
                <input
                  type="radio"
                  value="provider"
                  {...register('userType', { required: 'Please select user type' })}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Service Provider</div>
                  <div className="text-sm text-gray-600">Offer your skills and services</div>
                </div>
              </label>
              {errors.userType && (
                <p className="text-red-500 text-sm">{errors.userType.message}</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="flex items-center text-gray-700 mb-2">
                <FaUser className="mr-2" />
                Full Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-gray-700 mb-2">
                <FaEnvelope className="mr-2" />
                Email
              </label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-gray-700 mb-2">
                <FaPhone className="mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Enter a valid 10-digit phone number'
                  }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-gray-700 mb-2">
                <FaLock className="mr-2" />
                Password
              </label>
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {userType === 'provider' && (
              <div>
                <label className="flex items-center text-gray-700 mb-2">
                  <FaTools className="mr-2" />
                  Services Offered
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {servicesList.map((service) => (
                    <label key={service} className="flex items-center">
                      <input
                        type="checkbox"
                        value={service}
                        {...register('servicesOffered')}
                        className="mr-2"
                      />
                      <span className="capitalize">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Verify Phone Number</h3>
              <p className="text-gray-600">
                Enter the 6-digit OTP sent to {watch('phone')}
              </p>
            </div>
            
            <div className="flex justify-center space-x-2 mb-6">
              {[...Array(6)].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength="1"
                  className="w-12 h-12 text-center text-2xl border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onChange={(e) => {
                    const newOtp = otp.split('');
                    newOtp[i] = e.target.value;
                    setOtp(newOtp.join(''));
                  }}
                />
              ))}
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              Didn't receive OTP? 
              <button type="button" className="text-primary-600 ml-2 hover:underline">
                Resend OTP
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="w-full mb-3 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300"
            >
              Back
            </button>
          )}
          
          <button
            type="submit"
            className="w-full bg-primary-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-700 transition duration-300"
          >
            {step === 1 ? 'Continue' : step === 2 ? 'Register & Send OTP' : 'Verify & Complete'}
          </button>
        </div>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;