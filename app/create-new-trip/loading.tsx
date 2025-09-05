import { Skeleton } from '@/components/ui/skeleton'

export default function CreateNewTripLoading() {
    // For loading state, we'll show the centered chat layout since we don't know if trip data exists yet
    return (
        <div className='flex justify-center items-start p-10'>
            <div className='w-full max-w-2xl'>
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
            </div>
        </div>
    )
}