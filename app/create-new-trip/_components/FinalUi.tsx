import { Button } from '@/components/ui/button'
import { Globe2, CheckCircle } from 'lucide-react'
import React from 'react'

function FinalUi({ viewTrip, disable, loading }: { viewTrip: () => void; disable: boolean; loading?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center mt-6 p-6 bg-white rounded-xl shadow-md">
            {loading ? (
                <Globe2 className="text-primary text-4xl animate-bounce" />
            ) : (
                <CheckCircle className="text-green-500 text-4xl" />
            )}
            <h2 className="mt-3 text-lg font-semibold text-primary">
                {loading ? '✈️ Planning your dream trip...' : '🎉 Your trip is ready!'}
            </h2>
            <p className="text-gray-500 text-sm text-center mt-1">
                {loading ? 'Gathering best destinations, activities, and travel details for you.' : 'Click below to view your personalized itinerary.'}
            </p>

            <Button disabled={disable} onClick={viewTrip} className='mt-2 w-full'>View Trip</Button>

            {/* <div className="w-48 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div className="h-2 bg-primary animate-pulse w-3/4"></div>
            </div> */}
        </div>
    )
}

export default FinalUi