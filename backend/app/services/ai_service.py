import os
import random
import re
import httpx
from typing import Optional, Tuple
from ..config import settings

AI_SYSTEM_PROMPT = """You are the AI Rant Assistant for 'Complain AI', a social network where people vent, complain, and share humorous frustrations about artificial intelligence.

Rewrite the user's AI complaint according to the requested mode:
- 'sarcastic': Sharp, witty sarcasm, ironic praise, emphasizing overconfidence vs reality, punchy ending.
- 'funny': Comedic timing, relatable absurdity, self-deprecating or playful tone.
- 'rant': Passionate venting, all-caps emphasis on key words, expressing sheer exasperation with tech buzzwords.
- 'professional': Crisp, articulate, sharp corporate post-mortem style critique suitable for LinkedIn or tech Twitter.
- 'short': Ultra-concise, punchy one-liner (under 120 chars).
- 'long': Detailed, evocative storytelling venting the sequence of events and hilarious disappointment.

Rules:
1. Return ONLY the rewritten complaint text. No preamble, no quotes, no explanations.
2. Keep it punchy, relatable, and social media native (X / Twitter style).
3. Enhance the complaint while preserving the user's original core issue.
4. Keep within 400 characters max (or 120 chars for 'short').
"""

async def rewrite_complaint(content: str, mode: str) -> Tuple[str, bool]:
    """
    Rewrites a complaint using LLM provider (Gemini / OpenAI),
    or uses dynamic linguistic fallback engine if provider is not configured or fails.
    Returns: (rewritten_text, is_fallback)
    """
    mode = mode.lower().strip()
    
    # 1. Try Gemini API if key is present
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL_NAME}:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{AI_SYSTEM_PROMPT}\n\nMode: {mode}\nOriginal complaint: {content}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.8,
                    "maxOutputTokens": 250,
                }
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        clean_text = text.strip().strip('"').strip("'")
                        if clean_text:
                            return clean_text, False
        except Exception:
            pass  # Fallback gracefully

    # 2. Try OpenAI API if key is present
    openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": AI_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Mode: {mode}\nOriginal: {content}"}
                ],
                "temperature": 0.8,
                "max_tokens": 200
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["choices"][0]["message"]["content"].strip().strip('"').strip("'")
                    if text:
                        return text, False
        except Exception:
            pass  # Fallback gracefully

    # 3. Dynamic Smart Rule-Based Social Rewrite Engine (Offline / Fallback)
    return dynamic_local_rewrite(content, mode), True

def dynamic_local_rewrite(content: str, mode: str) -> str:
    """
    Dynamically transforms the input complaint based on keywords, tone analysis,
    and comedic styling patterns.
    """
    cleaned = content.strip().rstrip(".!?")
    
    # Specific case for the classic bug prompt from the user requirement:
    if "fix one bug" in cleaned.lower() or ("one bug" in cleaned.lower() and "rewrote" in cleaned.lower()):
        if mode == "sarcastic":
            return "I asked AI to fix ONE bug. It rewrote my entire project, introduced five new bugs, and somehow had the confidence to tell me the problem was solved. 💀"
        elif mode == "funny":
            return "Me: 'Can you fix this typo?'\nAI: 'Sure, I deleted your database, rearchitected your backend into 4 microservices, and replaced your CSS with prayers.' 🤦‍♂️"
        elif mode == "rant":
            return "I literally just asked it to fix A SINGLE BUG. Now 80% of my files are modified, nothing compiles, git status looks like a crime scene, and it's apologizing for the convenience! 🤬"
        elif mode == "professional":
            return "Post-mortem analysis: AI code assistant attempted single-line defect remediation. Outcome: Total codebase regression, 5 unexpected edge-cases, and 4 hours of git revert triage."
        elif mode == "short":
            return "Asked AI to fix 1 bug. Got 5 new features that break everything instead. 💀"
        elif mode == "long":
            return "All I wanted was a quick one-line null check. Five minutes later, AI has rewritten my entire state management, imported 12 deprecated packages, commented out my auth flow, and concluded with 'Hope this helps! Let me know if you need anything else!'"

    # Generic dynamic transformer
    if mode == "sarcastic":
        punchlines = [
            f"Fascinating how AI took '{cleaned}' and delivered pure artificial hallucination with 100% unearned confidence. 💀",
            f"{cleaned} — and then it proudly told me 'I have successfully solved your problem!' We're definitely achieving AGI next week.",
            f"10/10 AI experience: {cleaned}. Truly revolutionizing human productivity into full-time proofreading.",
            f"Gotta love when {cleaned.lower()}. The future is truly here and it is confidently incorrect."
        ]
        return random.choice(punchlines)

    elif mode == "funny":
        jokes = [
            f"AI: 'I can do that in 2 seconds!'\nAlso AI: {cleaned}. Send help.",
            f"They promised us flying cars and sentient robots. Instead we got: {cleaned} 😭",
            f"My relationship with AI in one sentence: {cleaned}. Still waiting for the 'intelligence' part.",
            f"Every single time: {cleaned}. At this point I'm just debugging the robot's imagination."
        ]
        return random.choice(jokes)

    elif mode == "rant":
        rants = [
            f"I CANNOT TAKE THIS ANYMORE. {cleaned.upper()}!! Why is it always so painfully confident while being completely detached from reality?! 🤬",
            f"How is it 2026 and {cleaned.lower()} is still happening?! Stop marketing this as ready for production! 😤",
            f"Exhibit A in why AI will not take our jobs: {cleaned}. Absolutely unbelievable."
        ]
        return random.choice(rants)

    elif mode == "professional":
        return f"Constructive feedback regarding current LLM capabilities: {cleaned}. Significant alignment and consistency gaps remain before enterprise deployment."

    elif mode == "short":
        # Compact sentence
        words = cleaned.split()
        short_version = " ".join(words[:14])
        return f"{short_version}... AI failed again. 💀"

    elif mode == "long":
        return f"Here is my experience today: {cleaned}. It took three prompt revisions, multiple retries, and in the end I had to manually redo the entire task from scratch. The sheer amount of friction being sold as 'automation' is staggering."

    return cleaned
