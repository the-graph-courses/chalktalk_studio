"use client"
import React from 'react'
import { Users, Pencil, Square, Type, Layers, Zap } from 'lucide-react'

const features = [
    {
        icon: Zap,
        title: "AI Slide Generation",
        description: "Create slides from text prompts using advanced language models.",
    },
    {
        icon: Pencil,
        title: "Visual Editor",
        description: "Edit slides directly with an intuitive drag-and-drop interface.",
    },
    {
        icon: Type,
        title: "Chat Assistant",
        description: "Get help creating and refining slides through AI conversation.",
    },
    {
        icon: Layers,
        title: "Slide Management",
        description: "Organize, duplicate, and rearrange slides within your deck.",
    },
    {
        icon: Square,
        title: "Real-time Preview",
        description: "See thumbnail previews of all slides as you work.",
    },
    {
        icon: Users,
        title: "Deck Storage",
        description: "Save and manage multiple presentation projects in the cloud.",
    },
] as const

export default function FeatureGrid() {
    return (
        <section className="py-20">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for modern presentations</h2>
                    <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Generate slides from ideas, then refine with visual editing tools. No design experience needed.</p>
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
