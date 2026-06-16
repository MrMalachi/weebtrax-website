import json, re

def slugify(title):
    s = title.lower()
    s = re.sub('[\u2018\u2019`\']', '', s)
    s = re.sub(r'[^a-z0-9\s-]', ' ', s)
    s = re.sub(r'\s+', '-', s.strip())
    return re.sub(r'-+', '-', s).strip('-')

def normalize(title):
    if '|' in title:
        title = title.split('|', 1)[1]
    return re.sub(r'\s+', ' ', title.strip().lower())

def fmt_duration(seconds):
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"

def fmt_date(yyyymmdd):
    if not yyyymmdd:
        return None
    return f"{yyyymmdd[:4]}.{yyyymmdd[4:6]}.{yyyymmdd[6:]}"

# Upload dates keyed by YouTube video ID (YYYYMMDD)
DATES = {
    "ji9HUjdbbfs": "20230531", "1ltJN5PCHsw": "20230702", "kfxz4Llikic": "20230808",
    "_Isrjs4DLPE": "20240103", "fWe_Pifvacg": "20240315", "p8Wn-pscT_o": "20240406",
    "DTBPLvzi7p4": "20240508", "LQe9JlO9zoo": "20240617", "xVxLereRVBc": "20240921",
    "7rzBRInrd-g": "20241115", "Kzu7OhNKmgg": "20241201", "zxhd5e8QWps": "20241230",
    "wOhOVvg5r3U": "20250201", "ImZkVLHa7vc": "20250318",
    "Ev5sCVzMspQ": "20201127", "DT2-17RLM9A": "20210305", "W96EDPbkxjI": "20200828",
    "6QEPBdVqTOg": "20201211", "1G56f7ziIQw": "20200717", "gZAOQC6M-Vw": "20210312",
    "eP4kSOyWEI8": "20201218", "D1Czc1M_DAo": "20200904", "0Ha8urdCt6c": "20200814",
    "DgGRQCoUozc": "20200918", "BNQkjPU5lHI": "20210528", "qVDWiSTlEg0": "20210226",
    "IKAtG6bHCMs": "20210129", "hFMOEoDpoTQ": "20200724", "DSxEs-Xs2H0": "20220617",
    "0TZnP-6Q-6Q": "20210319", "VIDVRWQYc_k": "20220219", "2e82RN9sAKs": "20220822",
    "fpyit-cgvxE": "20220130", "Oor-V-eEWLU": "20210417", "p-pLLBGca8A": "20201204",
    "FJT2BXuaT88": "20210409", "gGbhpwAOZUk": "20230708", "fTxG4KqoGm8": "20220610",
    "kV1L6XJalU8": "20200821", "f-0P_A0TK0k": "20210220", "NNdtYCFIL68": "20221029",
    "GqmPdYAxIm0": "20200807", "_fVTpIGZIfY": "20201120", "3gA8fU5Fcaw": "20200731",
    "PC0twDXW6mw": "20210212", "JOHHJ5UeNNQ": "20220604", "d8AqptCFXKw": "20211106",
    "D_RtPmuD5hk": "20240302", "6jpyV4CqEw0": "20230422", "dlA8EXV_9Qc": "20210115",
    "LLeJsPF7-hA": "20240525", "5Vt6Lf-Zo5Y": "20240430", "1Re1CYHR6A0": "20200927",
    "lKO8AE8Lma8": "20210507", "zhFm4mc1k6Q": "20230617", "HpS4py33S3c": "20221210",
    "j3bSodje_bI": "20230613", "i-9NooDHQMg": "20230626", "XbQgyHjEBqY": "20230506",
    "DPzahNNpLcA": "20220924", "uKsgbOV9hQY": "20211113", "UanA5kHIMNI": "20230528",
    "xi0Nr-plL78": "20221016", "Nsq8xu1x1LQ": "20220830", "5fJ_uZY0SBo": "20230513",
    "1BuuAZeLtno": "20200515", "g7CcHOrSkQY": "20221004", "AegqPllWwM4": "20230120",
    "z2YcXPU9bQE": "20230524", "gg0D64ziBIA": "20250111", "DeNplFluftk": "20260404",
    "z6Omt_0lv68": "20220529", "FkmrrqCjABo": "20211211", "18TFZ_VI2Us": "20220815",
    "KLwFKmDaijQ": "20230605", "VitreIs46f0": "20211224", "yFkJk4ytKOI": "20250823",
    "yvWPp8UrmB8": "20250308", "V-w3xfq19HY": "20250119", "ln_7W93hQUI": "20250125",
    "sL3cNkE5gZQ": "20241214", "N6cqvnPYtcQ": "20240105", "P09t3D7sdQY": "20240817",
    "cAiXN3eLvK0": "20240831", "UgCTBRPnPZY": "20241221", "kQyCZASKCc0": "20250329",
    "QeORW0r_7jg": "20250218", "zaMpe_r965E": "20251108", "zi5SaXnu7qU": "20241123",
    "gk2V4Iwi02U": "20240622", "2JYacVX8XNQ": "20250121", "1lAmvchYbDk": "20241207",
    "b4emPgjo7lo": None,  # blocked on copyright — date unavailable
    "Oo4d67fRz_Q": None,  # blocked on copyright — date unavailable
}

