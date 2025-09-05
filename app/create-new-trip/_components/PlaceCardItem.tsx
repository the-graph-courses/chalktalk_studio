"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ClockIcon } from 'lucide-react'
import axios from 'axios'

interface Place {
    place_name: string
    place_details: string
    place_address: string
    place_image_url: string
    geo_coordinates: {
        latitude: number
        longitude: number
    }
    ticket_pricing: string
    time_travel_each_location: string
    best_time_to_visit: string
}

interface PlaceCardItemProps {
    place: Place
}

function PlaceCardItem({ place }: PlaceCardItemProps) {
    const [photoUrl, setPhotoUrl] = useState<string>();

    useEffect(() => {
        place && GetGooglePlaceDetail();
    }, [place])

    const GetGooglePlaceDetail = async () => {
        try {
            const result = await axios.post('/api/google-place-detail', {
                placeName: place?.place_name
            });
            if (result?.data && !result?.data?.error) {
                setPhotoUrl(result?.data);
            }
        } catch (error) {
            console.log('Error fetching place details:', error);
        }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <div className="relative h-48 w-full">
                <Image
                    src={photoUrl || place.place_image_url || '/placeholder.jpg'}
                    fill
                    alt={place.place_name}
                    className="object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/placeholder.jpg') {
                            target.src = '/placeholder.jpg';
                        }
                    }}
                />
            </div>
            <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">{place.place_name}</h2>
                <p className="text-gray-600 mb-3 leading-relaxed">{place.place_details}</p>
                <p className="text-gray-500 mb-2">{place.place_address}</p>

                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                        <span className="font-medium">💰</span>
                        <span>{place.ticket_pricing}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>{place.time_travel_each_location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-600">
                        <span className="font-medium">⏰</span>
                        <span>{place.best_time_to_visit}</span>
                    </div>
                </div>

                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(place.place_name + ' ' + place.place_address)}`, '_blank')}
                >
                    View on Map
                </Button>
            </div>
        </div>
    )
}

export default PlaceCardItem
