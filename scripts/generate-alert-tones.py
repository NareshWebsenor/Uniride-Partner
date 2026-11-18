"""Generate original short PCM previews; run from the repository root."""
import math
from pathlib import Path
import struct
import wave

RATE = 22050
DESTINATION = Path(__file__).resolve().parents[1] / "src/assets/audio/alerts"
# (start seconds, duration seconds, fundamental Hz, overtone weight)
TONES = {
    "classic": [(0, .22, 880, .1), (.3, .22, 880, .1), (.6, .35, 1174.66, .1)],
    "chime": [(0, .65, 659.25, .08), (.3, .8, 880, .08)],
    "bell": [(0, 1.2, 1046.5, .35)],
    "pulse": [(0, .12, 740, 0), (.24, .12, 740, 0), (.48, .12, 740, 0), (.72, .12, 740, 0)],
}
DESTINATION.mkdir(parents=True, exist_ok=True)
for name, notes in TONES.items():
    duration = max(start + length for start, length, _, _ in notes) + .08
    samples = []
    for index in range(int(duration * RATE)):
        time = index / RATE
        value = 0.0
        for start, length, frequency, overtone in notes:
            local = time - start
            if 0 <= local < length:
                attack = min(1, local / .01)
                release = min(1, (length - local) / .04)
                decay = math.exp(-3 * local / length)
                value += attack * release * decay * (
                    math.sin(2 * math.pi * frequency * local)
                    + overtone * math.sin(2 * math.pi * frequency * 2.76 * local)
                )
        samples.append(struct.pack("<h", int(max(-1, min(1, value * .3)) * 32767)))
    with wave.open(str(DESTINATION / f"{name}.wav"), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(b"".join(samples))
