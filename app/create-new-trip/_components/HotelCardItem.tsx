"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import axios from 'axios'

interface Hotel {
    hotel_name: string
    description: string
    hotel_address: string
    hotel_image_url: string
    price_per_night: string
    rating: number
    geo_coordinates: {
        latitude: number
        longitude: number
    }
}

interface HotelCardItemProps {
    hotel: Hotel
}

function HotelCardItem({ hotel }: HotelCardItemProps) {

    const [photoUrl, setPhotoUrl] = useState<string>();
    useEffect(() => {
        hotel && GetGooglePlaceDetail();
    }, [hotel])

    const GetGooglePlaceDetail = async () => {
        try {
            const result = await axios.post('/api/google-place-detail', {
                placeName: hotel?.hotel_name
            });
            if (result?.data && !result?.data?.error) {
                setPhotoUrl(result?.data);
            }
        } catch (error) {
            console.log('Error fetching hotel details:', error);
        }
    }
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <div className="relative h-48 w-full">
                <Image
                    src={photoUrl || hotel.hotel_image_url || '/placeholder.jpg'}
                    fill
                    alt={hotel.hotel_name}
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
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{hotel.hotel_name}</h3>
                <p className="text-gray-500 mb-2 text-sm">{hotel.hotel_address}</p>
                <p className="text-gray-600 mb-4 leading-relaxed">{hotel.description}</p>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-sm font-medium text-gray-700">
                            {hotel.rating}/10
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">{hotel.price_per_night}</div>
                        <div className="text-sm text-gray-500">per night</div>
                    </div>
                </div>

                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(hotel.hotel_name + ' ' + hotel.hotel_address)}`, '_blank')}
                >
                    View on Map
                </Button>
            </div>
        </div>
    )
}

export default HotelCardItem
