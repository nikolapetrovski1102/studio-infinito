import React, { useState } from 'react';
import { Axios } from '../Axios';
import { message } from 'antd';
import FullScreenLoader from '../FullScrennLoader/FullScreenLoader';
import { HiEye, HiEyeOff } from 'react-icons/hi'; // Make sure to import these icons
import { Input } from '@material-tailwind/react';
const axios = new Axios();
const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState('email'); // email, sent, reset
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  
  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Function to validate Macedonian phone number
  const validatePhoneNumber = (phone) => {
    // Check if number starts with +389 and has exactly 11 characters
    const phoneRegex = /^\+389\d{8}$/;
    return phoneRegex.test(phone);
  };
  
  // Get the full phone number with prefix for API requests
  const getFullPhoneNumber = () => {
    if (!phoneNumber) return '';
    return phoneNumber.startsWith('+389') ? phoneNumber : `+389${phoneNumber}`;
  };
  
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() && !phoneNumber.trim()) {
      setError('Ве молиме внесете ја вашата е-маил адреса или телефонски број');
      return;
    }
    
    // Get full phone number with prefix
    const fullPhoneNumber = getFullPhoneNumber();
    
    // Validate phone number if provided
    if (fullPhoneNumber && !validatePhoneNumber(fullPhoneNumber)) {
      setError('Телефонскиот број треба да започне со +389 и да има вкупно 11 карактери');
      return;
    }
    
    setLoading(true);
    setError('');
    
    axios.post('Auth/forgot-password', { email, phoneNumber: fullPhoneNumber })
    .then((res) => {
        if (res.status === 200 && res.data.status === 'success') {
            setStep('sent');
        } else if (res.status === 200 && (res.data.status === 'error' || res.data.status === 'warning')) {
            setError(res.data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        setError('Настана грешка при испраќање на е-пошта. Обидете се повторно.');
    })
    .finally(() => { setLoading(false); });
  };
  
  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Ве молиме внесете го кодот за ресетирање');
      return;
    }
    setLoading(true);
    setError('');
    
    const fullPhoneNumber = getFullPhoneNumber();
    
    axios.post('Auth/verify-token', { email, phoneNumber: fullPhoneNumber, token })
    .then((res) => {
        if (res.status === 200 && res.data.status === 'success') {
            setStep('reset');
        } else if (res.status === 200 && (res.data.status === 'error' || res.data.status === 'warning')) {
            setError(res.data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        setError('Настана грешка при верификација на кодот. Обидете се повторно.');
    })
    .finally(() => { setLoading(false); });
  };
  
  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Ве молиме внесете нова лозинка');
      return;
    }
    if (password !== confirmPassword) {
      setError('Лозинките не се совпаѓаат');
      return;
    }
    if (password.length < 8) {
      setError('Лозинката мора да содржи најмалку 8 карактери');
      return;
    }
    
    const fullPhoneNumber = getFullPhoneNumber();
    
    axios.post('Auth/reset-password', { email, phoneNumber: fullPhoneNumber, password })
    .then((res) => {
        if (res.status === 200 && res.data.status === 'success') {
            message.success('Лозинката е успешно ресетирана. Можете да се најавите со новата лозинка.');
            onClose();
            
            setEmail('');
            setPhoneNumber('');
            setPassword('');
            setConfirmPassword('');
            setToken('');
            setStep('email');
            setError('');
        } else if (res.status === 200 && (res.data.status === 'error' || res.data.status === 'warning')) {
            setError(res.data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        setError('Настана грешка при ресетирање на лозинката. Обидете се повторно.');
    })
    .finally(() => { setLoading(false); });
  };
  
  const resetForm = () => {
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setToken('');
    setError('');
    setStep('email');
  };
  
  const handleClose = () => {
    onClose();
    resetForm();
  };
  
  // Handle phone number input
  const handlePhoneNumberChange = (e) => {
    let value = e.target.value;
    
    // Remove any non-numeric characters
    value = value.replace(/[^0-9]/g, '');
    
    // Limit to 8 digits
    if (value.length > 8) {
      value = value.substring(0, 8);
    }
    
    // Update state with just the local part (without +389)
    setPhoneNumber(value);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-down">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={handleClose}
      ></div>
      
      <div className="relative w-full max-w-md p-6 rounded-lg shadow-lg dark:bg-dark-secondary border dark:border-dark-border z-10 bg-gray-200 border-gray-500">
        <h2 className="text-xl font-semibold mb-4 dark:text-dark-text-primary">
          {step === 'email' && 'Ресетирајте ја вашата лозинка'}
          {step === 'sent' && 'Проверете ја вашата е-пошта'}
          {step === 'reset' && 'Внесете нова лозинка'}
        </h2>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-900 bg-opacity-20 border border-red-800 dark:text-red-200 text-red-400">
            {error}
          </div>
        )}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <p className="mb-4 dark:text-dark-text-secondary">
              Внесете ја вашата е-маил адреса и ќе ви испратиме инструкции за ресетирање на лозинката.
            </p>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 dark:text-dark-text-secondary">
                Е-маил адреса
              </label>
              <input
                id="email"
                type="email"
                className="w-full p-2 rounded dark:bg-dark-tertiary border dark:border-dark-border dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="вашиот@емаил.ком"
              />
            </div>
            
            {/* Phone number input field */}
            <div className="mb-4">
              <label htmlFor="phoneNumber" className="block mb-2 dark:text-dark-text-secondary">
                Телефонски број
              </label>
              <div className="relative flex w-full">
                <div className="flex items-center bg-blue-gray-500/10 rounded-l-md px-3">
                  <span className="text-blue-gray-700 dark:text-dark-text-primary">+389</span>
                </div>
                <Input
                  name="phone"
                  type="tel"
                  maxLength={8}
                  placeholder="71234567"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="w-full py-3 !rounded-l-none"
                />
              </div>
              <p className="mt-1 text-xs dark:text-dark-text-secondary">
                Внесете ги само цифрите, без +389
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="mr-2 px-4 py-2 rounded dark:bg-dark-tertiary bg-blue-gray-100 dark:text-dark-text-secondary hover:bg-dark-button-hover transition-colors"
                onClick={handleClose}
              >
                Откажи
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-dark-accent-primary text-white hover:bg-dark-accent-hover transition-colors"
              >
                Испрати
              </button>
            </div>
          </form>
        )}
        {step === 'sent' && (
          <div>
            <p className="mb-4 dark:text-dark-text-secondary">
              Испративме инструкции за ресетирање на <span className="text-blue-300 underline font-medium">{email || `+389${phoneNumber}`}</span>. 
              Ве молиме проверете ја вашата е-пошта и внесете го кодот за ресетирање подолу.
            </p>
            <form onSubmit={handleTokenSubmit}>
              <div className="mb-4">
                <label htmlFor="token" className="block mb-2 dark:text-dark-text-secondary">
                  Код за ресетирање
                </label>
                <input
                  id="token"
                  type="text"
                  className="w-full p-2 rounded dark:bg-dark-tertiary border dark:border-dark-border dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-gray-400"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Внесете код од е-поштата"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 rounded dark:bg-dark-tertiary bg-blue-gray-100 dark:text-dark-text-secondary hover:bg-dark-button-hover transition-colors"
                  onClick={() => setStep('email')}
                >
                  Назад
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-dark-accent-primary text-white hover:bg-dark-accent-hover transition-colors"
                >
                  Верификувај код
                </button>
              </div>
            </form>
          </div>
        )}
        {step === 'reset' && (
          <form onSubmit={handleResetSubmit}>
            <p className="mb-4 dark:text-dark-text-secondary">
              Креирајте нова лозинка за вашата сметка.
            </p>
            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 dark:text-dark-text-secondary">
                Нова лозинка
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full p-2 rounded dark:bg-dark-tertiary border dark:border-dark-border dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-gray-400 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 карактери"
                />
                <div 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <HiEyeOff className="w-5 h-5" />
                  ) : (
                    <HiEye className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block mb-2 dark:text-dark-text-secondary">
                Потврди нова лозинка
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full p-2 rounded dark:bg-dark-tertiary border dark:border-dark-border dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-gray-400 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Потврдете ја вашата лозинка"
                />
                <div 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <HiEyeOff className="w-5 h-5" />
                  ) : (
                    <HiEye className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="mr-2 px-4 py-2 rounded dark:bg-dark-tertiary bg-blue-gray-100 dark:text-dark-text-secondary hover:bg-dark-button-hover transition-colors"
                onClick={() => setStep('sent')}
              >
                Назад
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-dark-accent-primary text-white hover:bg-dark-accent-hover transition-colors"
              >
                Ресетирај лозинка
              </button>
            </div>
          </form>
        )}
      </div>
      <FullScreenLoader loading={loading} />
    </div>
  );
};
export default ForgotPasswordModal;