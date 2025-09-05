"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ClockIcon, Loader2 } from 'lucide-react'
import axios from 'axios'

const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        const validHostnames = [
            'images.unsplash.com',
            'plus.unsplash.com',
            'assets.aceternity.com',
            'places.googleapis.com'
        ];
        return validHostnames.includes(urlObj.hostname);
    } catch {
        return false;
    }
};

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
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

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

    const getImageSrc = () => {
        if (imageError) return '/placeholder.svg';
        if (photoUrl) return photoUrl;
        if (isValidImageUrl(place.place_image_url)) return place.place_image_url;
        return '/placeholder.svg';
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <div className="relative h-48 w-full bg-gray-100">
                {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                )}
                <Image
                    src={getImageSrc()}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    alt={place.place_name}
                    className="object-cover"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                        setImageLoading(false);
                        setImageError(true);
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
