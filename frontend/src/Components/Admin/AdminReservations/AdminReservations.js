import React, { useState, useRef, useEffect } from "react";
import { List, ListItem, Typography } from "@material-tailwind/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import UserModalDetails from "../../User/UserModalDetails";
import FullScreenLoader from "../../FullScrennLoader/FullScreenLoader";
import Notification from "../../Home/Notification";

import { Axios } from "../../Axios";
import { id } from "date-fns/locale/id";

const axios = new Axios();

export default function AdminReservations() {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollToRef = useRef(null);
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    description: "",
  });
  
  // Date filter states
  const [dateFilter, setDateFilter] = useState("Денес");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const reservationsPerPage = 5;

  const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);
  const startIndex = (currentPage - 1) * reservationsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, startIndex + reservationsPerPage);

  // Define date filter options
  const dateFilterOptions = [
    { value: "Денес", label: "Денес" },
    { value: "Утре", label: "Утре" },
    { value: "Оваа недела", label: "Оваа недела" },
    { value: "Овој месец", label: "Овој месец" },
    { value: "Избран период", label: "Избран период" },
    { value: "Сите", label: "Сите" },
  ];

  // Click outside handler for date dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dateDropdownRef]);

  // Click outside handler for date picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  // Initial load - fetch today's reservations once on component mount
  useEffect(() => {
    fetchFilteredReservations();
  }, []);

  // Function to fetch reservations based on date filter
  const fetchFilteredReservations = async () => {
    setLoading(true);
    
    try {
      let url = "Appointments/admin-appointments";
      let params = {};
      
      // Format dates to ISO string and slice to get YYYY-MM-DD
      const formatDateToISO = (date) => {
        if (!date) return null;
        return date.toISOString().slice(0, 10);
      };
      
      switch (dateFilter) {
        case "Денес":
          params.filter = "today";
          break;
        
        case "Утре":
          params.filter = "tomorrow";
          break;
        
        case "Оваа недела":
          params.filter = "this_week";
          break;
        
        case "Овој месец":
          params.filter = "this_month";
          break;
        
        case "Избран период":
          // Handle start date being selected
          if (startDate) {
            params.startDate = formatDateToISO(startDate);
            
            // If end date is also selected, use it
            if (endDate) {
              params.endDate = formatDateToISO(endDate);
            } else {
              // If only startDate is set, use the same date for endDate
              params.endDate = formatDateToISO(startDate);
            }
          } 
          // Handle only end date being selected (no start date)
          else if (endDate) {
            // Use end date for both parameters
            params.startDate = formatDateToISO(endDate);
            params.endDate = formatDateToISO(endDate);
          }
          break;
        
        case "Сите":
        default:
          // No filter parameters needed
          break;
      }
      
      // Convert params object to query string
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      // Append query string to URL if it exists
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      
      const response = await axios.get(fullUrl);
      
      if (response.status === 200) {
        setFilteredReservations(response.data);
        // Also update the full reservations list when "All" is selected
        if (dateFilter === "Сите") {
          setReservations(response.data);
        }
      }
    } catch (error) {
      console.error("Error fetching filtered reservations:", error);
      setNotification({
        message: "Грешка",
        type: "error",
        description: "Неуспешно поврзување со серверот.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (reservation) => {
    // Only process click if modal is not already visible
    if (!isModalVisible) {
      setSelectedReservation({
        id: reservation.appointment_id,
        date: reservation.appointment_date,
        time: reservation.appointment_time,
        service: reservation.name,
        status: reservation.status,
        name: reservation.full_name,
        image: reservation.user_image,
        gender: reservation.gender,
        phone: reservation.phone,
        email: reservation.email
      });
      setIsModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedReservation(null);
  };

  // Function to handle modal cancellation complete
  const handleModalCancelComplete = (message, type, description) => {
    setNotification({
      message,
      type,
      description,
    });
    
    // Refresh reservations after cancellation
    fetchFilteredReservations();
  };

  // Date filter handling
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setIsDateDropdownOpen(false);
    if (filter !== "Избран период") {
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    
    if (start && end) {
      // Keep date picker open for better UX
      // setShowDatePicker(false);
    }
  };

  const formatDateRange = () => {
    if (!startDate) return "Изберете датум";
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    if (endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    
    return formatDate(startDate);
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
    // Check if timeString is in the format "HH:MM:SS"
    if (typeof timeString === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      // Simply return the first 5 characters (HH:MM), removing seconds
      return timeString.substring(0, 5);
    }
    
    // If it's another format, try to create a date object
    try {
      // Handle ISO string format
      const timeDate = new Date(timeString);
      
      // Check if valid date
      if (!isNaN(timeDate.getTime())) {
        // Format to HH:MM (24-hour)
        return timeDate.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch (e) {
      console.log("Error formatting time:", e);
    }
    
    // Fallback - if we can't parse it, return original
    return timeString;
  };

  return (
    <div ref={scrollToRef} className="w-full mx-auto">
      <div className={`p-4 bg-white shadow-md sm:p-8 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl w-full max-w-2xl ${isModalVisible ? "pointer-events-none" : ""}`}>
        {/* Date filter UI */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h3 className="text-xl font-bold leading-none text-gray-900 dark:text-white mb-3 md:mb-0">
              Резервации {dateFilter !== "Сите" && `за ${dateFilter.toLowerCase()}`}
            </h3>
            
            {/* Date filter dropdown */}
            <div className="relative" ref={dateDropdownRef}>
              <button
                type="button"
                className="inline-flex justify-between items-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{dateFilter}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 dark:text-gray-400 ml-2 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isDateDropdownOpen && (
              <div className="absolute left-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1 max-h-65">
                  {dateFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`flex items-center w-full px-4 py-2.5 text-sm text-left ${
                        dateFilter === option.value 
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                          : "text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => handleDateFilterChange(option.value)}
                    >
                      {dateFilter === option.value && (
                        <svg className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {!dateFilter === option.value && <div className="w-4 mr-2" />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
          
          {/* Date picker */}
          {dateFilter === "Избран период" && (
            <div className="relative" ref={datePickerRef}>
              <div
                className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDateRange()}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showDatePicker && (
                <div className="absolute z-10 mt-1 w-full">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <DatePicker
                      selected={startDate}
                      startDate={startDate}
                      endDate={endDate}
                      selectsRange
                      inline
                      className="bg-white dark:bg-gray-800"
                      dayClassName={() => 
                        "text-center p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 mx-0.5"
                      }
                      onChange={handleDateChange}
                    />
                    <div className="flex justify-between mt-3">
                      <button
                        onClick={() => {
                          setStartDate(null);
                          setEndDate(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Ресетирај
                      </button>
                      <button
                        onClick={() => {
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                      >
                        Затвори
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Apply Filter Button */}
          <button
            onClick={fetchFilteredReservations}
            className="w-full mt-4 px-4 py-2.5 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-oragn transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
              Прикажи
          </button>
        </div>

        <List className="bg-white dark:bg-dark-secondary rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-700 p-0">
          {currentReservations.length > 0 ? (
            currentReservations.map((reservation) => {
              // Create date object for formatting
              const dateObject = new Date(reservation.appointment_date);
              
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
              const formattedTime = formatTime(reservation.appointment_time);
                
              return (
                <ListItem
                  key={reservation.appointment_id}  // Changed from reservation.id
                  onClick={() => handleRowClick(reservation)}
                  className={`p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-dark-tertiary ${isModalVisible ? 'pointer-events-none' : 'cursor-pointer'}`}
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
                          {reservation.full_name}  {/* Changed from reservation.name */}
                        </p>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {reservation.name}  {/* This is the service name */}
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
                {dateFilter === "Сите" 
                  ? "Немате направено резервации." 
                  : `Немате резервации за ${dateFilter.toLowerCase()}.`}
              </Typography>
            </div>
          )}
        </List>

        {/* Pagination Controls */}
        {filteredReservations.length > reservationsPerPage && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                scrollToRef.current?.scrollIntoView({ behavior: "smooth" });
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }}
              className={`w-1/3 px-3 py-2 mx-1 text-sm font-medium rounded-lg ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-700"} dark:text-white ${isModalVisible ? 'pointer-events-none' : ''}`}
              disabled={currentPage === 1 || isModalVisible}
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
              className={`w-1/3 px-3 py-2 mx-1 text-sm font-medium rounded-lg ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-700"} dark:text-white ${isModalVisible ? 'pointer-events-none' : ''}`}
              disabled={currentPage === totalPages || isModalVisible}
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

      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          description={notification.description}
        />
      )}
      
      <FullScreenLoader loading={loading} />
    </div>
  );
}