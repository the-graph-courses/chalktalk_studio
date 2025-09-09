'use client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, ArrowDown } from 'lucide-react'
import React from 'react'
import { Presentation, Lightbulb, Zap } from 'lucide-react'
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'


export const suggestions = [
    {
        title: 'Create Business Presentation',
        icon: <Presentation className='text-blue-400 h-5 w-5' />
    },
    {
        title: 'Educational Content',
        icon: <Lightbulb className='text-green-400 h-5 w-5' />
    },
    {
        title: 'Marketing Pitch Deck',
        icon: <Zap className='text-purple-400 h-5 w-5' />
    },
    {
        title: 'Startup Investor Deck',
        icon: <Presentation className='text-pink-400 h-5 w-5' />
    }
]

function Hero() {

    const user = useUser()

    const router = useRouter()

    const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`

    const onSend = () => {
        if (!user.user) {
            router.push('/sign-in')
            return;
        }
        // Navigate to ChalkTalk Studio 
        const newId = generateId('project')
        router.push(`/editor/${newId}`)
    }

    return (
        <div className='mt-24 w-full flex justify-center p-2'>
            <div className='max-w-3xl w-full flex flex-col gap-4 space-y-1 justify-center items-center'>
                {/* Content */}
                <h1 className='text-xl md:text-5xl font-bold'>Hey, I'm <span className='text-primary'>ChalkTalk</span></h1>
                <p className='text-lg text-muted-foreground'>Transform your ideas into stunning presentations. AI-powered slide creation in seconds.</p>

                {/* Input Box */}
                <div className='border rounded-2xl p-4 w-full max-w-2xl relative'>
                    <Textarea placeholder='Create a business presentation about quarterly results' className='w-full h-28 bg-transparent border-none focus-visible:ring-0 pr-12' />
                    <Button size="icon" className='absolute bottom-6 right-6 cursor-pointer hover:scale-105 transition-transform' onClick={() => onSend()}>
                        <Send className='h-4 w-4' />
                    </Button>
                </div>

                {/* Suggestion List */}
                <div className='flex flex-wrap gap-2 w-full max-w-2xl mt-1 justify-center'>
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className='border rounded-full px-4 py-2 flex items-center gap-2 hover:bg-primary hover:text-primary-foreground cursor-pointer transition-all duration-200 hover:scale-105'>
                            {suggestion.icon}
                            <span className='text-xs font-medium whitespace-nowrap'>{suggestion.title}</span>
                        </div>
                    ))}
                </div>

                <div className='flex items-center gap-2 mt-20'>
                    <h2 className='text-m'> Not sure where to start? <span className='font-bold'>See how it works.</span> </h2>
                    <ArrowDown className='h-4 w-4 text-muted-foreground' />
                </div>

                {/* Video Section  */}
                <HeroVideoDialog
                    className="block dark:hidden"
                    animationStyle="from-center"
                    videoSrc="https://youtu.be/sXRDL-EPtrM"
                    thumbnailSrc="https://mma.prnewswire.com/media/2401528/1_MindtripProduct.jpg?p=facebook"
                    thumbnailAlt="Dummy Video Thumbnail"
                />

            </div>
        </div >
    )
}

export default Hero
