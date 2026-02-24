    var HAIR_SPRITE_SHEETS = {
        'sheet1': { url: 'https://github.com/monmoi9059/Got-range/blob/main/Gemini_Generated_Image_10x8pf10x8pf10x8.png?raw=true', cols: 8, rows: 4 },
        'sheet2': { url: 'https://github.com/monmoi9059/Got-range/blob/main/Gemini_Generated_Image_3ko8rr3ko8rr3ko8.png?raw=true', cols: 8, rows: 6 },
        'sheet3': { url: 'https://github.com/monmoi9059/Got-range/blob/main/Gemini_Generated_Image_bok9y1bok9y1bok9.png?raw=true', cols: 8, rows: 4 }
    };

    var HAIRSTYLES = [];

    // Helper to populate
    function addHairs(sheetId, cols, rows, startIdx) {
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                let id = `hair_${sheetId}_${r}_${c}`;
                let name = `Style ${startIdx + (r*cols) + c + 1}`;
                HAIRSTYLES.push({ id: id, name: name, cost: 0, sheet: sheetId, col: c, row: r });
            }
        }
    }

    addHairs('sheet1', 8, 4, 0);
    addHairs('sheet2', 8, 6, 32);
    addHairs('sheet3', 8, 4, 80);

    // Map legacy IDs to these new styles to prevent errors
    var LEGACY_MAP = {
        'default': 0, 'bald_clean': 1, 'bald_stubble': 2, 'buzz_cut': 3, 'buzz_colored': 4,
        'fade_retro': 5, 'fade_box': 6, 'fade_high': 7, 'fade_king': 8, 'fade_chef': 9,
        'curls_textured': 10, 'afro_mini': 11, 'afro_70s': 12, 'cornrows_straight': 13,
        'cornrows_braids': 14, 'braids_box': 15, 'dreads_long': 16, 'dreads_tied': 17,
        'mullet_80s': 18, 'long_flow': 19, 'slicked_back': 20, 'mohawk_fade': 21,
        'top_knot': 22, 'crew_messy': 23, 'fade_pompadour': 24, 'anchor_man_80s': 25,
        'fade_low': 26, 'waves_360': 27, 'dreads_short': 28, 'afro_taper': 29,
        'braids_zigzag': 30, 'slick_side_part': 31, 'mohawk_short': 32, 'caesar_cut': 33,
        'buzz_line': 34, 'curly_top_fade': 35, 'shaggy_top': 36, 'side_swept_fringe': 37,
        'surfer_flow': 38, 'ivy_league': 39, 'undercut_slick': 40, 'med_bob': 41,
        'med_shag': 42, 'med_curtain': 43, 'med_wolf': 44, 'med_wavy': 45,
        'med_curly': 46, 'med_twist': 47, 'med_braids': 48, 'med_slick': 49,
        'med_bedhead': 50, 'med_bun': 51, 'med_undercut': 52, 'bun_messy': 53,
        'bun_low': 54, 'bun_double': 55, 'ponytail_high': 56, 'ponytail_low': 57,
        'pigtails_braided': 58, 'afro_puffs': 59, 'bantu_knots': 60, 'braids_micro': 61,
        'locs_long': 62, 'locs_medium': 63, 'pixie_cut': 64, 'side_shave': 65,
        'twist_sponge': 66, 'mohawk_spiky': 67
    };

    // Apply legacy IDs
    for (let oldId in LEGACY_MAP) {
        let idx = LEGACY_MAP[oldId];
        if (HAIRSTYLES[idx]) {
            HAIRSTYLES[idx].id = oldId; // Override the generated ID
            HAIRSTYLES[idx].name = oldId.replace(/_/g, ' ').toUpperCase();
        }
    }