# YouTube data: (yt_id, title, duration_seconds)
YT = [
    # Essentials playlist
    ("ji9HUjdbbfs", "Lo-Fi House Essentials | Summer 2023 Trax", 8365),
    ("1ltJN5PCHsw", "Lo-Fi House Essentials | Late Night Trax", 8550),
    ("kfxz4Llikic", "Jungle/DnB Essentials | PlayStation DnB Trax", 6847),
    ("_Isrjs4DLPE", "Lo-Fi House Essentials | When You're Falling In Love Trax", 8413),
    ("fWe_Pifvacg", "Lo-Fi House Essentials | Outer Space Trax", 7557),
    ("p8Wn-pscT_o", "Lo-Fi Ambient Essentials | Out-of-Body Experience Trax", 7898),
    ("DTBPLvzi7p4", "Lo-Fi House Essentials | Clubbing Withdrawal Symptoms Trax", 7218),
    ("LQe9JlO9zoo", "Lo-Fi House Essentials | DJ'S ONLY Trax", 6797),
    ("xVxLereRVBc", "Lo-Fi House Essentials | End Of Summer 2024 Trax", 7006),
    ("7rzBRInrd-g", "Jungle/DnB Essentials | Video Game Simulation Trax", 5929),
    ("Kzu7OhNKmgg", "Lo-Fi House Essentials | Sounds Like I'm High, Feels Like I'm Floating Trax", 8009),
    ("zxhd5e8QWps", "Lo-Fi House Essentials | Warm Weather, Return To Me Trax", 6503),
    ("wOhOVvg5r3U", "Lo-Fi House Essentials | Secondhand High Comeup Trax", 7409),
    ("ImZkVLHa7vc", "Lo-Fi House Essentials | Interstellar Travel Trax", 6842),
    # Lo-Fi House Mixes playlist
    ("Ev5sCVzMspQ", "Lo-Fi House Music | Clubbing Withdrawal Symptoms Mix", 3112),
    ("DT2-17RLM9A", "Lo-Fi House Music | Heartbreaks & Breakbeat Mix (Batman Beyond)", 2256),
    ("W96EDPbkxjI", "Lo-Fi House Music | Tokyo Midnight Drive Mix (Wicked City)", 2956),
    ("6QEPBdVqTOg", "Lo-Fi House Music | The 80's Were A Vibe Mix", 3127),
    ("1G56f7ziIQw", "Lo-Fi House Music | Summer Sunset Mix", 2782),
    ("gZAOQC6M-Vw", "Lo-Fi House Music | Natural High Mix", 2963),
    ("eP4kSOyWEI8", "Lo-Fi House Music | House Is A Feeling Mix", 3321),
    ("D1Czc1M_DAo", "Lo-Fi House Music | Clipping Mix", 2546),
    ("0Ha8urdCt6c", "Lo-Fi House Music | Final Days Of Summer Mix", 2580),
    ("DgGRQCoUozc", "Lo-Fi House Music | Happy Endings Mix", 2607),
    ("BNQkjPU5lHI", "Lo-Fi House Music | Reminiscing About Love Mix", 2821),
    ("qVDWiSTlEg0", "Lo-Fi House Music | DJ Different Mix (Visions Album)", 3172),
    ("IKAtG6bHCMs", "Lo-Fi House Music | 4 Nighttime Use Only Mix", 3054),
    ("hFMOEoDpoTQ", "Lo-Fi House Music | Summer Nights Mix", 3318),
    ("DSxEs-Xs2H0", "Lo-Fi Breakbeat Music | Shifting Gears Mix (Initial D)", 2561),
    ("0TZnP-6Q-6Q", "Lo-Fi House Music | Tears Of Nostalgic Joy Mix (Cowboy Bebop)", 2897),
    ("VIDVRWQYc_k", "Lo-Fi House Music | Transcendent Mix (Trigun)", 2281),
    ("2e82RN9sAKs", "Lo-Fi House Music | Who Hurt You Mix (Whisper of the Heart)", 2867),
    ("fpyit-cgvxE", "Lo-Fi House Music | Dystopian Future Mix (Ghost in the Shell)", 3090),
    ("Oor-V-eEWLU", "Lo-Fi House Music | A Dream In The Making Mix (Ninja Scroll)", 2554),
    ("p-pLLBGca8A", "Lo-Fi House Music | F*ck An Hour Long Mix", 2397),
    ("FJT2BXuaT88", "Lo-Fi House Music | A Trip You Won't Forget Mix", 2514),
    ("gGbhpwAOZUk", "Lo-Fi House Mix | Unconventional Intermission", 2790),
    ("fTxG4KqoGm8", "Lo-Fi House Music | Zero Gravity Mix (Bubblegum Crisis)", 3085),
    ("kV1L6XJalU8", "Lo-Fi House Music | Back2Back Mix", 2498),
    ("f-0P_A0TK0k", "Lo-Fi House Music | 100 Subscribers Mix (Goku Midnight Eye)", 3048),
    ("NNdtYCFIL68", "Lo-Fi House Music | Cyberpunk Mix", 2407),
    ("GqmPdYAxIm0", "Lo-Fi House Music | Sentimental Sunsets Mix", 3212),
    ("_fVTpIGZIfY", "Lo-Fi House Music | Typhoon, Taifū, 台風 Mix", 3549),
    ("3gA8fU5Fcaw", "Lo-Fi House Music | Against The Grain Mix", 2390),
    ("PC0twDXW6mw", "Lo-Fi House Music | Sad Boy Hours Mix (Ode To E)", 2693),
    ("JOHHJ5UeNNQ", "Lo-Fi House Music | Doomed Romance Mix (Berserk)", 2800),
    ("d8AqptCFXKw", "Lo-Fi House Music | Don't Speak, Just Listen Mix", 3063),
    ("D_RtPmuD5hk", "Lo-Fi House Mix | You Possess A False Body And A Fake Soul. Do You Know Why?", 2844),
    ("6jpyV4CqEw0", "Lo-Fi House Mix | I Love You", 2855),
    ("dlA8EXV_9Qc", "Lo-Fi House Music | House Is A Feeling Mix (Alternative Ending)", 2772),
    ("LLeJsPF7-hA", "Lo-Fi House Mix | Thinking Of You Makes My Heart Skip", 3059),
    ("b4emPgjo7lo", "Lo-Fi House Music | Ghetto Symphony Mix", 2841),
    ("5Vt6Lf-Zo5Y", "Lo-Fi House Mix | Pull Up (To The Club Like Skrt Skrt)", 2069),
    ("1Re1CYHR6A0", "Lo-Fi House Music | Haunting Mix", 2726),
    ("lKO8AE8Lma8", "Lo-Fi House & Breakbeat Music | Golden Era Of OVA Mix (Angel Cop)", 2612),
    ("zhFm4mc1k6Q", "Lo-Fi House Mix | Cliffhanger", 2333),
    ("HpS4py33S3c", "Lo-Fi House Mix | Love Is Contagious", 3039),
    ("j3bSodje_bI", "Lo-Fi House Mix | Untitled", 2973),
    ("i-9NooDHQMg", "Lo-Fi House Mix | Summer Solstice", 2344),
    ("XbQgyHjEBqY", "Lo-Fi House Mix | Otto's Anticlimax Pt. 1", 1956),
    ("DPzahNNpLcA", "Lo-Fi House Music | Faster Than Life Mix", 2054),
    ("uKsgbOV9hQY", "Lo-Fi House Music | A Dream Within A Dream Mix (Bubblegum Crisis)", 1861),
    ("UanA5kHIMNI", "Lo-Fi House Mix | Spacious Void", 2049),
    ("xi0Nr-plL78", "Lo-Fi House Music | Happiness Is Fleeting Mix", 2493),
    ("Nsq8xu1x1LQ", "Lo-Fi House & Breakbeat Music | Lo-Fi Laced Sounds Mix", 2587),
    ("5fJ_uZY0SBo", "Lo-Fi House Mix | Otto's Anticlimax Pt. 2", 1852),
    ("1BuuAZeLtno", "Lo-Fi House Mix | Retrospect", 2718),
    ("g7CcHOrSkQY", "Lo-Fi House Music | Fake The Funk Mix", 2582),
    ("AegqPllWwM4", "Ambient Lo-Fi House Mix | Mesmerizing Soundscapes", 3015),
    ("z2YcXPU9bQE", "Lo-Fi House Mix | A Chill Summer's Day", 2549),
    ("Oo4d67fRz_Q", "Lo-Fi House Mix | Ghetto Symphony Pt. 2", 3405),
    ("gg0D64ziBIA", "Lo-Fi House Mix | After Hours", 3142),
    ("DeNplFluftk", "Lo-Fi House Mix | Cult Member's Kenopsia", 2459),
    ("z6Omt_0lv68", "Lo-Fi House Music | Point of No Return Mix (Broly The Legendary Super Saiyan)", 2775),
    ("FkmrrqCjABo", "Lo-Fi House Music | Stargazing + Breakbeat = Vibey Mix", 2809),
    ("18TFZ_VI2Us", "Lo-Fi House Music | Unfinished Business Mix (Mobile Suit Gundam)", 2183),
    ("KLwFKmDaijQ", "Lo-Fi House Mix | Short But Funky", 1816),
    ("VitreIs46f0", "Lo-Fi House Music | Stargazing + Breakbeat = Vibey Mix (Alternative Ending)", 3017),
    ("yFkJk4ytKOI", "Lo-Fi House Mix | Ethereal Composition", 3653),
    ("yvWPp8UrmB8", "Lo-Fi House Mix | This Is A Journey Into Sound", 3863),
    ("V-w3xfq19HY", "Lo-Fi House Mix | Everything Becomes Clear If You Listen To This First", 1921),
    ("ln_7W93hQUI", "Lo-Fi House Mix | Euphoric Sounds For Your Inner Youth", 2629),
    ("sL3cNkE5gZQ", "Lo-Fi House Mix | Is This What Heaven Sounds Like?", 2535),
    ("N6cqvnPYtcQ", "Lo-Fi Ambient Mix | Nintendo Sound Waves", 2959),
    ("P09t3D7sdQY", "Lo-Fi House & Jungle/DnB Mix | Don't Talk About Me Like I'm A Machine. I'm Not That", 2440),
    ("cAiXN3eLvK0", "Lo-Fi House Mix | Virtual Reality", 2730),
    ("UgCTBRPnPZY", "Lo-Fi House Mix | Will You Miss Me?", 2498),
    ("kQyCZASKCc0", "Lo-Fi House Mix | Break Everything Into DnB", 2853),
    ("QeORW0r_7jg", "Lo-Fi House Mix | Man's Best Friend", 2589),
    ("zaMpe_r965E", "Jungle/DnB Mix | Music Is Meditation", 2781),
    ("zi5SaXnu7qU", "Lo-Fi House Mix | To Obtain, Something Of Equal Value Must Be Lost", 3004),
    ("gk2V4Iwi02U", "House Mix | SWIM (10 Feet Deep)", 2244),
    ("2JYacVX8XNQ", "Lo-Fi House Mix | Everything Else Becomes Clear If You Listen To This Second", 2176),
    ("1lAmvchYbDk", "Lo-Fi House Mix | RIP Toriyama Sensei", 2583),
]

