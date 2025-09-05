import React from 'react'

export const SelectBudgetOptions = [
    {
        id: 1,
        title: 'Budget',
        desc: 'Value driven choices',
        icon: '🎒',
        color: 'bg-green-100 text-green-600'
    },
    {
        id: 2,
        title: 'Comfy',
        desc: 'Balanced, with good amenities',
        icon: '🏨',
        color: 'bg-blue-100 text-blue-600'
    },
    {
        id: 3,
        title: 'Luxury',
        desc: 'Premium experiences',
        icon: '✨',
        color: 'bg-purple-100 text-purple-600'
    },

]


function BudgetUi({ onSelectedOption }: any) {
    return (
        <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Choose your budget preference:</h3>
            <div className='grid grid-cols-3 md:grid-cols-3 gap-2 items-center mt-1'>
                {SelectBudgetOptions.map((item, index) => (
                    <div key={index} className='p-3 border rounded-2xl
                             bg-white hover:border-primary cursor-pointer flex flex-col items-center text-center'
                        onClick={() => onSelectedOption(item.title)}
                    >
                        <div className={`text-3xl p-3 rounded-full ${item.color}`}>{item.icon}</div>
                        <h2 className='text-lg font-semibold mt-2'>{item.title}</h2>
                        <p className='text-sm text-gray-500'>{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default BudgetUi