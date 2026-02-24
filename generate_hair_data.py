import json

old_ids = [
    'default', 'bald_clean', 'bald_stubble', 'buzz_cut', 'buzz_colored', 'fade_retro', 'fade_box', 'fade_high',
    'fade_king', 'fade_chef', 'curls_textured', 'afro_mini', 'afro_70s', 'cornrows_straight', 'cornrows_braids',
    'braids_box', 'dreads_long', 'dreads_tied', 'mullet_80s', 'long_flow', 'slicked_back', 'mohawk_fade',
    'top_knot', 'crew_messy', 'fade_pompadour', 'anchor_man_80s', 'fade_low', 'waves_360', 'dreads_short',
    'afro_taper', 'braids_zigzag', 'slick_side_part', 'mohawk_short', 'caesar_cut', 'buzz_line', 'curly_top_fade',
    'shaggy_top', 'side_swept_fringe', 'surfer_flow', 'ivy_league', 'undercut_slick', 'med_bob', 'med_shag',
    'med_curtain', 'med_wolf', 'med_wavy', 'med_curly', 'med_twist', 'med_braids', 'med_slick', 'med_bedhead',
    'med_bun', 'med_undercut', 'bun_messy', 'bun_low', 'bun_double', 'ponytail_high', 'ponytail_low',
    'pigtails_braided', 'afro_puffs', 'bantu_knots', 'braids_micro', 'locs_long', 'locs_medium', 'pixie_cut',
    'side_shave', 'twist_sponge', 'mohawk_spiky'
]

# 3 sheets, 48 indices each (8x6)
# Total capacity: 144
# Strategy: Map old IDs sequentially to Sheet 0 and part of Sheet 1.
# Then fill the rest with generic "New Style X"

output = []
sheet_idx = 0
sprite_idx = 0

# 1. Map existing IDs
for hid in old_ids:
    output.append({
        'id': hid,
        'name': hid.replace('_', ' ').title(),
        'cost': 0,
        'sheet': sheet_idx,
        'index': sprite_idx
    })
    sprite_idx += 1
    if sprite_idx >= 48:
        sprite_idx = 0
        sheet_idx += 1

# 2. Fill remaining slots
total_slots = 3 * 48
current_count = len(output)

for i in range(current_count, total_slots):
    output.append({
        'id': f'new_style_{i}',
        'name': f'Style {i}',
        'cost': 0,
        'sheet': sheet_idx,
        'index': sprite_idx
    })
    sprite_idx += 1
    if sprite_idx >= 48:
        sprite_idx = 0
        sheet_idx += 1

print("    var HAIRSTYLE_SHEETS = [")
print("        'https://github.com/monmoi9059/Got-range/blob/main/Gemini_Generated_Image_10x8pf10x8pf10x8.png?raw=true',")
print("        'https://github.com/monmoi9059/Got-range/blob/main/Gemini_Generated_Image_3ko8rr3ko8rr3ko8.png?raw=true',")
print("        'https://github.com/monmoi9059/Got-range/blob/main/Gemini_Generated_Image_bok9y1bok9y1bok9.png?raw=true'")
print("    ];")
print("")
print("    var HAIRSTYLES = [")
for i, item in enumerate(output):
    comma = "," if i < len(output) - 1 else ""
    print(f"        {{ id: '{item['id']}', name: '{item['name']}', cost: {item['cost']}, sheet: {item['sheet']}, index: {item['index']} }}{comma}")
print("    ];")
