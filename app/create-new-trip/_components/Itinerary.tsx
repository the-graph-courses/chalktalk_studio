"use client"

import React, { useState } from 'react'
import { Timeline } from '@/components/ui/timeline'
import { TripInfo } from './ChatBox'
import { ClockIcon } from 'lucide-react'
import HotelCardItem from './HotelCardItem'
import PlaceCardItem from './PlaceCardItem'
import { useTripDetail } from '@/app/provider'

const TRIP_DATA: TripInfo = {
    "budget": "Budget-friendly",
    "destination": "Paris, France",
    "duration": "3 Days",
    "group_size": "Solo Traveler",
    "origin": "London, UK",
    "hotels": [
        {
            "hotel_name": "Generator Paris",
            "description": "A vibrant modern hostel with rooftop terrace and Eiffel Tower views.",
            "hotel_address": "9 Place du Colonel Fabien, 75010 Paris, France",
            "hotel_image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
            "price_per_night": "€40 - €70",
            "rating": 7.8,
            "geo_coordinates": {
                "latitude": 48.8778,
                "longitude": 2.3653
            }
        },
        {
            "hotel_name": "Hotel Lutetia",
            "description": "Luxurious 5-star hotel with art deco design and Seine River views.",
            "hotel_address": "45 Boulevard Raspail, 75006 Paris, France",
            "hotel_image_url": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop",
            "price_per_night": "€300 - €500",
            "rating": 8.9,
            "geo_coordinates": {
                "latitude": 48.8517,
                "longitude": 2.3289
            }
        }
    ],
    "itinerary": [
        {
            "day": 1,
            "day_plan": "Arrival and historic center exploration",
            "best_time_to_visit_day": "Morning to Evening",
            "activities": [
                {
                    "place_name": "Notre Dame Cathedral",
                    "place_details": "Iconic Gothic cathedral (exterior view during restoration)",
                    "place_address": "Parvis Notre-Dame, 75004 Paris, France",
                    "place_image_url": "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=400&fit=crop",
                    "geo_coordinates": {
                        "latitude": 48.8529,
                        "longitude": 2.3499
                    },
                    "ticket_pricing": "Free",
                    "time_travel_each_location": "1 hour",
                    "best_time_to_visit": "Morning"
                },
                {
                    "place_name": "Louvre Museum",
                    "place_details": "World's largest art museum with Mona Lisa",
                    "place_address": "Rue de Rivoli, 75001 Paris, France",
                    "place_image_url": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop",
                    "geo_coordinates": {
                        "latitude": 48.8606,
                        "longitude": 2.3376
                    },
                    "ticket_pricing": "€17",
                    "time_travel_each_location": "3 hours",
                    "best_time_to_visit": "Early morning"
                }
            ]
        },
        {
            "day": 2,
            "day_plan": "Eiffel Tower and Montmartre",
            "best_time_to_visit_day": "Full day",
            "activities": [
                {
                    "place_name": "Eiffel Tower",
                    "place_details": "Paris's iconic iron tower with city views",
                    "place_address": "Champ de Mars, 75007 Paris, France",
                    "place_image_url": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600&h=400&fit=crop",
                    "geo_coordinates": {
                        "latitude": 48.8584,
                        "longitude": 2.2945
                    },
                    "ticket_pricing": "€28.30",
                    "time_travel_each_location": "2 hours",
                    "best_time_to_visit": "Sunset"
                }
            ]
        }
    ]
}


function Itinerary() {
    // @ts-ignore
    const { tripDetailInfo, setTripDetailInfo } = useTripDetail() || { tripDetailInfo: null, setTripDetailInfo: () => { } }
    const [tripData, setTripData] = useState<TripInfo | null>(tripDetailInfo)


    const data = [
        {
            title: "Recommended Hotels",
            key: "hotels",
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tripData?.hotels.map((hotel, index) => (
                        <HotelCardItem key={index} hotel={hotel} />
                    ))}
                </div>
            ),
        },
        ...(tripData?.itinerary?.map((dayData, dayIndex) => ({
            title: `Day ${dayData.day}`,
            key: `day-${dayData.day}`,
            content: (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{dayData.day_plan}</h3>
                        <p className="text-gray-600 flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            Best time to visit: {dayData.best_time_to_visit_day}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {dayData.activities.map((activity: any, index: number) => (
                            <PlaceCardItem key={index} place={activity} />
                        ))}
                    </div>
                </div>
            )
        })) || [])
    ];
    return (
        <div className="relative w-full h-[83vh] overflow-auto">
            <Timeline data={data} tripData={tripData || TRIP_DATA} />
        </div>
    );
}

export default Itinerary