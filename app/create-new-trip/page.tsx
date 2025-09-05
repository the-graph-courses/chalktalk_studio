'use client'
import React from 'react'
import ChatBox from './_components/ChatBox'
import Itinerary from './_components/Itinerary'
import { useTripDetail } from '@/app/provider'

function CreateNewTrip() {
    const { tripDetailInfo } = useTripDetail() || { tripDetailInfo: null }
    const hasTripData = tripDetailInfo !== null

    return (
        <div
            className={`p-10 ${hasTripData ? 'grid grid-cols-1 md:grid-cols-7 gap-5' : 'flex justify-center items-start'
                }`}
        >
            {hasTripData && (
                <div key='itinerary' className='md:col-span-5'>
                    <Itinerary />
                </div>
            )}
            <div key='chatbox-container' className={hasTripData ? 'md:col-span-2' : 'w-full max-w-2xl'}>
                <ChatBox />
            </div>
        </div>
    )
}

export default CreateNewTrip