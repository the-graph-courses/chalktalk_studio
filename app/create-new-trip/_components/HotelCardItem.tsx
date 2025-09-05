"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
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
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

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
    const getImageSrc = () => {
        if (imageError) return '/placeholder.svg';
        if (photoUrl) return photoUrl;
        if (isValidImageUrl(hotel.hotel_image_url)) return hotel.hotel_image_url;
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
                    alt={hotel.hotel_name}
                    className="object-cover"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                    }}
                />
            </div>
            <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">{hotel.hotel_name}</h2>
                <p className="text-gray-600 mb-3 leading-relaxed">{hotel.description}</p>
                <p className="text-gray-500 mb-2">{hotel.hotel_address}</p>

                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                        <span className="font-medium">💰</span>
                        <span>{(() => {
                            const price = hotel.price_per_night;
                            if (!price) return 'Price not available';

                            // Remove 'per night' and clean up the price
                            const cleanPrice = price.replace(/per night/gi, '').replace(/night/gi, '').trim();

                            // If it already starts with $, return as is
                            if (cleanPrice.startsWith('$')) return `${cleanPrice}/night`;

                            // If it's just a number, add $ prefix
                            if (/^\d+$/.test(cleanPrice)) return `$${cleanPrice}/night`;

                            // Return as is for other formats
                            return cleanPrice ? `${cleanPrice}/night` : 'Price not available';
                        })()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                        <span className="font-medium">⭐</span>
                        <span>{hotel.rating ? (hotel.rating > 5 ? (hotel.rating / 2).toFixed(1) : hotel.rating.toFixed(1)) : 'N/A'}/5 Rating</span>
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
