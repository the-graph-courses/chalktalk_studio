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
        title: 'Programming Tutorial',
        icon: <Lightbulb className='text-green-400 h-5 w-5' />
    },
    {
        title: 'Data Science Lesson',
        icon: <Presentation className='text-blue-400 h-5 w-5' />
    },
    {
        title: 'Software Training',
        icon: <Zap className='text-purple-400 h-5 w-5' />
    },
    {
        title: 'Course Module',
        icon: <Presentation className='text-pink-400 h-5 w-5' />
    }
]

const DotGrid = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="dot-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" className="fill-foreground/30" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>
    </div>
)

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
        <div className='mt-24 w-full flex justify-center p-2 relative'>
            <DotGrid />
            <div className='max-w-3xl w-full flex flex-col gap-4 space-y-1 justify-center items-center relative z-10 text-center'>
                {/* Content */}
                <h1 className='text-3xl md:text-6xl font-bold tracking-tight'>Create video tutorials with <span className='text-primary'>ChalkTalk</span></h1>
                <p className='text-lg md:text-xl text-muted-foreground'>Transform written content into narrated video lessons. AI generates slides and speech, you focus on teaching.</p>

                {/* Input Box */}
                <div className='border rounded-2xl p-4 w-full max-w-2xl relative bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40'>
                    <Textarea placeholder='Create a three-slide tutorial on using the base pipe in R programming' className='w-full h-28 bg-transparent border-none focus-visible:ring-0 pr-12' />
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
