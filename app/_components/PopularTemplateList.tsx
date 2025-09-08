"use client";

import React from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

export function PopularTemplateList() {
    const cards = data.map((card, index) => (
        <Card key={card.src} card={card} index={index} />
    ));

    return (
        <div className="w-full h-full py-20">
            <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
                Popular Presentation Templates
            </h2>
            <Carousel items={cards} />
        </div>
    );
}

const DummyContent = () => {
    return (
        <>
            {[...new Array(3).fill(1)].map((_, index) => {
                return (
                    <div
                        key={"dummy-content" + index}
                        className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
                    >
                        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
                            <span className="font-bold text-neutral-700 dark:text-neutral-200">
                                Create stunning presentations with AI-powered ChalkTalk.
                            </span>{" "}
                            Transform your ideas into professional slides in seconds.
                            Perfect for business presentations, educational content, and
                            creative storytelling.
                        </p>
                        <img
                            src="https://assets.aceternity.com/macbook.png"
                            alt="Macbook mockup from Aceternity UI"
                            height="500"
                            width="500"
                            className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
                        />
                    </div>
                );
            })}
        </>
    );
};

const data = [
    {
        category: "Business",
        title: "Professional Business Presentations – Reports, Pitches & Proposals",
        src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2600&auto=format&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Education",
        title: "Educational Content – Lectures, Tutorials & Training Materials",
        src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1170&auto=format&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Marketing",
        title: "Marketing Presentations – Product Launches, Campaign Reviews",
        src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=735&auto=format&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Creative",
        title: "Creative Storytelling – Portfolio, Creative Brief & Concepts",
        src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1170&auto=format&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Technical",
        title: "Technical Documentation – Architecture, APIs & System Design",
        src: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=687&auto=format&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Startup",
        title: "Startup Pitches – Investor Decks, Product Demos & Roadmaps",
        src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1171&auto=format&fit=crop",
        content: <DummyContent />,
    },
];
