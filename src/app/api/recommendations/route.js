import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { occasion, products } = body;

    if (!occasion || !products) {
      return NextResponse.json(
        { error: "Missing occasion or products" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not set in .env.local" },
        { status: 500 }
      );
    }

    const productList = products
      .slice(0, 30)
      .map(
        (p, i) =>
          `${i + 1}. ID:${p.id} | ${p.name} | Culture:${p.culture || "Various"} | Category:${p.category || "N/A"} | Occasions:${(p.occasions || []).join(", ")} | Price:R${p.price} | ${p.description || ""}`
      )
      .join("\n");

    const prompt = `You are a Southern African cultural attire expert for iSiko Studio, a shop selling traditional clothing and jewellery.

A customer says: "${occasion}"

Available products:
${productList}

Pick the 3-4 most appropriate products based on cultural context, the customer's role, and dress codes.

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "recommendations": [
    { "id": "PRODUCT_ID", "reason": "One sentence why this fits" }
  ],
  "summary": "2-3 sentences of cultural guidance for this occasion",
  "dressTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a Southern African cultural attire expert. Always respond with valid JSON only, no markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const rawText = await response.text();
    console.log("[recommendations] Groq status:", response.status);
    console.log("[recommendations] Groq response:", rawText.slice(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `Groq error ${response.status}: ${rawText}` },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: `Could not parse response: ${rawText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const text = data.choices?.[0]?.message?.content || "";

    if (!text) {
      return NextResponse.json(
        { error: "No response from AI. Full: " + JSON.stringify(data).slice(0, 300) },
        { status: 502 }
      );
    }

    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { error: `AI response was not valid JSON: ${clean.slice(0, 200)}` },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[recommendations] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}