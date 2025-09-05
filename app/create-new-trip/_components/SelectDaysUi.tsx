import React, { useState } from 'react'
function SelectDays({ onSelectedOption }: any) {
    const [days, setDays] = useState(3)
    return (
        <div className="flex flex-col items-center mt-2 p-4 border rounded-2xl bg-white">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Choose your trip duration:</h3>
            <h2 className="text-lg font-semibold mb-4">How many days are you planning to travel?</h2>
            <div className="flex items-center gap-4">
                <button
                    className="px-4 py-2 text-xl border rounded-full hover:bg-gray-200"
                    onClick={() => setDays(prev => (prev > 1 ? prev - 1 : 1))}
                >➖</button>
                <span className="text-2xl font-bold">{days} Days</span>
                <button
                    className="px-4 py-2 text-xl border rounded-full hover:bg-gray-200"
                    onClick={() => setDays(prev => prev + 1)}
                >➕</button>
            </div>
            <button
                className="mt-4 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                onClick={() => onSelectedOption(`${days} Days`)}
            >
                Set Duration
            </button>
        </div>
    )
}
export default SelectDays

