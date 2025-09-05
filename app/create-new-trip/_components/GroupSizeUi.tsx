import React from 'react'
export const SelectTravelsList = [
    {
        id: 1,
        title: 'Solo Traveler',
        desc: 'Independent exploration',
        icon: '✈️',
        people: '1 Person'
    },
    {
        id: 2,
        title: 'Couple\'s Getaway',
        desc: 'Romantic and intimate',
        icon: '💕',
        people: '2 People'
    },
    {
        id: 3,
        title: 'Family Adventure',
        desc: 'Fun for all ages',
        icon: '👨‍👩‍👧‍👦',
        people: '3-5 People'
    },
    {
        id: 4,
        title: 'Group Trip',
        desc: 'Social experiences',
        icon: '🎉',
        people: '6-10 People'
    },

]


function GroupSizeUi({ onSelectedOption }: any) {
    return (
        <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Choose your travel group:</h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2 items-center mt-1'>
                {SelectTravelsList.map((item, index) => (
                    <div key={index} className='p-3 border rounded-2xl
                     bg-white hover:border-primary cursor-pointer flex flex-col items-center text-center'
                        onClick={() => onSelectedOption(item.title)}
                    >
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <h2 className="text-sm font-semibold">{item.title}</h2>
                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default GroupSizeUi