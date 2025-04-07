import React from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import dayjs from "dayjs";
import { Axios } from "../Axios";
import FullScreenLoader from "../FullScrennLoader/FullScreenLoader";
import { Description } from "@headlessui/react";
import Notification from "../Home/Notification";
import { useNavigate } from "react-router-dom";
import UserInformationModal from "./UserInformationModal"; // Import the new component
import { Cookie } from "../Cookie";

const axios = new Axios();
const cookie = new Cookie();

export default function UserModalDetails({ isOpen, reservation, onClose, onCancelComplete }) {
  const reservationDateTime = dayjs(`${reservation.date} ${reservation.time}`);
  const currentTime = dayjs();
  const isWithin24Hours = reservationDateTime.diff(currentTime, "hour") < 24;
  const timeRemaining = reservationDateTime.diff(currentTime, "hour");
  const [loading, setLoading] = React.useState(false);
  const user_role = cookie.getCookie("user_role");
  const [notification, setNotification] = React.useState({
    message: "",
    type: "",
    description: "",
  });
  
  // Add state for the user information modal
  const [userModalOpen, setUserModalOpen] = React.useState(false);

  // Format date to show day of week in Macedonian
  const dateObj = new Date(reservation.date);
  const macedonianDays = {
    0: 'Недела',
    1: 'Понеделник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четврток',
    5: 'Петок',
    6: 'Сабота'
  };
  const dayOfWeek = macedonianDays[dateObj.getDay()];
  
  // Format date as dd/mm/yyyy
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Format time to HH:MM
  const formatTime = (timeString) => {
    try {
      const timeDate = new Date(`2000-01-01T${timeString}`);
      return timeDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return timeString;
    }
  };
  
  // Function to handle opening the user information modal
  const handleUserInformationModal = (e) => {
    if (user_role === 'admin') {
      e.stopPropagation(); // Add this line
      setUserModalOpen(true);
    }
  };
  
  const handleCancelReservation = (appointment_id) => {
    setLoading(true);

    axios.post('Appointments/cancel-appointment', { appointment_id, cancelled_from: cookie.getCookie('user_id') })
    .then((res) => {
      if (res.status === 200) {
        if (res.data.status === 'success') {
          onCancelComplete(res.data.message, res.data.status, res.data.description)
        } else if (res.data.status === 'error' || res.data.status === 'warning') {
          onCancelComplete(res.data.message, res.data.status, res.data.description)
          console.error("Error cancelling reservation:", res.data.message);
        }
      }
    })
    .catch((error) => {
      console.log(error);
      onCancelComplete('Се случи грешка, обидете се повторно', 'error', '')
    })
    // Close the modal after cancellation
    .finally(() => {
      setLoading(false);
      onClose();
    });
  }

  const formattedTime = formatTime(reservation.time);

  return (
    <Dialog
          open={isOpen} 
          handler={onClose}
          onClick={(e) => e.stopPropagation()} // Add this to stop all clicks inside the modal from propagating
          className="rounded-xl overflow-hidden shadow-xl bg-white dark:bg-dark-secondary max-h-[90vh] overflow-y-auto"
          size="sm"
        >
        {/* Custom header with accent color and pattern */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 dark:from-dark-button-primary dark:to-dark-tertiary">
          <div className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          ></div>
          <DialogHeader className="relative flex justify-between items-center p-4 text-white border-b border-blue-700 dark:border-dark-border">
            <div>
              <h3 className="text-lg font-bold">Детали за резервација</h3>
              <p className="text-xs text-blue-100 dark:text-dark-text-secondary mt-1 font-normal">
                {dayOfWeek}, {formattedDate}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-blue-700 dark:hover:bg-dark-tertiary transition-colors w-auto"
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
            {/* Client information - Updated with onClick handler */}
            <div 
              onClick={handleUserInformationModal}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-border-light transition-colors"
            >
              <div className="relative">
                <img
                  className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-dark-border shadow-md"
                  src={reservation.image || 'https://via.placeholder.com/150'}
                  alt={`${reservation.name} profile`}
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-dark-text-primary">{reservation.name}</h3>
                <p className="text-xs text-gray-600 dark:text-dark-text-muted">{reservation.service}</p>
              </div>
              {/* Add indicator to show it's clickable */}
              {(user_role === 'admin') && (
                <div className="ml-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                )}
            </div>
            
            {/* Appointment details - combined into one row to save space */}
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-blue-50 dark:bg-dark-tertiary dark:border dark:border-dark-border-light rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-dark-accent-primary/20 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-dark-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-dark-accent-primary font-medium">Време</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-dark-text-primary">{formattedTime}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-3 bg-purple-50 dark:bg-dark-tertiary dark:border dark:border-dark-border-light rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-600/20 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Статус</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-dark-text-primary">
                      {reservation.status === 'confirmed' ? 'Потврдено' : 
                      reservation.status === 'pending' ? 'Чека' : 
                      reservation.status === 'cancelled' ? 'Откажано' :
                      reservation.status === 'completed' ? 'Завршено' :
                      'Неуспешно'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Time remaining warning if applicable */}
            {isWithin24Hours && (
              <div className="mt-1 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="p-1 mt-0.5 bg-amber-100 dark:bg-amber-600/30 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Не може да се откаже</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300">
                      Терминот е за помалку од 24 часа 
                      {timeRemaining > 0 && (
                        <span> ({timeRemaining} час{timeRemaining !== 1 ? 'а' : ''})</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="p-4 pt-0 gap-2 flex flex-col sm:flex-row">
          <Button
            variant="outlined"
            fullWidth
            color="red"
            onClick={() => handleCancelReservation(reservation.id)}
            disabled={isWithin24Hours}
            className={`rounded-lg border border-red-500 text-red-500 dark:border-red-500/70 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors py-2 ${
              isWithin24Hours ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:bg-transparent" : ""
            }`}
          >
            <span>Откажи термин</span>
          </Button>
          <Button 
            fullWidth 
            color="blue"
            onClick={onClose} 
            className="rounded-lg bg-blue-600 dark:bg-dark-button-primary hover:bg-blue-700 dark:hover:bg-dark-button-hover transition-colors py-2"
          >
            <span>Затвори</span>
          </Button>
        </DialogFooter>

          {/* Notification for success or error */}
          {notification.message && (
            <Notification message={notification.message} type={notification.type} description={notification.description} />
          )}
          {/* Full screen loader */}
          <FullScreenLoader loading={loading} />

          {/* User Information Modal */}
          <UserInformationModal
            isOpen={userModalOpen} 
            onClose={() => setUserModalOpen(false)} 
            userData={reservation} 
        />

      </Dialog>
  );
}