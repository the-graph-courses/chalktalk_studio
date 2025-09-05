'use client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader, Send } from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'
import EmptyBoxState from './EmptyBoxState'
import GroupSizeUi from './GroupSizeUi'
import BudgetUi from './BudgetUi'
import SelectDaysUi from './SelectDaysUi'
import FinalUi from './FinalUi'
import { useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useTripDetail, useUserDetail } from '@/app/provider'
import { v4 as uuidv4 } from 'uuid';

export type Message = {
    role: string,
    content: string,
    ui?: string
}

export type TripInfo = {
    budget: string
    destination: string
    duration: string
    group_size: string
    origin: string
    hotels: Hotel[]
    itinerary: ItineraryDay[]
}

export type Hotel = {
    hotel_name: string
    hotel_address: string
    price_per_night: string
    hotel_image_url: string
    geo_coordinates: {
        latitude: number
        longitude: number
    }
    rating: number
    description: string
}

export type Activity = {
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

export type ItineraryDay = {
    day: number
    day_plan: string
    best_time_to_visit_day: string
    activities: Activity[]
}
function ChatBox() {


    const [messages, setMessages] = useState<Message[]>([])
    const [userInput, setUserInput] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [isFinal, setIsFinal] = useState<boolean>(false)
    const [tripDetail, setTripDetail] = useState<TripInfo | null>(null)
    const [tripCompleted, setTripCompleted] = useState<boolean>(false)
    const { tripDetailInfo, setTripDetailInfo, isGeneratingTrip, setIsGeneratingTrip } = useTripDetail() || {
        tripDetailInfo: null,
        setTripDetailInfo: () => { },
        isGeneratingTrip: false,
        setIsGeneratingTrip: () => { }
    }
    const SaveTripDetail = useMutation(api.tripDetail.CreateTripDetail)
    const { userDetail, setUserDetail } = useUserDetail()

    const onSend = async (messageContent?: string) => {
        const content = messageContent || userInput;
        if (!content?.trim()) return;

        setLoading(true)
        const newMsg: Message = {
            role: 'user',
            content: content
        }
        setUserInput('');

        setMessages((prev: Message[]) => [...prev, newMsg])

        try {
            const result = await axios.post('/api/aimodel', {
                messages: [...messages, newMsg],
                isFinal,
                tripCompleted,
                currentTripDetail: tripDetail
            })

            setMessages((prev: Message[]) => [...prev, {
                role: 'assistant',
                content: result?.data?.resp,
                ui: result?.data?.ui
            }])

            // If this is a trip modification response, update the trip detail
            if (result?.data?.trip_plan && tripCompleted) {
                setTripDetail(result.data.trip_plan);
                setTripDetailInfo(result.data.trip_plan);

                // Add a follow-up message confirming the change and prompting for more modifications
                setTimeout(() => {
                    setMessages((prev: Message[]) => [...prev, {
                        role: 'assistant',
                        content: "✅ Changes applied successfully! Your trip has been updated. If you'd like to make any other changes, just let me know what else you'd like to modify."
                    }]);
                }, 1000);
            }
        } finally {
            setLoading(false)
        }
    }

    const onDirectSend = async (value: string) => {
        setLoading(true)

        // Add user's selection as a message
        const userSelectionMsg: Message = {
            role: 'user',
            content: value
        }

        setMessages((prev: Message[]) => [...prev, userSelectionMsg])

        try {
            const result = await axios.post('/api/aimodel', {
                messages: [...messages, userSelectionMsg],
                isFinal,
                tripCompleted,
                currentTripDetail: tripDetail
            })

            setMessages((prev: Message[]) => [...prev, {
                role: 'assistant',
                content: result?.data?.resp,
                ui: result?.data?.ui
            }])
        } finally {
            setLoading(false)
        }
    }



    const RenderGenerativeUi = (ui: string | undefined) => {
        switch (ui) {
            case 'budget':
                return <BudgetUi onSelectedOption={onDirectSend} />
            case 'groupSize':
                return <GroupSizeUi onSelectedOption={onDirectSend} />
            case 'tripDuration':
                return <SelectDaysUi onSelectedOption={onDirectSend} />
            case 'final':
                return <FinalUi viewTrip={() => console.log()}
                    disable={!tripDetail}
                    loading={loading}
                />
            default:
                return null
        }
    }

    useEffect(() => {
        const lastMsg = messages[messages.length - 1]
        if (lastMsg?.ui === 'final') {
            console.log('Final UI triggered, generating trip plan...')
            setIsFinal(true);
            // Automatically trigger the final trip generation
            generateFinalTrip();
        }
    }, [messages])

    // Load an existing trip from context when arriving from /trips
    useEffect(() => {
        if (tripDetail == null && tripDetailInfo) {
            setTripDetail(tripDetailInfo)
            setTripCompleted(true)
            setMessages((prev: Message[]) => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        "I've loaded your saved trip. Tell me what you'd like to change — hotels, activities for a day, budget, or duration — and I'll update it."
                }
            ])
        } else if (tripDetailInfo === null && (tripDetail !== null || messages.length > 0 || tripCompleted)) {
            // Reset state when creating a new trip (tripDetailInfo is cleared)
            setTripDetail(null)
            setTripCompleted(false)
            setMessages([])
            setIsFinal(false)
        }
    }, [tripDetailInfo])

    const generateFinalTrip = async () => {
        console.log('Starting final trip generation...')
        setLoading(true)
        setIsGeneratingTrip(true)

        try {
            const result = await axios.post('/api/aimodel', {
                messages: messages,
                isFinal: true,
                tripCompleted: false,
                currentTripDetail: null
            })

            console.log('FINAL TRIP GENERATION RESPONSE:', result.data)
            console.log('Full trip plan:', JSON.stringify(result.data, null, 2))

            if (result.data?.trip_plan) {
                setTripDetail(result.data.trip_plan);
                setTripDetailInfo(result.data.trip_plan);
                setTripCompleted(true); // Mark trip as completed

                const tripId = uuidv4();
                console.log('Saving trip to database with ID:', tripId)

                if (userDetail?._id) {
                    await SaveTripDetail({
                        tripDetail: result.data.trip_plan,
                        tripId: tripId,
                        uid: userDetail._id
                    })
                    console.log('Trip successfully saved to database!')
                } else {
                    console.error('User ID not found, cannot save trip to database')
                }

                // Add a helpful message after trip completion
                setMessages((prev: Message[]) => [...prev, {
                    role: 'assistant',
                    content: "🎉 Your trip has been created successfully! If you'd like to make any changes to your itinerary, hotels, or activities, just let me know what you'd like to modify and I'll update your trip plan accordingly."
                }])
            } else {
                console.error('No trip_plan found in response:', result.data)
            }
        } catch (error) {
            console.error('Error generating final trip:', error)
        } finally {
            setLoading(false)
            setIsGeneratingTrip(false)
        }
    }

    return (
        <div className='h-[85vh] flex flex-col border shadow rounded-2xl p-5'>
            {messages.length === 0 && (
                <EmptyBoxState onSelectOption={(v: string) => onSend(v)} />
            )}
            <section className='flex-1 overflow-y-auto p-4'>
                {messages.map((msg, index) => (
                    <div key={index} className={`flex mt-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-black'}`}>
                            {msg.content}
                            {RenderGenerativeUi(msg.ui)}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className='flex justify-start mt-2'>
                        <div className='max-w-lg bg-gray-100 text-black px-4 py-2 rounded-lg flex items-center gap-2'>
                            <Loader className='animate-spin h-4 w-4' /> Thinking...
                        </div>
                    </div>
                )}

            </section>

            {/* Input */}
            <section>
                <div className='border rounded-2xl p-4 relative'>
                    <Textarea
                        placeholder='Start typing here...'
                        className='w-full h-28 bg-transparent border-none focus-visible:ring-0 shadow-none resize-none'
                        onChange={(e) => setUserInput(e.target.value)}
                        value={userInput}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())}
                    />
                    <Button size='icon' className='absolute bottom-6 right-6' onClick={() => onSend()} disabled={false}>
                        <Send className='h-4 w-4' />
                    </Button>
                </div>
            </section>
        </div>
    )
}

export default ChatBox
