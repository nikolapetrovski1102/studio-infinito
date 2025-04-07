import React, { useState, useEffect } from "react";
import {
  Avatar,
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import Reservations from "./UserReservations";
import dayjs from "dayjs";
import FullScreenLoader from "../FullScrennLoader/FullScreenLoader";
import { Axios } from "../Axios";
import { Cookie } from "../Cookie";

import "./UserProfile.css";
import Notification from "../Home/Notification";

const axios = new Axios();
const cookie = new Cookie();

function UserProfile() {
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    description: ""
  });

  function isEmptyObject(arg) {
    return typeof arg === "object" && Object.keys(arg).length === 0;
  }

  useEffect(() => {
    setLoading(true);
    const user_id = cookie.getCookie("user_id");
    axios
      .post(`Appointments/user-appointments/${user_id}`)
      .then((resp) => {
        if (resp.status === 200) {
          if (resp.data.length === 0) return;

          setUserDetails({
            name: resp.data[0].full_name,
            email: resp.data[0].email,
            phone: resp.data[0].phone,
            image: resp.data[0].user_image,
          });

          if (resp.data[0].user_image !== localStorage.getItem("user_image")) {
            localStorage.setItem("user_image", resp.data[0].user_image + '123');
          }

          if (isEmptyObject(resp.data[0].appointment_id)) return;
          const mappedReservations = resp.data.map((item) => ({
            id: item.appointment_id,
            name: item.hairstylist_full_name,
            date: dayjs(item.appointment_date).format("YYYY-MM-DD"),
            time: item.appointment_time,
            service: item.name,
            status: item.status,
            image: item.user_image,
          }));
          setReservations(mappedReservations);
        }
      })
      .catch((error) => console.error("Error fetching appointments:", error))
      .finally(() => setLoading(false));
  }, [notification]);

  const handleReservationCancel = (message, type, description) => {
    setNotification({message: message, type: type, description: description})
  };

  return (
    <section className="container mx-auto md:px-8 py-10 flex justify-center">
      <Card
        shadow={false}
        className="bg-gray-200/70 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl w-full max-w-2xl"
      >
        <CardHeader 
          shadow={false} 
          className="!bg-transparent !rounded-t-2xl"
        >
          <div className="flex flex-col items-center justify-center">
            {userDetails.image ? (
              <Avatar
              className="w-32 h-32 border-4 border-white dark:border-gray-700 shadow-lg"
              src={userDetails.image}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center dark:bg-gray-600">
                <Typography variant="h5" className="text-gray-900 dark:text-white">
                  {userDetails.name ? userDetails.name.charAt(0) : "U"}
                </Typography>
              </div>
            )}
            <Typography
              className="mt-4 text-2xl font-semibold dark:text-white text-gray-900"
            >
              {userDetails.name || "User Name"}
            </Typography>
            <Typography
              variant="small"
              className="text-lg text-gray-600 dark:text-gray-300"
            >
              {userDetails.email || "user@example.com"}
            </Typography>
            <Typography
              variant="small"
              className="text-lg text-gray-600 dark:text-gray-300"
            >
              {userDetails.phone || "+123456789"}
            </Typography>
          </div>
        </CardHeader>
        <CardBody>
          <div>
            <Typography
              variant="h5"
              className="mb-4 text-gray-900 dark:text-white"
            >
              Имате <span className="A" > {reservations.length} </span> резервации
            </Typography>
            <Reservations 
              reservations={reservations}
              onCancelComplete={handleReservationCancel} 
            />
          </div>
        </CardBody>
      </Card>
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          description={notification.description}
        />
      )}
      <FullScreenLoader loading={loading} />
    </section>
  );
}

export default UserProfile;
