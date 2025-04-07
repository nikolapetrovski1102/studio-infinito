import React, { useState, useRef } from "react";
import { List, ListItem, Typography } from "@material-tailwind/react";
import UserModalDetails from "./UserModalDetails";
import FullScreenLoader from "../FullScrennLoader/FullScreenLoader";
import Notification from "../Home/Notification";

export default function Reservations({ reservations = [], onCancelComplete }) {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollToRef = useRef(null); 

  const [currentPage, setCurrentPage] = useState(1);
  const reservationsPerPage = 5;

  const totalPages = Math.ceil(reservations.length / reservationsPerPage);
  const startIndex = (currentPage - 1) * reservationsPerPage;
  const currentReservations = reservations.slice(startIndex, startIndex + reservationsPerPage);

  const handleRowClick = (reservation) => {
    if (isModalVisible) return;

    setSelectedReservation(reservation);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedReservation(null);
  };

  const parseReservationStatus = (status) => {
    switch (status) {
      case "pending":
        return "На чекање";
      case "confirmed":
        return "Одобрен";
      case "completed":
        return "Завршен";
      case "cancelled":
        return "Откажан";
      default:
        return "На чекање";
    }
  };

  const formatTime = (timeString) => {
    // Try to create a date object from the time string
    let timeDate;
    
    try {
      // Check if it's already a time string with colons
      if (timeString.includes(':')) {
        // Add dummy date to create a valid date object
        timeDate = new Date(`2000-01-01T${timeString}`);
      } else {
        // If it's another format (maybe timestamp or something else)
        timeDate = new Date(timeString);
      }
      
      // Format to HH:MM (24-hour)
      return timeDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      // Fallback - if we can't parse it, return original
      console.log("Error formatting time:", e);
      return timeString;
    }
  };

  const handleModalCancelComplete = (message, type, description) => {
    if (onCancelComplete) {
      onCancelComplete(message, type, description);
    }
  };

  return (
    <div ref={scrollToRef} className={`w-full mx-auto ${isModalVisible ? "pointer-events-none" : ""} `}>
      <div className="p-4 bg-white shadow-md sm:p-8 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
            Резервации
          </h3>
        </div>

        <List className="bg-white dark:bg-dark-secondary rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 p-0">
          {currentReservations.length > 0 ? (
            currentReservations.map((reservation) => {
              // Create date object for formatting
              const dateObject = new Date(reservation.date);
              
              // Format date to dd/mm/yyyy
              const formattedDate = dateObject.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              
              // Get day of week in Macedonian
              const macedonianDays = {
                0: 'Недела',    // Sunday
                1: 'Понеделник', // Monday
                2: 'Вторник',   // Tuesday
                3: 'Среда',     // Wednesday
                4: 'Четврток',  // Thursday
                5: 'Петок',     // Friday
                6: 'Сабота'     // Saturday
              };
              const dayOfWeek = macedonianDays[dateObject.getDay()];
              
              // Format time to HH:MM
              const formattedTime = formatTime(reservation.time);
                
              return (
                <ListItem
                  key={reservation.id}
                  onClick={() => handleRowClick(reservation)}
                  className="p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-dark-tertiary"
                >
                  <div className="flex items-center gap-4">
                    {/* Status indicator */}
                    <div className={`flex-shrink-0 w-2 h-12 rounded-full ${
                      reservation.status === 'confirmed' ? 'bg-green-500' : 
                      reservation.status === 'pending' ? 'bg-amber-500' : 
                      reservation.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    
                    <div className="flex flex-col sm:flex-row w-full gap-2 sm:items-center sm:justify-between">
                      {/* Left side - Reservation details */}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {reservation.name}
                        </p>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {reservation.service}
                        </p>
                      </div>
                      
                      {/* Middle - Date and time with Macedonian day */}
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">{dayOfWeek}</span>, {formattedDate}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 mx-1">•</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{formattedTime}</span>
                        </div>
                      </div>
                      
                      {/* Right side - Status */}
                      <div className={`text-sm font-medium px-3 py-1 rounded-full text-center w-24 ${
                        reservation.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                        reservation.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' : 
                        reservation.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 
                        'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                      }`}>
                        {parseReservationStatus(reservation.status)}
                      </div>
                    </div>
                  </div>
                </ListItem>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <Typography variant="paragraph" className="text-gray-500 dark:text-gray-400 mb-3">
                Немате направено резервации.
              </Typography>
              <a 
                href="/home" 
                className="dark:bg-dark-button-primary dark:focus:ring-dark-primary dark:hover:bg-dark-tertiary inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Направете резервација
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          )}
        </List>

        {/* Pagination Controls */}
        {reservations.length > reservationsPerPage && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                scrollToRef.current?.scrollIntoView({ behavior: "smooth" });
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }}
              className={`w-1/3 px-3 py-2 mx-1 text-sm font-medium rounded-lg ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-700"} dark:text-white`}
              disabled={currentPage === 1}
            >
              Назад
            </button>

            <span className="px-3 py-2 text-sm font-medium dark:text-white">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => {
                scrollToRef.current?.scrollIntoView({ behavior: "smooth" });
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }}
              className={`w-1/3 px-3 py-2 mx-1 text-sm font-medium rounded-lg ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-700"} dark:text-white`}
              disabled={currentPage === totalPages}
            >
              Напред
            </button>
          </div>
        )}
      </div>

      {selectedReservation && (
        <UserModalDetails
          isOpen={isModalVisible}
          reservation={selectedReservation}
          onClose={handleCloseModal}
          onCancelComplete={handleModalCancelComplete}
        />
      )}
      <FullScreenLoader loading={loading} />
    </div>
  );
}
