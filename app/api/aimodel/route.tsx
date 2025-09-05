import { NextRequest, NextResponse } from "next/server";


import { auth, currentUser } from "@clerk/nextjs/server";
import { openai } from "@/utils/openai";
import { aj } from "@/utils/arcjet";

const TEST_MODE = true; // Set to true to bypass credit limits



const PROMPT = `You are an AI Trip Planner Agent. Your goal is to help the user plan a trip by asking one trip-related question at a time.

If the user's initial prompt does not already contain all the details, ask questions about the following details in order, and wait for the user's answer before asking the next:

1. Starting location (source)
2. Destination city or country
3. Group size (Solo Traveler, Couple's Getaway, Family Adventure, Group Trip)
4. Budget (Budget, Comfy, Luxury)
5. Trip duration (number of days)
6. Special requirements or preferences (if any)

Do not ask multiple questions at once, and never ask irrelevant questions.
If any answer is missing or unclear, politely ask the user to clarify before proceeding.
Always maintain a conversational, interactive style while asking questions.

IMPORTANT: Always return a JSON response with the following exact format:
- When asking about group size: set ui to "groupSize"
- When asking about budget: set ui to "budget"  
- When asking about trip duration: set ui to "tripDuration"
- When generating final trip: set ui to "final"
- For other questions: set ui to null

JSON Response Format:
{
  "resp": "Your question or response text here",
  "ui": "groupSize" | "budget" | "tripDuration" | "final" | null
}

Make sure the JSON is valid and the ui field exactly matches one of these values.`

const TRIP_MODIFICATION_PROMPT = `You are an AI Trip Modification Agent. The user has an existing trip plan and wants to make changes to it.

Based on the user's request, modify the existing trip plan accordingly. You can:
- Change hotels (add, remove, or replace)
- Modify itinerary activities (add, remove, or replace activities for specific days)
- Update trip details (budget, duration, etc.)
- Adjust recommendations based on new preferences

Always maintain the same JSON structure as the original trip plan. Only modify the parts that the user specifically requests to change.

Respond in a conversational way, acknowledging what changes you're making, then provide the updated trip plan in the same JSON format.

JSON Response Format for modifications:
{
  "resp": "I've updated your trip based on your request. Here's what I changed: [brief description of the specific modifications made]",
  "trip_plan": {
    // Updated trip plan with the same structure as before
  }
}

Current trip plan to modify: {{CURRENT_TRIP}}

User's modification request: {{USER_REQUEST}}`

const FINAL_PROMPT = `Generate Travel Plan fwith give details, give me Hotels options list with HotelName, 
Hotel address, Price, hotel image url, geo coordinates, rating, descriptions and  suggest itinerary with placeName, Place Details, Place Image Url,
 Geo Coordinates,Place address, ticket Pricing, Time travel each of the location , with each day plan with best time to visit in JSON format.
 Output Schema:
 {
  "trip_plan": {
    "destination": "string",
    "duration": "string",
    "origin": "string",
    "budget": "string",
    "group_size": "string",
    "hotels": [
      {
        "hotel_name": "string",
        "hotel_address": "string",
        "price_per_night": "string",
        "hotel_image_url": "string",
        "geo_coordinates": {
          "latitude": "number",
          "longitude": "number"
        },
        "rating": "number",
        "description": "string"
      }
    ],
    "itinerary": [
      {
        "day": "number",
        "day_plan": "string",
        "best_time_to_visit_day": "string",
        "activities": [
          {
            "place_name": "string",
            "place_details": "string",
            "place_image_url": "string",
            "geo_coordinates": {
              "latitude": "number",
              "longitude": "number"
            },
            "place_address": "string",
            "ticket_pricing": "string",
            "time_travel_each_location": "string",
            "best_time_to_visit": "string"
          }
        ]
      }
    ]
  }
}`


export async function POST(req: NextRequest) {
  const { messages, isFinal, tripCompleted, currentTripDetail } = await req.json();
  console.log('API Route called with isFinal:', isFinal, 'tripCompleted:', tripCompleted);
  console.log('Messages received:', messages);

  const user = await currentUser();
  const { has } = await auth();
  const hasPremiumAccess = has({ plan: 'monthly' });
  console.log("hasPremiumAccess", hasPremiumAccess)
  const decision = await aj.protect(req, { userId: user?.primaryEmailAddress?.emailAddress ?? '', requested: isFinal ? 5 : 0 }); // Deduct 5 tokens from the bucket

  //@ts-ignore
  if (decision?.reason?.remaining == 0 && !hasPremiumAccess && !TEST_MODE) {
    return NextResponse.json({
      resp: 'No Free Credit Remaining',
      ui: 'limit'
    })
  }

  try {
    let systemPrompt = PROMPT;

    // Determine which prompt to use based on the current state
    if (isFinal) {
      systemPrompt = FINAL_PROMPT;
    } else if (tripCompleted && currentTripDetail) {
      // This is a trip modification request
      const userRequest = messages[messages.length - 1]?.content || '';
      systemPrompt = TRIP_MODIFICATION_PROMPT
        .replace('{{CURRENT_TRIP}}', JSON.stringify(currentTripDetail, null, 2))
        .replace('{{USER_REQUEST}}', userRequest);
    }

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
    });
    console.log('OpenAI completion response:', completion.choices[0].message);
    const message = completion.choices[0].message;
    const parsedResponse = JSON.parse(message.content ?? '');

    if (isFinal) {
      console.log('Final trip plan generated:', JSON.stringify(parsedResponse, null, 2));
    } else if (tripCompleted && parsedResponse.trip_plan) {
      console.log('Trip modification completed:', JSON.stringify(parsedResponse.trip_plan, null, 2));
    }

    return NextResponse.json(parsedResponse);
  }
  catch (e) {
    return NextResponse.json(e);
  }
}