import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Typography,
  Progress,
} from "@material-tailwind/react";
import { HiEye, HiEyeOff, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { Axios } from "../Axios";
import { Cookie } from "../Cookie";
import FullScreenLoader from "../FullScrennLoader/FullScreenLoader";

const axios = new Axios();
const cookie = new Cookie();

export default function ResetPasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatNewPassword, setRepeatNewPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    new_pass: false,
    repeat: false,
  });
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  
  // Password validation criteria
  const [validationCriteria, setValidationCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Check password strength on change
  useEffect(() => {
    if (newPassword) {
      const criteria = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      };
      
      setValidationCriteria(criteria);
      
      // Calculate strength based on criteria met
      const strengthScore = Object.values(criteria).filter(Boolean).length / 5 * 100;
      setPasswordStrength(strengthScore);
    } else {
      setPasswordStrength(0);
      setValidationCriteria({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
    }
  }, [newPassword]);
  
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    let validationErrors = {};

    if (!currentPassword) {
      validationErrors.currentPassword = "Внесете ја вашата моментална лозинка.";
    }
    
    if (!newPassword) {
      validationErrors.newPassword = "Внесете нова лозинка.";
    } else if (passwordStrength < 60) {
      validationErrors.newPassword = "Лозинката не ги исполнува минималните барања за безбедност.";
    }
    
    if (!repeatNewPassword) {
      validationErrors.repeatNewPassword = "Повторете ја новата лозинка.";
    } else if (newPassword !== repeatNewPassword) {
      validationErrors.repeatNewPassword = "Лозинките не се совпаѓаат.";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return "red";
    if (passwordStrength < 70) return "amber";
    return "green";
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);
      const body = {
        user_id: cookie.getCookie("user_id"),
        currentPassword, // Add current password for verification
        newPassword: newPassword,
      };
  
      axios.post("UserDetails/update-user-password", body)
        .then((res) => {
          if (res.status === 200 && res.data.status === "success") {
            setNotification({
              message: res.data.message || "Лозинката е успешно променета",
              type: "success",
              description: res.data.description || "",
            });
  
            setCurrentPassword("");
            setNewPassword("");
            setRepeatNewPassword("");
            setErrors({});
  
            // Delay closing the modal so notification can be seen
            setTimeout(() => {
              onClose();
              setNotification({ message: "", type: "", description: "" }); // Reset after modal closes
            }, 2000);
          } else {
            setNotification({
              message: res.data.message || "Грешка при промена на лозинка",
              type: "error",
              description: res.data.description || "",
            });
          }
        })
        .catch((error) => {
          const errorMessage = error.response?.data?.message || "Грешка при промена на лозинка";
          setNotification({
            message: errorMessage,
            type: "error",
            description: "",
          });
          console.log(error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  
  const ValidationItem = ({ isValid, text }) => (
    <div className="flex items-center gap-2 text-sm">
      {isValid ? (
        <HiCheckCircle className="text-green-500" />
      ) : (
        <HiXCircle className="text-gray-400 dark:text-gray-500" />
      )}
      <span className={isValid ? "text-green-500" : "text-gray-400 dark:text-gray-500"}>
        {text}
      </span>
    </div>
  );

  const getInputClasses = (hasError) => {
    return `pr-10 ${hasError ? "border-red-500" : ""}`;
  };
  
  return (
    <Dialog 
      className={`${isOpen ? "z-50" : ""} dark:bg-dark-secondary`}
      open={isOpen} 
      handler={onClose}
      size="sm"
    >
      <FullScreenLoader loading={loading} />
      <DialogHeader className="border-b dark:border-dark-border dark:text-dark-text-primary">
        <Typography variant="h5" className="dark:text-dark-text-primary">
          Промена на лозинка
        </Typography>
      </DialogHeader>
      
      <DialogBody className="dark:bg-dark-secondary">
        {notification.message && (
          <div 
            className={`mb-4 p-3 rounded ${
              notification.type === "success" 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {notification.message}
            {notification.description && (
              <p className="text-sm mt-1">{notification.description}</p>
            )}
          </div>
        )}
      
        <div className="space-y-4">
          {/* Current Password */}
          <div className="relative">
          <Input
            type={showPassword.current ? "text" : "password"}
            label="Моментална лозинка"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={!!errors.currentPassword}
            className={getInputClasses(!!errors.currentPassword)}
            icon={
              <div 
                className="cursor-pointer" 
                onClick={() => togglePasswordVisibility("current")}
              >
                {showPassword.current ? 
                  <HiEyeOff className="w-5 h-5 dark:text-gray-400" /> : 
                  <HiEye className="w-5 h-5 dark:text-gray-400" />
                }
              </div>
            }
            containerProps={{
              className: "dark:border-dark-border"
            }}
            labelProps={{
              className: "!text-black dark:!text-white" // Try this
            }}
            color="black"
            variant="outlined"
            className="dark:text-dark-text-primary dark:bg-dark-secondary dark:border-dark-border"
          />
            {errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="relative">
            <Input
              type={showPassword.new_pass ? "text" : "password"}
              label="Нова лозинка"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!errors.newPassword}
              className={getInputClasses(!!errors.newPassword)}
              icon={
                <div 
                  className="cursor-pointer" 
                  onClick={() => togglePasswordVisibility("new_pass")}
                >
                  {showPassword.new_pass ? 
                    <HiEyeOff className="w-5 h-5 dark:text-gray-400" /> : 
                    <HiEye className="w-5 h-5 dark:text-gray-400" />
                  }
                </div>
              }
              containerProps={{
                className: "dark:border-dark-border"
              }}
              labelProps={{
                className: "!text-black dark:!text-white" // Try this
              }}
              color="black"
              variant="outlined"
              className="dark:text-dark-text-primary dark:bg-dark-secondary dark:border-dark-border"
            />
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Password Strength */}
          {newPassword && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Typography variant="small" className="dark:text-dark-text-secondary">
                  Јачина на лозинката
                </Typography>
                <Typography variant="small" className="dark:text-dark-text-secondary">
                  {passwordStrength < 40 ? "Слаба" : passwordStrength < 70 ? "Средна" : "Јака"}
                </Typography>
              </div>
              <Progress value={passwordStrength} color={getStrengthColor()} />
              
            </div>
          )}

          {/* Repeat New Password */}
          <div className="relative">
            <Input
              type={showPassword.repeat ? "text" : "password"}
              label="Повторете ја новата лозинка"
              value={repeatNewPassword}
              onChange={(e) => setRepeatNewPassword(e.target.value)}
              error={!!errors.repeatNewPassword}
              className={getInputClasses(!!errors.repeatNewPassword)}
              icon={
                <div 
                  className="cursor-pointer" 
                  onClick={() => togglePasswordVisibility("repeat")}
                >
                  {showPassword.repeat ? 
                    <HiEyeOff className="w-5 h-5 dark:text-gray-400" /> : 
                    <HiEye className="w-5 h-5 dark:text-gray-400" />
                  }
                </div>
              }
              containerProps={{
                className: "dark:border-dark-border"
              }}
              labelProps={{
                className: "!text-black dark:!text-white" // Try this
              }}
              color="black"
              variant="outlined"
              className="dark:text-dark-text-primary dark:bg-dark-secondary dark:border-dark-border"
            />
            {errors.repeatNewPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.repeatNewPassword}</p>
            )}
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t dark:border-dark-border dark:bg-dark-secondary">
        <Button 
          variant="outlined" 
          fullWidth 
          color="red" 
          onClick={onClose}
          className="dark:border-red-500 dark:text-red-500 dark:hover:bg-red-500/10"
        >
          <span>Откажи</span>
        </Button>
        <Button 
          fullWidth 
          color="black" 
          onClick={handleSubmit}
          disabled={passwordStrength < 60}
          className="dark:bg-dark-accent-primary dark:hover:bg-dark-accent-hover dark:text-white"
        >
          <span>Зачувај промените</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}