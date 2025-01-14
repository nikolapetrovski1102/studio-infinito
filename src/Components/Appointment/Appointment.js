import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import ServiceCard from "../ServiceTypeCard/ServiceCard";
import ServiceCardMobile from "../ServiceTypeCard/ServiceCardMobile";
import HairstylistCard from '../HairstylistCard/HairstylistCard'
import HairStylistMobile from '../HairstylistCard/HairStylistMobile'
import Calendar from "../Calendar/Calendar";
import { StepperWithContent } from "../Stepper/Stepper";

export default function Appointment() {
    const [step, setStep] = useState(0);
    const[selectedWorkReq, setSelectedWorkReq] = useState(null);
    const[price, setPrice] = useState(0);
    const[employee, setEmployee] = useState(null);
    const[isMobile, setIsMobile] = useState(false);
    const[Hairstylist, setHairstylist] = useState(false);
    const[WorkRequest, setWorkRequest] = useState(false);

    const navigate = useNavigate();

    const workReqs = [
        {name: "Шишање", price: 500, time: '30 min'},
        {name: "Фарбање", price: 1000, time: '1 h'},
        {name: "Фенирање", price: 400, time: '30 min'}
    ]

    const employees = ["Александар", "Марина"];

    useEffect(() => {
        if ( window.innerWidth < 700 ) setIsMobile(true);
    })


    // const handleWorkReqSelection = (workReq) => {
    //     setSelectedWorkReq(workReq);
    //     setPrice(workReq.price);
    //     setStep(2);
    // };

    const handleWRSWithStep = () => {
        setWorkRequest(true);
        setStep(2);
        console.log(step);
        // navigate("/reserve");
    }

    // const handleEmployeeSelection = (employee) => {
    //     setEmployee(employee);
    //     setStep(3);
    // }

    // const handleConfirmBooking = () => {
    //     setStep(1);
    //     setSelectedWorkReq(null);
    //     setPrice(0);
    //     setEmployee(null);
    //     navigate("/reserve");

    // }

    const handleHairstylistClick = (hairstylist) => {
        console.log(hairstylist);
        setHairstylist(true);
        setStep(1);
      };

    return (
        <div>
            <StepperWithContent activeStep={step}/>
            <div className="p-1" >
                {WorkRequest ? (
                    <div>
                        <Calendar />
                    </div>
                ) : (
                    <div>
                        {!Hairstylist ? (
                <div className="h-[70dvh]">
                    {isMobile ? (
                        <HairStylistMobile
                        onCardClick={handleHairstylistClick}
                        employee={employees} />
                    ) : (
                        <HairstylistCard 
                        onCardClick={handleHairstylistClick}
                        employee={employees}/>
                    )}
                </div>
                ) : (
                <div>
                    <h1 className="text-2xl font-bold mb-4">Одберете услуга</h1>
                    {isMobile ? (
                        <ServiceCardMobile 
                            serviceTypes={workReqs}
                            activeStep={step}
                            handleWorkReq={handleWRSWithStep}
                            />
                    ) : (
                        <ServiceCard 
                            serviceTypes={workReqs} 
                            activeStep={step}
                            handleWorkReq={handleWRSWithStep} 
                        />
                    )}
                </div>
                )}
                    </div>
                )}
            </div>
        </div>
    );
}