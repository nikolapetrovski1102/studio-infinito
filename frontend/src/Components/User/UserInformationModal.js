import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
} from "@material-tailwind/react";

export default function UserInformationModal({ isOpen, onClose, userData }) {
  // Format phone number for better readability if needed
  const formatPhoneNumber = (phone) => {
    return phone || "Нема телефон";
  };
  
  // Convert gender code to text
  const getGenderText = (genderCode) => {
    return genderCode === 1 ? "Машко" : genderCode === 2 ? "Женско" : "Непознато";
  };
  
  // Stop propagation for the entire dialog content
  const handleDialogClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <Dialog
        open={isOpen}
        // handler={(open) => {
        //     if (!open) onClose();
        // }}
        className="rounded-xl overflow-hidden shadow-xl bg-white dark:bg-dark-secondary max-h-[90vh] overflow-y-auto z-50"
        size="sm"
        onClick={handleDialogClick}
        animate={{
            mount: { scale: 1, y: 0 },
            unmount: { scale: 0, y: -100 },
        }}
    >
      {/* Header with accent color */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-dark-button-primary dark:to-dark-tertiary">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        ></div>
        <DialogHeader className="relative flex justify-between items-center p-4 text-white border-b border-indigo-700 dark:border-dark-border">
          <div>
            <h3 className="text-lg font-bold">Информации за клиент</h3>
            <p className="text-xs text-indigo-100 dark:text-dark-text-secondary mt-1 font-normal">
              ID: {userData?.id || "Нема ID"}
            </p>
          </div>
          <button
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            className="rounded-full p-1 hover:bg-indigo-700 dark:hover:bg-dark-tertiary transition-colors w-auto"
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </DialogHeader>
      </div>

      <DialogBody className="p-4">
        <div className="flex flex-col gap-4">
          {/* User profile image and name */}
          <div className="flex flex-col items-center gap-3 p-3">
            <div className="relative">
              <img
                className="w-24 h-24 rounded-full object-cover border-2 border-white dark:border-dark-border shadow-md"
                src={userData?.image || 'https://via.placeholder.com/150'}
                alt={`${userData?.full_name} profile`}
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary">
                {userData?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-dark-text-muted">
                {userData?.role === "admin" ? "Администратор" : "Клиент"}
              </p>
            </div>
          </div>

          {/* User details cards */}
          <div className="grid grid-cols-1 gap-3">
            {/* Contact Information */}
            <div className="p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary mb-2">
                Контакт информации
              </h4>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Email</p>
                  <a href={`mailto:${userData?.email}`} className="text-sm font-medium text-gray-800 dark:text-dark-text-primary">
                    {userData?.email || "Нема email"}
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-600/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Телефон</p>
                  <a href={`tel:${userData?.phone}`} className="text-sm font-medium text-gray-800 dark:text-dark-text-primary">
                    {formatPhoneNumber(userData?.phone)}
                  </a>
                </div>
              </div>
            </div>
            
            {/* Personal Information */}
            <div className="p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary mb-2">
                Лични информации
              </h4>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-600/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Пол</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-dark-text-primary">
                    {getGenderText(userData?.gender)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Recent Appointments Summary */}
            {/* <div className="p-3 bg-amber-50 dark:bg-dark-tertiary dark:border dark:border-dark-border-light rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-600/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Тековна резервација
                </h4>
              </div>
              <div className="ml-8">
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  {userData?.name || "Нема назив на услуга"} - {userData?.price?.toFixed(2) || "0.00"} ден.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                  Времетраење: {userData?.duration || "0"} минути
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="p-4 pt-0">
        <Button
          fullWidth
          color="blue"
          onClick={onClose}
          className="rounded-lg bg-indigo-600 dark:bg-dark-button-primary hover:bg-indigo-700 dark:hover:bg-dark-button-hover transition-colors py-2"
        >
          <span>Затвори</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}