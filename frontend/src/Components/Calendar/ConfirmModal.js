import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Typography } from "@material-tailwind/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import FullScreenLoader from "../FullScrennLoader/FullScreenLoader";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { Axios } from "../Axios";
import { Cookie } from "../Cookie";
import Notification from "../Home/Notification";
import { el } from "date-fns/locale/el";

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
  
  useEffect( () => {

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

    console.log(parsedDate.format("DD-MM-YYYY"));

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
      navigate("/home", {
        state: {
          head_message: "Резервацијата е успешна",
          message: `Успешно резервираште ${service_type?.name || "N/A"} на ${event_information?.event?.date || "N/A"} од ${eventTimeStart ? eventTimeStart.format("HH:mm") : "N/A"}`,
          type: "success",
        },
      });
      setOpen(false);
  };

  return (
    <Dialog open={isOpen} handler={handleClose} className="dark:bg-dark-secondary">
      {notification.message && <Notification message={notification.message} type={notification.type} /> }
      <DialogHeader>
        <Typography variant="h5" className="text-gray-800 dark:text-dark-text-primary">
          Потврда на термин
        </Typography>
      </DialogHeader>
      <DialogBody divider className="grid place-items-center gap-2">
        <div className="flex justify-between items-center w-full border-b-2 border-gray-200 dark:border-dark-border">
          <p className="text-gray-400 dark:text-dark-text-muted ml-4">Одбран вработен</p>
          <p className="text-black dark:text-dark-text-primary mr-4">{event_information?.appointmentData?.hairstylist?.hairstylist || "N/A"}</p>
        </div>
        <div className="flex justify-between items-center w-full border-b-2 border-gray-200 dark:border-dark-border">
          <p className="text-gray-400 dark:text-dark-text-muted ml-4">Одбрана услуга</p>
          <p className="text-black dark:text-dark-text-primary mr-4">{service_type?.name || "N/A"}</p>
        </div>
        <div className="flex justify-between items-center w-full border-b-2 border-gray-200 dark:border-dark-border">
          <p className="text-gray-400 dark:text-dark-text-muted ml-4">Датум</p>
          <p className="text-black dark:text-dark-text-primary mr-4">{event_information?.event?.date || "N/A"}</p>
        </div>
        <div className="flex justify-between items-center w-full border-b-2 border-gray-200 dark:border-dark-border">
          <p className="text-gray-400 dark:text-dark-text-muted ml-4">Време</p>
          <p className="text-black dark:text-dark-text-primary mr-4">
              {eventTimeStart ? eventTimeStart.format("HH:mm") : "N/A"} - {eventTimeEnd ? eventTimeEnd.format("HH:mm") : "N/A"}
          </p>
        </div>
        <div className="flex justify-between items-center w-full">
          <p className="text-gray-400 dark:text-dark-text-muted ml-4">Цена</p>
          <p className="text-indigo-600 dark:text-dark-accent-primary mr-4">{service_type?.price || "N/A"} ден.</p>
        </div>
      </DialogBody>
      <DialogFooter className="flex flex-row w-full justify-center gap-5">
        <Button
          variant="outlined"
          disabled={loading}
          fullWidth
          className="text-red-500 border-red-500 dark:text-red-400 dark:border-red-400"
          onClick={handleClose}
        >
          Откажи
        </Button>
        <Button
          onClick={handleConfirm}
          fullWidth
          className="bg-dark-button-primary dark:hover:bg-dark-button-hover"
          loading={loading}
        >
          Резервирај
        </Button>
      </DialogFooter>
      <FullScreenLoader loading={loading} />
    </Dialog>
  );
}
