"use client"
import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useTripDetail, useUserDetail } from '@/app/provider'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

export default function TripsPage() {
  const router = useRouter()
  const { userDetail } = useUserDetail()
  const { setTripDetailInfo } = useTripDetail() || { setTripDetailInfo: () => { } }

  const trips = useQuery(
    api.tripDetail.GetTripsByUser,
    userDetail?._id ? { uid: userDetail._id } : "skip"
  )

  const onView = (trip: any) => {
    setTripDetailInfo(trip.tripDetail)
    router.push('/create-new-trip')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Trips</h1>

      {!userDetail && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
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
      )}

      {userDetail && trips === undefined && (
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
      )}

      {userDetail && trips && trips.length === 0 && (
        <p className="text-muted-foreground">No trips yet. Create your first one from the sidebar.</p>
      )}

      {userDetail && trips && trips.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((t: any) => {
            const info = t.tripDetail || {}
            return (
              <li key={t._id} className="border rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">{info.destination || 'Trip'}</div>
                    <div className="text-sm text-muted-foreground">
                      {info.origin ? `${info.origin} → ` : ''}{info.destination || ''}
                    </div>
                  </div>
                  <button
                    onClick={() => onView(t)}
                    className="px-3 py-1.5 rounded-md bg-primary text-white text-sm"
                  >
                    View
                  </button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {info.duration || '—'} · {info.group_size || '—'} · {info.budget || '—'}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Created {formatDistanceToNow(new Date(t._creationTime), { addSuffix: true })}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

