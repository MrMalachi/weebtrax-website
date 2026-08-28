"""Enumeration types used to define valid values for WeebTrax models."""


from enum import Enum


class Mood(str, Enum):
    """Represents mood categories available for WeebTrax mixes & scenes."""
    chill = "chill"
    nostalgic = "nostalgic"
    dirty = "dirty"
    deep = "deep"