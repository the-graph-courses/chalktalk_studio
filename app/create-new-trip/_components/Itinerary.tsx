"use client"

import React, { useState, useEffect } from 'react'
import { Timeline } from '@/components/ui/timeline'
import { TripInfo } from './ChatBox'
import { ClockIcon } from 'lucide-react'
import HotelCardItem from './HotelCardItem'
import PlaceCardItem from './PlaceCardItem'
import { useTripDetail } from '@/app/provider'
import { Skeleton } from '@/components/ui/skeleton'

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
    const { tripDetailInfo, setTripDetailInfo, isGeneratingTrip, setIsGeneratingTrip } = useTripDetail() || {
        tripDetailInfo: null,
        setTripDetailInfo: () => { },
        isGeneratingTrip: false,
        setIsGeneratingTrip: () => { }
    }
    const [tripData, setTripData] = useState<TripInfo | null>(tripDetailInfo)

    useEffect(() => {
        if (tripDetailInfo) {
            console.log('Trip data updated in Itinerary:', tripDetailInfo)
            setTripData(tripDetailInfo)
        } else if (tripDetailInfo === null) {
            // Clear trip data when creating a new trip
            console.log('Clearing trip data in Itinerary')
            setTripData(null)
        }
    }, [tripDetailInfo])

    // Data structure for Timeline component: array of objects with title, key, and content (JSX)
    // First item: hotels section, followed by dynamically generated day itinerary items
    const data = [
        {
            title: "Recommended Hotels",
            key: "hotels",
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {tripData?.hotels.map((hotel, index) => (
                        <HotelCardItem key={index} hotel={hotel} />
                    ))}
                </div>
            ),
        },
        ...(tripData?.itinerary?.map((dayData) => ({
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
    // Show loading skeleton only when actively generating
    if (isGeneratingTrip) {
        return (
            <div className="relative w-full h-[83vh] overflow-auto p-4">
                <div className='space-y-6'>
                    {/* Timeline header skeleton */}
                    <div className='flex items-center space-x-4'>
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-6 w-48" />
                    </div>

                    {/* Hotels section skeleton */}
                    <div className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {[1, 2].map((i) => (
                                <div key={i} className='border rounded-lg p-4 space-y-3'>
                                    <Skeleton className="h-40 w-full rounded-md" />
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Day itinerary skeletons */}
                    {[1, 2, 3].map((day) => (
                        <div key={day} className='space-y-4'>
                            <div className='flex items-center space-x-4'>
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-6 w-24" />
                            </div>

                            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border space-y-2'>
                                <Skeleton className="h-6 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                {[1, 2].map((activity) => (
                                    <div key={activity} className='border rounded-lg p-4 space-y-3'>
                                        <Skeleton className="h-32 w-full rounded-md" />
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-1/3" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Show empty state when no trip data is available
    if (!tripData) {
        return (
            <div className="relative w-full h-[83vh] overflow-auto flex items-center justify-center p-8">
                <div className="text-center max-w-md mx-auto">
                    <div className="mb-8">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                            </svg>
                        </div>
                    </div>

                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                        Your Trip Itinerary Will Appear Here
                    </h3>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Once you complete the trip planning process, you'll see your personalized itinerary with:
                    </p>

                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>🏨 Recommended hotels with ratings and prices</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>📅 Day-by-day activity schedules</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>📍 Popular attractions and hidden gems</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>💰 Pricing and timing information</span>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-700 text-sm">
                            💡 Start by telling the AI assistant about your dream destination and travel preferences!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[83vh] overflow-auto">
            <Timeline data={data} tripData={tripData || TRIP_DATA} />
        </div>
    );
}

export default Itinerary
