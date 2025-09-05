import { Skeleton } from '@/components/ui/skeleton'

export default function TripsLoading() {
    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Your Trips</h1>

            {/* Trip cards loading skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                ))}
            </div>
        </div>
    )
}
