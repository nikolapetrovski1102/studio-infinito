import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Dialog, 
  DialogHeader, 
  DialogBody, 
  DialogFooter, 
  Typography,
  Chip 
} from "@material-tailwind/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import FullScreenLoader from "../FullScrennLoader/FullScreenLoader";

import { Axios } from "../Axios";
import { Cookie } from "../Cookie";
import Notification from "../Home/Notification";

const axios = new Axios();
const cookie = new Cookie();

dayjs.extend(customParseFormat);

export function ConfirmModal({ event_information, isOpen, setOpen, handleDateClick }) {
  const [loading, setLoading] = useState(false);
  const [eventTimeStart, setEventTimeStart] = useState(null);
  const [eventTimeEnd, setEventTimeEnd] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
  });

  const service_type = event_information?.appointmentData?.serviceType || {};
  
  useEffect(() => {
    if (notification?.message) {
      setTimeout(() => {
        setNotification({message: "", type: ""});
      }, 3000);
    }
  }, [notification]);

  useEffect(() => {
    if (!event_information?.event?.date || !event_information?.event?.time) return;

    var duration = service_type?.duration || 0;

    var parsedDate = dayjs(event_information.event.date, "DD-MM-YYYY");

    var startTime = parsedDate.isValid()
      ? parsedDate.set("hour", dayjs(event_information.event.time, "HH:mm:ss").hour())
                .set("minute", dayjs(event_information.event.time, "HH:mm:ss").minute())
      : dayjs(`${event_information.event.date.split("T")[0]}T${event_information.event.time}`);

    var endTime = startTime?.isValid() ? startTime.add(duration, "minute") : null;

    setEventTimeStart(startTime?.isValid() ? startTime : null);
    setEventTimeEnd(endTime?.isValid() ? endTime : null);

    setOpen(isOpen);
  }, [event_information, isOpen]);

  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
  };

  async function formatEventDate(event_information) {
    const user_id = parseInt(cookie.getCookie("user_id")) || 0;
    
    if (!event_information?.event?.date) {
        return {
            ...event_information,
            user_id
        };
    }

    const { date } = event_information.event;

    if (dayjs(date, "DD-MM-YYYY", true).isValid()) {
        return {
            ...event_information,
            user_id
        };
    }

    return {
        ...event_information,
        event: {
            ...event_information.event,
            date: dayjs(date, "YYYY-MM-DD").format("DD-MM-YYYY"),
        },
        user_id,
    };
  }

  const handleConfirm = async () => {
    setLoading(true);

    const formattedEvent = await formatEventDate(event_information);

    axios.post("Appointments/confirm-appointment", formattedEvent)
      .then((res) => {
        setLoading(false);

        if (res.status === 200) {
          if (res.data.status === 'success') {
            handleSuccess();
          } else {
            setNotification({
              message: res.data.message,
              type: res.data.status,
            });

            if (res.data.status === "warning") {
              setTimeout(() => {
                setOpen(false);
              }, 1000);
              setTimeout(() => {
                if (event_information?.date) {
                  const selectedDate = dayjs(event_information.date);
                  handleDateClick(selectedDate);
                }
              }, 200)
            }
          }
        }
      })
      .catch((error) => {
        setLoading(false);
        setNotification({
          message: 'Грешка при потврдување на резервацијата.',
          type: "error",
        });
      });
  };

  const handleSuccess = () => {
    if (cookie.getCookie("user_role") === "admin") {
      navigate("/admin", {
        state: {
          head_message: "Резервацијата е успешна",
          message: `Успешно резервираште ${service_type?.name || "N/A"} на ${event_information?.event?.date || "N/A"} од ${eventTimeStart ? eventTimeStart.format("HH:mm") : "N/A"}`,
          type: "success",
        },
      });
    }else{
      navigate("/home", {
        state: {
          head_message: "Резервацијата е успешна",
          message: `Успешно резервираште ${service_type?.name || "N/A"} на ${event_information?.event?.date || "N/A"} од ${eventTimeStart ? eventTimeStart.format("HH:mm") : "N/A"}`,
          type: "success",
        },
      });
    }
      setOpen(false);
  };

  return (
    <Dialog 
      open={isOpen} 
      handler={handleClose} 
      size="sm"
      className="dark:bg-dark-secondary rounded-xl overflow-hidden shadow-xl"
    >
      {notification.message && <Notification message={notification.message} type={notification.type} />}
      
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 px-6 py-4">
        <Typography variant="h4" className="text-white font-medium">
          Потврда на термин
        </Typography>
        <Typography className="text-gray-100 text-sm mt-1 opacity-90">
          Прегледајте ги деталите и потврдете
        </Typography>
      </div>
      
      <DialogBody className="px-6 py-6">
        {/* Service name and hairstylist section */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <Typography variant="h5" className="text-gray-900 dark:text-dark-text-primary font-medium">
              {service_type?.name || "N/A"}
            </Typography>
            <Chip 
              value={`${service_type?.price || "N/A"} ден.`} 
              className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium"
            />
          </div>
          <Typography className="text-gray-600 dark:text-dark-text-muted text-sm mt-1">
            со {event_information?.appointmentData?.hairstylist?.hairstylist || "N/A"}
          </Typography>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-dark-border mb-6"></div>
        
        {/* Date and time section with icons */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <Typography className="text-gray-700 dark:text-dark-text-primary font-medium">
                {event_information?.event?.date || "N/A"}
              </Typography>
              <Typography className="text-gray-500 dark:text-dark-text-muted text-sm">
                Датум
              </Typography>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <Typography className="text-gray-700 dark:text-dark-text-primary font-medium">
                {eventTimeStart ? eventTimeStart.format("HH:mm") : "N/A"} - {eventTimeEnd ? eventTimeEnd.format("HH:mm") : "N/A"}
              </Typography>
              <Typography className="text-gray-500 dark:text-dark-text-muted text-sm">
                Време ({service_type?.duration || "N/A"} минути)
              </Typography>
            </div>
          </div>
        </div>
        
        {/* Notes section */}
        <div className="bg-gray-50 dark:bg-dark-tertiary rounded-lg p-4 mb-2">
          <Typography className="text-gray-600 dark:text-dark-text-muted text-sm">
            Со потврдување на овој термин, се согласувате со нашите услови за резервација.
            Во случај на откажување, ве молиме известете не најмалку 2 часа претходно.
          </Typography>
        </div>
      </DialogBody>
      
      <DialogFooter className="flex flex-row w-full justify-between gap-3 px-6 pb-6">
        <Button
          variant="outlined"
          disabled={loading}
          className="flex-1 py-3 shadow-none border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-tertiary"
          onClick={handleClose}
        >
          Откажи
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md"
          loading={loading}
        >
          Резервирај
        </Button>
      </DialogFooter>
      <FullScreenLoader loading={loading} />
    </Dialog>
  );
}