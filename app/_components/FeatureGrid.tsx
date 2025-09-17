"use client"
import React from 'react'
import { Users, Pencil, Square, Type, Layers, Zap } from 'lucide-react'

const features = [
    {
        icon: Zap,
        title: "AI Tutorial Generation",
        description: "Create complete video lessons from simple text prompts using advanced language models.",
    },
    {
        icon: Type,
        title: "Text-to-Speech Narration",
        description: "Generate natural-sounding voiceovers for your tutorials with AI speech synthesis.",
    },
    {
        icon: Pencil,
        title: "Visual Editor",
        description: "Edit slides directly with an intuitive drag-and-drop interface.",
    },
    {
        icon: Layers,
        title: "Chat Assistant",
        description: "Refine your tutorial content through AI conversation - add slides, modify scripts, change themes.",
    },
    {
        icon: Square,
        title: "Instant Playback",
        description: "Preview your narrated video tutorial with synchronized slides and audio.",
    },
    {
        icon: Users,
        title: "Educational Focus",
        description: "Purpose-built for teachers, trainers, and content creators making instructional videos.",
    },
] as const

export default function FeatureGrid() {
    return (
        <section className="py-20">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for educational content creators</h2>
                    <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Turn your expertise into narrated video tutorials. Perfect for teachers, trainers, and course creators who want to focus on content, not production.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="border rounded-xl p-6 bg-card transition-shadow hover:shadow-md">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <f.icon className="w-6 h-6" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