# SoundCloud data: (sc_title, sc_url)
SC = [
    ("Lo-Fi House Essentials | Summer 2023 Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-summer-2023-trax"),
    ("Lo-Fi House Essentials | Late Night Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-late-night-trax"),
    ("Jungle/DnB Essentials | PlayStation DnB Trax", "https://soundcloud.com/weebtrax/jungle-essentials-evocative-playstation-dnb-trax"),
    ("Lo-Fi House Essentials | When You're Falling In Love Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-when-youre-falling-in-love-trax"),
    ("Lo-Fi House Essentials | Outer Space Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-outer-space-trax"),
    ("Lo-Fi Ambient Essentials | Out-of-Body Trax", "https://soundcloud.com/weebtrax/lo-fi-ambient-essentials-out-of-body-trax"),
    ("Lo-Fi House Essentials | Clubbing Withdrawal Symptoms Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-clubbing-withdrawal-symptoms-trax"),
    ("Lo-Fi House Essentials | DJ'S ONLY Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-djs-only-trax"),
    ("Lo-Fi House Essentials | End Of Summer 2024 Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-end-of-summer-2024-trax"),
    ("Jungle/DnB Essentials | Video Game Simulation Trax", "https://soundcloud.com/weebtrax/junglednb-essentials-video-game-simulation-trax"),
    ("Lo-Fi House Essentials | Sounds Like I'm High, Feels Like I'm Floating", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-sounds"),
    ("Lo-Fi House Essentials | Warm Weather, Return To Me Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-warm"),
    ("Lo-Fi House Essentials | Secondhand High Comeup Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials-secondhand-high-comeup-trax"),
    ("Lo-Fi House Essentials | Interstellar Travel Trax", "https://soundcloud.com/weebtrax/lo-fi-house-essentials"),
    ("Lo-Fi House Music | Reminiscing About Love Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-reminiscing-about-love-mix"),
    ("Lo-Fi House Music | Don't Speak, Just Listen Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-dont-speak-just-listen-mix"),
    ("Lo-Fi House Music | A Dream Within A Dream Mix (Bubblegum Crisis)", "https://soundcloud.com/weebtrax/lo-fi-house-music-a-dream-within-a-dream-mix-bubblegum-crisis"),
    ("Lo-Fi House Music | Stargazing + Breakbeat = Vibey Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-stargazing-breakbeat-vibey-mix"),
    ("Lo-Fi House Music | Stargazing + Breakbeat = Vibey Mix (Alternative Ending)", "https://soundcloud.com/weebtrax/lo-fi-house-music-stargazing-breakbeat-vibey-mix-alternative-ending"),
    ("Lo-Fi House Music | Dystopian Future Mix (Ghost in the Shell)", "https://soundcloud.com/weebtrax/lo-fi-house-music-dystopian-future-mix-ghost-in-the-shell"),
    ("Lo-Fi House Music | Transcendent Mix (Trigun)", "https://soundcloud.com/weebtrax/lo-fi-house-music-transcendent-mix-trigun"),
    ("Lo-Fi House Music | Point of No Return Mix (Broly The Legendary Super Saiyan)", "https://soundcloud.com/weebtrax/lo-fi-house-music-point-of-no-return-mix-broly-the-legendary-super-saiyan-1"),
    ("Lo-Fi House Music | Doomed Romance Mix (Berserk)", "https://soundcloud.com/weebtrax/lo-fi-house-music-doomed-romance-mix-berserk"),
    ("Lo-Fi House Music | Zero Gravity Mix (Bubblegum Crisis)", "https://soundcloud.com/weebtrax/lo-fi-house-music-zero-gravity-mix-bubblegum-crisis"),
    ("Lo-Fi Breakbeat Music | Shifting Gears Mix (Initial D)", "https://soundcloud.com/weebtrax/lo-fi-breakbeat-music-shifting-gears-mix-initial-d"),
    ("Lo-Fi House Music | Unfinished Business Mix (Mobile Suit Gundam)", "https://soundcloud.com/weebtrax/lo-fi-breakbeat-music-unfinished-business-mix"),
    ("Lo-Fi House Music | Who Hurt You Mix (Whisper of the Heart)", "https://soundcloud.com/weebtrax/lo-fi-house-music-who-hurt-you-mix-whisper-of-the-heart"),
    ("Lo-Fi House & Breakbeat Music | Lo-Fi Laced Sounds Mix", "https://soundcloud.com/weebtrax/lo-fi-house-breakbeat-music-lo-fi-laced-sounds-mix"),
    ("Lo-Fi House Music | Faster Than Life Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-faster-than-life-mix"),
    ("Lo-Fi House Music | Fake The Funk Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-fake-the-funk-mix"),
    ("Lo-Fi House Music | Happiness Is Fleeting Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-happiness-is-fleeting-mix"),
    ("Lo-Fi House Music | Cyberpunk Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-cyberpunk-mix"),
    ("Lo-Fi House Music | Ghetto Symphony Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-ghetto-symphony-mix"),
    ("Lo-Fi House Music | Love Is Contagious Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-love-is-contagious-mix"),
    ("Lo-Fi House Mix | Mesmerizing Soundscapes", "https://soundcloud.com/weebtrax/lo-fi-house-music-mesmerizing-soundscapes-mix"),
    ("Lo-Fi House Mix | I Love You", "https://soundcloud.com/weebtrax/lo-fi"),
    ("Lo-Fi House Mix | Otto's Anticlimax Pt. 1", "https://soundcloud.com/weebtrax/lo-fi-house-mix-ottos-anticlimax-pt-1"),
    ("Lo-Fi House Mix | Otto's Anticlimax Pt. 2", "https://soundcloud.com/weebtrax/lo-fi-house-mix-ottos-anticlimax-pt-2"),
    ("Lo-Fi House Mix | A Chill Summer's Day", "https://soundcloud.com/weebtrax/lo-fi-house-mix-summer-unwind"),
    ("Lo-Fi House Mix | Spacious Void", "https://soundcloud.com/weebtrax/lo-fi-house-mix-spacious-void"),
    ("Lo-Fi House Mix | Short But Funky", "https://soundcloud.com/weebtrax/lo-fi-house-mix-short-but-funky"),
    ("Lo-Fi House Mix | Untitled", "https://soundcloud.com/weebtrax/lo-fi-house-mix-untitled"),
    ("Lo-Fi House Mix | Cliffhanger", "https://soundcloud.com/weebtrax/lo-fi-house-mix-cliffhanger"),
    ("Lo-Fi House Mix | Summer Solstice", "https://soundcloud.com/weebtrax/lo-fi-house-mix-summer-solstice"),
    ("Lo-Fi House Mix | Unconventional Intermission", "https://soundcloud.com/weebtrax/lo-fi-house-mix-unconventional-intermission"),
    ("Lo-Fi House Mix | I Am Neither False Nor Fake. I Am Simply Me", "https://soundcloud.com/weebtrax/lo-fi-house-mix-i-am-neither-false-nor-fake-i-am-simply-me"),
    ("Lo-Fi Ambient Mix | Nintendo Sound Waves", "https://soundcloud.com/weebtrax/lo-fi-ambient-mix-nintendo-sound-waves"),
    ("Lo-Fi House Mix | You Possess A False Body And A Fake Soul. Do You Know Why?", "https://soundcloud.com/weebtrax/lo-fi-house-mix-auditory-cortex"),
    ("Lo-Fi House Mix | I Still Don't Know Where To Find Happiness", "https://soundcloud.com/weebtrax/youtube-set-74"),
    ("Lo-Fi House Mix | Eyes Closed Just Swangin'", "https://soundcloud.com/weebtrax/lo-fi-house-mix-eyes-closed-just-swangin"),
    ("Lo-Fi House Mix | Pull Up (To The Club Like Skrt Skrt)", "https://soundcloud.com/weebtrax/lo-fi-house-mix-pull-up-to-the-club-like-skrt-skrt"),
    ("Lo-Fi House Mix | Thinking Of You Makes My Heart Skip", "https://soundcloud.com/weebtrax/lo-fi-house-mix-thinking-of-you-makes-my-heart-skip"),
    ("House Mix | SWIM (10 Feet Deep)", "https://soundcloud.com/weebtrax/house-mix-swim-10-feet-deep"),
    ("Lo-Fi House Mix | Virtual Reality", "https://soundcloud.com/weebtrax/lo-fi-house-mix-virtual-reality"),
    ("Lo-Fi House Mix | Ghetto Symphony Pt. 2", "https://soundcloud.com/weebtrax/lo-fi-house-mix-ghetto-symphony-pt-2"),
    ("Lo-Fi House Mix | To Obtain, Something Of Equal Value Must Be Lost", "https://soundcloud.com/weebtrax/lo-fi-house-mix-to-obtain-something-of-equal-value-must-be-lost"),
    ("Lo-Fi House Mix | RIP Toriyama Sensei", "https://soundcloud.com/weebtrax/lo-fi-house-mix-rip-toriyama-sensei"),
    ("Lo-Fi House Mix | Is This What Heaven Sounds Like?", "https://soundcloud.com/weebtrax/lo-fi-house-mix-is-this-what-heaven-sounds-like"),
    ("Lo-Fi House Mix | Will You Miss Me?", "https://soundcloud.com/weebtrax/lo-fi-house-mix-will-you-miss-me"),
    ("Lo-Fi House Mix | After Hours", "https://soundcloud.com/weebtrax/lo-fi-house-mix-after-hours"),
    ("Lo-Fi House Mix | Everything Becomes Clear If You Listen To This First", "https://soundcloud.com/weebtrax/lo-fi-house-mix-everything-becomes-clear-if-you-listen-to-this-first"),
    ("Lo-Fi House Mix | Everything Else Becomes Clear If You Listen To This Second", "https://soundcloud.com/weebtrax/lo-fi-house-mix-everything-else-becomes-clear-if-you-listen-to-this-second"),
    ("Lo-Fi House Mix | Euphoric Sounds For Your Inner Youth", "https://soundcloud.com/weebtrax/lo-fi-house-mix-euphoric-sounds-for-your-inner-youth"),
    ("Lo-Fi House Mix | Man's Best Friend", "https://soundcloud.com/weebtrax/lo-fi-house-mix-mans-best-friend"),
    ("Lo-Fi House Mix | This Is A Journey Into Sound", "https://soundcloud.com/weebtrax/lo-fi-house-mix-this-is-a-journey-into-sound"),
    ("Lo-Fi House Mix | Ethereal Composition", "https://soundcloud.com/weebtrax/lo-fi-house-mix-ethereal-composition"),
    ("Jungle/DnB Mix | Music Is Meditation", "https://soundcloud.com/weebtrax/junglednb-mix-music-is-meditation"),
    ("Lo-Fi House Mix | Cult Member's Kenopsia", "https://soundcloud.com/weebtrax/lo-fi-house-mix-cult-members"),
    ("Lo-Fi House Music | Retrospect Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-retrospect-mix"),
    ("Lo-Fi House Music | A Trip You Won't Forget Mix", "https://soundcloud.com/weebtrax/lo-fi-house-music-a-trip-you-wont-forget-mix"),
    ("Lo-Fi House Music | A Dream In The Making Mix (Ninja Scroll)", "https://soundcloud.com/weebtrax/lo-fi-house-music-a-dream-in-the-making-mix-ninja-scroll"),
    ("Lo-Fi House & Breakbeat Music | Golden Era Of OVA Mix (Angel Cop)", "https://soundcloud.com/weebtrax/golden-era-of-ova-mix-angel-cop"),
    ("Lo-Fi House Music | Breakups & Breakbeat Mix (Batman Beyond)", "https://soundcloud.com/weebtrax/lo-fi-house-music-breakups-breakbeat-mix-batman-beyond"),
]

# Build SoundCloud lookup by normalized subtitle
sc_by_norm = {}
for sc_title, sc_url in SC:
    key = normalize(sc_title)
    sc_by_norm[key] = sc_url

# Sort YouTube entries chronologically (oldest first); nulls go last
YT_sorted = sorted(YT, key=lambda x: DATES.get(x[0]) or "99999999")

mixes = []
unmatched_yt = []
for i, (yt_id, yt_title, duration) in enumerate(YT_sorted, 1):
    norm = normalize(yt_title)
    sc_url = sc_by_norm.get(norm)

    if not sc_url:
        norm2 = re.sub(r'\s+(trax|mix)$', '', norm)
        sc_url = sc_by_norm.get(norm2)

    if not sc_url:
        unmatched_yt.append(yt_title)

    slug = slugify(yt_title)

    mixes.append({
        "id": f"mix-{i:03d}",
        "title": yt_title,
        "slug": slug,
        "artist": "WeebTrax",
        "duration": fmt_duration(duration),
        "releaseDate": fmt_date(DATES.get(yt_id)),
        "mood": None,
        "tags": [],
        "audioPath": f"public/assets/mixes/audio/{slug}.mp3",
        "thumbnailPath": None,
        "youtubeUrl": f"https://www.youtube.com/watch?v={yt_id}",
        "soundcloudUrl": sc_url,
    })

out = "public/assets/metadata/mixes.json"
with open(out, "w") as f:
    json.dump(mixes, f, indent=2, ensure_ascii=False)

print(f"Wrote {len(mixes)} mixes to {out}")
if unmatched_yt:
    print(f"\nNo SoundCloud match for {len(unmatched_yt)} entries:")
    for t in unmatched_yt:
        print(f"  - {t}")
