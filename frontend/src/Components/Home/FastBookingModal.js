import React, { useEffect } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Select,
  Option,
  Typography,
  IconButton
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "../FullScrennLoader/FullScreenLoader";
import { Axios } from "../Axios";

const axios = new Axios();

export function FastBookingModal({ isOpen, onClose, onSubmit }) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(isOpen);
  const [data, setData] = React.useState({ 
    appointmentDto: {
      hairstylist: {},
      serviceType: {}
    }
  });
  const [loading, setLoading] = React.useState(false);
  const [services, setServices] = React.useState([]);

  React.useEffect(() => {
    setOpen(isOpen);
    if (isOpen) {
      axios.get(`Appointments/get-services`).then((res) => {
        if (res.status === 200) {
          setServices(res.data);
        }
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleSubmit = () => {
    setLoading(true);
  
    const requestData = {
      hairstylist: {
        hairstylist_id: data.appointmentDto.hairstylist.hairstylist_id,
        hairstylist: data.appointmentDto.hairstylist.hairstylist
      },
      serviceType: {
        key: data.appointmentDto.serviceType.key,
        service_id: data.appointmentDto.serviceType.service_id,
        name: data.appointmentDto.serviceType.name,
        description: data.appointmentDto.serviceType.description,
        price: data.appointmentDto.serviceType.price,
        duration: data.appointmentDto.serviceType.duration
      },
      page_number: 1,
      page_size: 20
    };
  
    axios.post(`Appointments/fast-booking`, requestData).then((res) => {
      if (res.status === 200) {
        onSubmit(data);
        handleClose();
        setLoading(false);
        const appointments = res.data;
        navigate("/fast-booking", { state: { data: { appointments, requestData }} });
      }
    });
  };

  return (
    <Dialog
      open={open}
      handler={handleClose}
      size="sm"
      className="bg-white dark:bg-dark-primary rounded-xl overflow-hidden shadow-xl"
    >
      <FullScreenLoader loading={loading} />
      
      {/* Header with decorative element */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
        <DialogHeader className="flex justify-between items-center px-6 pt-6 pb-2">
          <div>
            <Typography variant="h4" className="text-gray-800 dark:text-dark-text-primary font-medium">
              Најди најбрз термин
            </Typography>
            <Typography className="text-gray-600 dark:text-dark-text-muted text-sm mt-1">
              Изберете опции за да пронајдете достапни термини
            </Typography>
          </div>
        </DialogHeader>
      </div>
      
      <DialogBody className="px-6 py-4">
        <div className="space-y-6">
          {/* Employee selection with icon */}
          <div className="space-y-2">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <Typography className="text-gray-700 dark:text-dark-text-primary text-sm font-medium">
                Избери вработен
              </Typography>
            </div>
            <Select
              onChange={(value) => {
                const selectedHairstylist = value === "1" ? "Александар" : "Марина";
                setData({
                  ...data,
                  appointmentDto: {
                    ...data.appointmentDto,
                    hairstylist: {
                      hairstylist_id: value,
                      hairstylist: selectedHairstylist
                    }
                  }
                });
              }}
              className="border border-gray-300 dark:border-dark-border rounded-lg shadow-sm text-gray-800 dark:text-dark-text-primary dark:bg-dark-secondary"
              containerProps={{
                className: "min-w-full"
              }}
            >
              <Option value='1' className="hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <span className="text-blue-600 font-medium text-xs">А</span>
                  </div>
                  Александар
                </div>
              </Option>
              <Option value='2' className="hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                    <span className="text-purple-600 font-medium text-xs">М</span>
                  </div>
                  Марина
                </div>
              </Option>
            </Select>
          </div>
          
          {/* Service selection with icon */}
          <div className="space-y-2">
            <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" height="800px" width="800px" version="1.1" id="Layer_1" viewBox="0 0 505 505" xmlSpace="preserve">
                <circle fill="#324A5E" cx="252.5" cy="252.5" r="252.5"/>
                <path fill="#4CDBC4" d="M338.6,320c-12.4,6.2-20.6,16.5-24.4,28.1l-23.6-31.8c-5.1-6.9-3.7-16.6,3.2-21.7l2.2-1.6L149.4,95.5c-23.9,17.8-28.9,51.6-11.2,75.5l114.5,154.2l0,0c6.9-5.1,16.6-3.7,21.7,3.2l45.8,61.8c15.3,20.6,44.4,27,65.8,12.7c25.7-17.1,29.3-54.1,5.4-75.7C377.1,314.3,355.8,311.5,338.6,320z M377.1,386.6c-13,9.7-31.4,7-41.1-6s-6.9-31.4,6.1-41.1s31.4-7,41.1,6C392.9,358.5,390.1,376.9,377.1,386.6z"/>
                <path fill="#E6E9EE" d="M113.4,327.5c-23.8,21.7-20,58.7,5.8,75.7c20.9,13.7,51,7.1,65.8-13.1l45.5-62c5.1-6.9,14.8-8.4,21.7-3.3l0,0L365.9,170c17.6-24,12.4-57.8-11.6-75.4L208.7,292.7l2.2,1.6c6.9,5.1,8.4,14.8,3.3,21.6l-23.5,32c-3.9-11.6-12.1-21.8-24.5-27.9C148.9,311.5,127.6,314.5,113.4,327.5z M121.7,345.7c9.6-13.1,28-15.9,41.1-6.3c13.1,9.6,15.9,28,6.3,41.1c-9.6,13.1-28,15.9-41.1,6.3S112.1,358.8,121.7,345.7z"/>
                <circle fill="#324A5E" cx="252.3" cy="278.3" r="9.8"/>
              </svg>
            </div>
              <Typography className="text-gray-700 dark:text-dark-text-primary text-sm font-medium">
                Избери услуга
              </Typography>
            </div>
            <Select
              disabled={!data.appointmentDto.hairstylist?.hairstylist_id}
              onChange={(value) => {
                const selectedService = services.find(
                  (service) => service.service_id === parseInt(value)
                );
                setData({
                  ...data,
                  appointmentDto: {
                    ...data.appointmentDto,
                    serviceType: selectedService
                  }
                });
              }}
              className={`border border-gray-300 dark:border-dark-border rounded-lg shadow-sm text-gray-800 dark:text-dark-text-primary dark:bg-dark-secondary 
                ${!data.appointmentDto.hairstylist?.hairstylist_id ? 'opacity-60' : ''}`}
              containerProps={{
                className: "min-w-full"
              }}
            >
              {services.map((service) => (
                <Option key={service.service_id} value={String(service.service_id)} className="hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                  <div className="flex justify-between items-center w-full">
                    <span>{service.name}</span>
                    <span className="text-sm text-purple-600 dark:text-purple-400">{service.price} ден.</span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          
          {/* Selected info card - shows when both options are selected */}
          {data.appointmentDto.hairstylist?.hairstylist_id && data.appointmentDto.serviceType?.service_id && (
            <div className="bg-gray-50 dark:bg-dark-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border mt-4">
              <div className="flex justify-between items-center mb-2">
                <Typography className="font-medium text-gray-800 dark:text-dark-text-primary">
                  Избрана услуга
                </Typography>
                <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400 text-xs font-medium">
                  {data.appointmentDto.serviceType.duration} мин.
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-dark-text-muted">{data.appointmentDto.serviceType.name}</span>
                <span className="text-gray-800 dark:text-dark-text-primary font-medium">{data.appointmentDto.serviceType.price} ден.</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-text-secondary mt-2">
                со {data.appointmentDto.hairstylist.hairstylist}
              </div>
            </div>
          )}
        </div>
      </DialogBody>
      
      <DialogFooter className="flex flex-row justify-between px-6 py-4 bg-gray-50 dark:bg-dark-secondary border-t border-gray-200 dark:border-dark-border">
        <Button
          variant="outlined"
          color="gray"
          onClick={handleClose}
          className="flex-1 mr-2 py-2.5 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-tertiary shadow-none"
        >
          Откажи
        </Button>
        <Button
          color="blue"
          onClick={handleSubmit}
          disabled={!data.appointmentDto.hairstylist?.hairstylist_id || !data.appointmentDto.serviceType?.service_id}
          className="flex-1 ml-2 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-600 dark:to-purple-600 text-white shadow-md transition-all"
        >
          Пребарај термини
        </Button>
      </DialogFooter>
    </Dialog>
  );
}