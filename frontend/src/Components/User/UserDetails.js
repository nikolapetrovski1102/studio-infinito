import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Input,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter
} from "@material-tailwind/react";
import FullScreenLoader from "../FullScrennLoader/FullScreenLoader";
import { Axios } from "../Axios";
import { Cookie } from "../Cookie"
import Notification from "../Home/Notification";
import { Upload } from "antd";
import ResetPasswordModal from "./ResetPasswordModal";
import { UploadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const axios = new Axios();
const cookie = new Cookie();

export default function UserDetails() {
  const [notificationParams, setNotificationParams] = useState({
    message: "",
    type: "",
    description: ""
  });
  
  const [userData, setUserData] = useState({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    phone: "",
    userImage: "",
  });
  
  const [originalUserData, setOriginalUserData] = useState(null);
  const [loading, setLoader] = useState(true);
  const [changeInformation, setChangeInformation] = useState(true);
  const [errors, setErrors] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedChangesDialog, setUnsavedChangesDialog] = useState(false);
  const [navigationCallback, setNavigationCallback] = useState(null);
  
  useEffect(() => {
    if (notificationParams.message !== "") {
      setTimeout(() => {
        setNotificationParams({message: "", type: "", description: ""});
      }, 3000);
    }
  }, [notificationParams]);
  
  useEffect(() => {
    axios.get(`UserDetails/${cookie.getCookie('user_id')}`).then((res) => {
      if (res.status === 200 && res.data.status === 'success') {
          const user_data = JSON.parse(res.data.user);
          const userDataObj = {
            id: parseInt(cookie.getCookie('user_id')),
            firstName: user_data.full_name.split(" ")[0],
            lastName: user_data.full_name.split(" ")[1],
            email: user_data.email,
            gender: user_data.gender,
            phone: user_data.phone.slice(4),
            userImage: user_data.userImage || "",
          };
          
          setUserData(userDataObj);
          setOriginalUserData(JSON.stringify(userDataObj));
          
          if (user_data.user_image) {
            setAvatarPreview(user_data.user_image);
          }
      } else if (res.status === 200 && res.data.status === 'error') {
        setNotificationParams({
          message: res.data.message,
          type: res.data.status,
          description: ""
        });
      }
    }).catch((err) => {
      console.log(err);
      setNotificationParams({
        message: "Грешка при поврзување со серверот",
        type: "error",
        description: ""
      });
    }).finally(() => setLoader(false));
  }, []);
  
  // Check for unsaved changes when data changes
  useEffect(() => {
    if (originalUserData) {
      const currentDataString = JSON.stringify({
        ...userData,
        userImage: undefined  // Exclude binary data from comparison
      });
      
      const originalDataString = JSON.stringify({
        ...JSON.parse(originalUserData),
        userImage: undefined  // Exclude binary data from comparison
      });
      
      setHasUnsavedChanges(
        currentDataString !== originalDataString || avatarFile !== null
      );
    }
  }, [userData, avatarFile, originalUserData]);
  
  // Add window beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  const handleUnsavedChangesConfirm = () => {
    setUnsavedChangesDialog(false);
    if (navigationCallback) {
      navigationCallback();
      setNavigationCallback(null);
    }
  };
  
  const handleUnsavedChangesCancel = () => {
    setUnsavedChangesDialog(false);
    setNavigationCallback(null);
  };
  
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "firstName":
        if (!value.trim()) error = "Име е задолжително.";
        break;
      case "lastName":
        if (!value.trim()) error = "Презиме е задолжително.";
        break;
      case "email":
        if (value && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
          error = "Невалидна емаил адреса.";
        }
        break;
      case "phone":
        if (!value) {
          error = "Телефонскиот број е задолжителен.";
        } else if (value.length !== 8) {
          error = "Внесете точно 8 цифри по +389.";
        }
        break;
      default:
        break;
    }
    
    return error;
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
    
    // Real-time field validation
    const error = validateField(name, value);
    if (error) {
      setErrors({
        ...errors,
        [name]: error
      });
    }
    
    setUserData({
      ...userData,
      [name]: value
    });
  };
  
  const resizeImage = (file, maxWidth, maxHeight, callback) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // Calculate the new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
  
        // Create a canvas and draw the resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
  
        // Convert canvas to Base64
        const resizedBase64 = canvas.toDataURL("image/jpeg", 0.8); // 80% quality
        callback(resizedBase64);
      };
    };
  
    reader.readAsDataURL(file);
  };
  
  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
  
    if (info.file.status === 'done') {
      const file = info.file.originFileObj;
      setAvatarFile(file);
  
      // Resize image before converting to Base64
      resizeImage(file, 250, 250, (resizedBase64) => {
        setUserData({ ...userData, userImage: resizedBase64 });
        setAvatarPreview(resizedBase64);
      });
    }
  };
  
  const validateAllFields = () => {
    let newErrors = {};
    
    // Validate all fields
    if (!userData.firstName.trim()) newErrors.firstName = "Име е задолжително.";
    if (!userData.lastName.trim()) newErrors.lastName = "Презиме е задолжително.";
    if (userData.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userData.email)) {
      newErrors.email = "Невалидна емаил адреса.";
    }
    if (!userData.phone) {
      newErrors.phone = "Телефонскиот број е задолжителен.";
    } else if (userData.phone.length !== 8) {
      newErrors.phone = "Внесете точно 8 цифри по +389.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSaveChanges = () => {
    if (!validateAllFields()) {
      setNotificationParams({
        message: "Поправете ги грешките пред да зачувате",
        type: "error",
        description: ""
      });
      return;
    }
    
    setLoader(true);
    const formData = new FormData();
    formData.append('id', String(userData.id));
    formData.append('firstName', userData.firstName);
    formData.append('lastName', userData.lastName);
    formData.append('email', userData.email);
    formData.append('gender', userData.gender);
    formData.append('phone', `+389${userData.phone}`);
    
    if (avatarFile) {
      formData.append('userImage', userData.userImage);
    }else if (localStorage.getItem('user_image')){
      formData.append('userImage', localStorage.getItem('user_image'))
    }
    
    axios.multi_post(`UserDetails/update-user`, formData)
      .then((res) => {
        if (res.status === 200 && res.data.status === "success") {
          setNotificationParams({
            message: res.data.message,
            type: res.data.status,
            description: ""
          });
          localStorage.setItem("user_image", avatarPreview);
          
          // Update original data to match current data
          setOriginalUserData(JSON.stringify({
            ...userData,
            userImage: avatarPreview ? avatarPreview : userData.userImage
          }));
          
          setHasUnsavedChanges(false);
          setAvatarFile(null);
        } else {
          setNotificationParams({
            message: res.data.message,
            type: res.data.status,
            description: ""
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setNotificationParams({
          message: "Грешка при поврзување со серверот",
          type: "error",
          description: ""
        });
      })
      .finally(() => setLoader(false));
  };
  
  const handleCloseModal = () => {
    setIsModalVisible(false);
  };
  
  const uploadProps = {
    name: 'avatar',
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        setNotificationParams({
          message: "Можете да прикачите само слики!",
          type: "error",
          description: ""
        });
      }
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        setNotificationParams({
          message: "Сликата мора да биде помала од 10MB!",
          type: "error",
          description: ""
        });
      }
      return isImage && isLt2M;
    },
    customRequest: ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
    onChange: handleAvatarChange
  };
  
  return (
    <section className="px-8 py-8 container mx-auto">
      {notificationParams.message && <Notification message={notificationParams.message} type={notificationParams.type} description={notificationParams.description} />}
      
      <div className="flex flex-col justify-start items-center mb-4">
        <div>
          <Typography variant="h5" className={`text-blue-gray-600 dark:text-blue-gray-50 font-bold`}>
            Информации за вас
          </Typography>
          <Typography
            variant="small"
            className="text-blue-gray-600 dark:text-blue-gray-100 font-normal mt-1"
          >
            Имаш згрешено? Сакаш да го промениш?
          </Typography>
        </div>

        {hasUnsavedChanges && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-2 rounded-md flex items-center gap-2"
          >
            <ExclamationCircleOutlined />
            <span>Немате незачувани промени</span>
          </motion.div>
        )}
      </div>
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-6 mt-8">
        <div className="w-32 h-32 mb-4 overflow-hidden rounded-full bg-gray-200 dark:bg-dark-secondary">
          {avatarPreview ? (
            <img 
              src={avatarPreview} 
              alt="Профилна слика" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
              </svg>
            </div>
          )}
        </div>
        {changeInformation && (
          <Upload {...uploadProps}>
            <Button 
              icon={<UploadOutlined />}
              className="bg-gray-400 text-gray-900 dark:bg-dark-button-primary dark:text-dark-text-primary w-full"
            >
              Промени профилна слика
            </Button>
          </Upload>
        )}
      </div>
      <div className="flex flex-col">
        <div className="mb-6 flex flex-col items-end gap-4 md:flex-row">
          <div className="w-full">
            <Typography
              variant="small"
              className="mb-2 font-medium dark:text-dark-text-primary"
            >
              Име
            </Typography>
            <Input
              name="firstName"
              value={userData.firstName}
              onChange={handleInputChange}
              disabled={!changeInformation}
              size="lg"
              error={!!errors.firstName}
              labelProps={{
                className: "hidden",
              }}
              className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200 dark:text-dark-text-primary dark:bg-dark-secondary"
            />
            {errors.firstName && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-red-500 mt-1 mb-0"
              >
                {errors.firstName}
              </motion.p>
            )}
          </div>
          <div className="w-full">
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 font-medium dark:text-dark-text-primary"
            >
              Презиме
            </Typography>
            <Input
              name="lastName"
              value={userData.lastName}
              onChange={handleInputChange}
              disabled={!changeInformation}
              size="lg"
              error={!!errors.lastName}
              labelProps={{
                className: "hidden",
              }}
              className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200 dark:text-dark-text-primary dark:bg-dark-secondary"
            />
            {errors.lastName && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-red-500 mt-1 mb-0"
              >
                {errors.lastName}
              </motion.p>
            )}
          </div>
        </div>
        <div className="mb-6 flex flex-col items-end gap-4 md:flex-row">
          <div className="w-full">
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 font-medium dark:text-dark-text-primary"
            >
              Пол
            </Typography>
              <Input
                disabled={true}
                size="lg"
                labelProps={{
                  className: "hidden",
                }}
                className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200 dark:text-dark-text-primary dark:bg-dark-secondary"
                value={userData.gender === 1 ? "Машко" : "Женско"}
              />
          </div>
        </div>
        <div className="mb-6 flex flex-col items-end gap-4 md:flex-row">
          <div className="w-full">
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 font-medium dark:text-dark-text-primary"
            >
              Е-Пошта
            </Typography>
            <Input
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              disabled={!changeInformation}
              size="lg"
              error={!!errors.email}
              labelProps={{
                className: "hidden",
              }}
              className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200 dark:text-dark-text-primary dark:bg-dark-secondary"
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-red-500 mt-1 mb-0"
              >
                {errors.email}
              </motion.p>
            )}
          </div>
        </div>
        <div className="mb-6 flex flex-col items-end gap-4 md:flex-row">
          <div className="w-full">
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 font-medium dark:text-dark-text-primary"
            >
              Телефонски Број
            </Typography>
            <div className="relative flex w-full">
              <div className="flex items-center bg-blue-gray-500/10 rounded-l-md px-3">
                <span className="text-blue-gray-700 dark:text-dark-text-primary">+389</span>
              </div>
              <Input
                name="phone"
                type="tel"
                maxLength={8}
                placeholder="Mobile Number"
                value={userData.phone}
                onChange={handleInputChange}
                disabled={!changeInformation}
                error={!!errors.phone}
                className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200 dark:text-dark-text-primary dark:bg-dark-secondary"
              />
            </div>
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-red-500 mt-1 mb-0"
              >
                {errors.phone}
              </motion.p>
            )}
          </div>
        </div>
        <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
          <a onClick={() => setIsModalVisible(true)} className={`underline text-blue-500 cursor-pointer`}>Променете Лозинка</a>
        </div>
        <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
          <Button
              className={`mt-6 ${hasUnsavedChanges 
                ? "bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800" 
                : "bg-gray-400 text-gray-900 dark:bg-dark-button-primary dark:text-dark-text-primary hover:bg-gray-700 dark:hover:bg-dark-button-hover"}`}
              disabled={!changeInformation || (!hasUnsavedChanges && Object.keys(errors).length === 0)}
              onClick={handleSaveChanges}
          >
            Зачувај промени
          </Button>
        </div>
      </div>
      
      {/* Unsaved Changes Dialog */}
      <Dialog open={unsavedChangesDialog} handler={setUnsavedChangesDialog}>
        <DialogHeader>Незачувани промени</DialogHeader>
        <DialogBody>
          Имате незачувани промени. Дали сакате да продолжите без да ги зачувате?
        </DialogBody>
        <DialogFooter>
          <Button 
            variant="text" 
            color="red" 
            onClick={handleUnsavedChangesCancel} 
            className="mr-1"
          >
            Откажи
          </Button>
          <Button variant="gradient" color="green" onClick={handleUnsavedChangesConfirm}>
            Продолжи без зачувување
          </Button>
        </DialogFooter>
      </Dialog>
      
      <ResetPasswordModal isOpen={isModalVisible} onClose={handleCloseModal}/>
      <FullScreenLoader loading={loading} />
    </section>
  );
}