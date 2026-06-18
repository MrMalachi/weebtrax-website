#!/usr/bin/env python3
"""
Classify the mood of a new WeebTrax mix based on keyword rules derived from existing mixes.

Usage:
    python3 tools/classify_mood.py "Mix Title"
"""

import sys

RULES = {
    "dirty": [
        "breakbeat", "dnb", "jungle", "drum and bass", "drum & bass",
        "clipping", "back2back", "pull up", "skrt", "machine", "playstation",
        "video game simulation", "batman", "angel cop", "initial d",
        "lo-fi laced", "f*ck", "break everything",
    ],
    "nostalgic": [
        "retrospect", "sentimental", "sad boy", "tears", "nostalgic", "reminiscing",
        "doomed romance", "who hurt you", "i love you", "falling in love",
        "rip ", "will you miss me", "man's best friend", "kenopsia",
        "heart", "romance", "berserk", "whisper of the heart",
    ],
    "chill": [
        "summer", "ambient", "chill", "warm weather", "nintendo", "out-of-body",
        "mesmerizing", "soundscapes", "short but funky", "solstice", "swim",
        "against the grain", "end of summer",
    ],
    "deep": [
        "midnight", "nighttime", "late night", "after hours", "haunting",
        "dystopian", "cyberpunk", "ghost in the shell", "tokyo", "typhoon",
        "outer space", "interstellar", "zero gravity", "virtual reality",
        "spacious void", "journey into sound", "ethereal", "transcendent",
        "existential", "false body", "fake soul", "equal value must be lost",
        "heaven", "euphoric", "secondhand high", "natural high", "trippy",
        "immersive", "clubbing withdrawal", "dj's only", "untitled",
        "unconventional", "anticlimax", "cliffhanger", "happiness is fleeting",
        "wicked city", "ninja scroll", "bubblegum crisis", "gundam", "trigun",
        "ghost", "goku", "broly", "visions", "fake the funk", "faster than life",
        "happy endings", "the 80's", "house is a feeling", "don't speak",
        "ghetto symphony", "sounds like i'm high", "everything becomes clear",
        "everything else becomes clear", "stargazing", "vibey", "a trip you won",
        "love is contagious", "a trip you won't forget",
    ],
}

def classify(title: str) -> tuple[str, str]:
    lowered = title.lower()

    scores = {mood: 0 for mood in RULES}
    matched = {mood: [] for mood in RULES}

    for mood, keywords in RULES.items():
        for kw in keywords:
            if kw in lowered:
                scores[mood] += 1
                matched[mood].append(kw)

    best_mood = max(scores, key=lambda m: scores[m])

    if scores[best_mood] == 0:
        return "unknown", "no keywords matched"

    return best_mood, ", ".join(matched[best_mood])


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 tools/classify_mood.py \"Mix Title\"")
        sys.exit(1)

    title = " ".join(sys.argv[1:])
    mood, keywords = classify(title)
    print(f"Mood:     {mood}")
    print(f"Matched:  {keywords}")
