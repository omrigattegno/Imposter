# Imposter — visual design brief ("cute & rounded")

Chosen by the product owner: **cute & rounded** cartoon style, **masked human** characters used as
**player avatars**, **lively** motion with light sound effects (off by default).

## Mood
A cozy game night. Deep night-blue base (tokens.css) with bright candy accents; chunky rounded shapes;
everything looks pressable and friendly. Big type the whole table can read. Hebrew and English, RTL-safe.
The reveal card stays pure black (privacy) and the rest of the UI stays dark so the reveal never flashes.

## Characters (src/avatars)
Twelve original masked people, ids in `AVATAR_IDS` (bean, bolt, bubble, cloud, dot, echo, fig, glow,
hoop, ivy, jet, kiwi). Each has a signature mask colour (`AVATARS[id].color`). Shared anatomy so they
read as one cast: round or softly-squared head on a stubby body/shoulders, big round eyes with white
highlights seen through a domino (eye) mask, small nose dot, mouth, rosy cheeks, thick `--ink` outlines
(5-6 units in a 120x120 viewBox), flat fills, one soft shadow under the head. Variety comes from skin
tone (6 tones), hair (curls, bun, bob, braids, mohawk, waves, short, long), headwear (beanie, cap, flower,
headband, headphones, bandana) and a small accessory (earring, freckles, glasses on the mask, scarf).
Nothing copied from any existing franchise; no two characters share hair + headwear.

Moods (eyes/brows/mouth only): idle (occasional blink), happy, shocked, sneaky, sad, think.
Animations (CSS, respect prefers-reduced-motion): bob, wiggle, jump, shake. `unmasked` plays the
mask-off: the mask tilts and slides down off the face (≈600 ms, --ease-bounce), leaving a "caught" face.

## UI language
- Buttons: pill or 20-28px radius, bold label, a 6px darker bottom edge (`--shadow-pop`) that presses in
  (`transform: translateY(3px)` + shorter edge on :active). Primary = accent yellow, danger = pink-red.
- Cards: `--bg-elev`, 28px radius, 1px `--line` border, soft shadow.
- Chips (players, categories): pill, avatar on the player chips.
- Headings: bold, slightly tighter letter-spacing; big numbers (timer, countdown) tabular.
- Motion: screens slide/fade (≤250 ms); the reveal card scales from 0.96 with a glow; the pass-to
  avatar bobs; the countdown ring pulses; Results opens with a short drumroll stagger, confetti on a table
  win, a slow sad wobble on an Imposter win, and the Imposter's avatar unmasks.
- Sound (src/lib/sfx.ts): tiny synthesized cues, only when settings.sounds is on.
