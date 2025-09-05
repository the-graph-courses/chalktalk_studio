import { Skeleton } from '@/components/ui/skeleton'

export default function CreateNewTripLoading() {
    return (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5 p-10'>
            {/* ChatBox Loading Skeleton */}
            <div className='h-[85vh] flex flex-col border shadow rounded-2xl p-5'>
                <div className='flex-1 space-y-4'>
                    <div className='flex justify-center items-center h-full'>
                        <div className='text-center space-y-4'>
                            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </div>

                {/* Input area skeleton */}
                <div className='border rounded-2xl p-4'>
                    <Skeleton className="h-28 w-full" />
                </div>
            </div>

            {/* Itinerary Loading Skeleton */}
            <div className='md:col-span-2 h-[83vh] overflow-hidden'>
                <div className='space-y-6 p-4'>
                    {/* Timeline header */}
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
        </div>
    )
}
