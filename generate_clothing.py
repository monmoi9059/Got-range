import json
import re

# Mocking the SKINS_DB from js/data.js manually or parsing it is hard in one go.
# I will define a subset based on what I read.

SKINS_DB_RAW = """
        { id: 'human_wall', animal: 'human', name: 'Speedy', shortsPattern: 'wizards', jerseyName: 'SPEEDY', cost: 5000, heightScale: 1.085, widthScale: 0.9, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#002B5C', trimColor: '#E31837', number: '2', numberColor: '#E31837', skinTone: '#5c3a21', hairStyle: 'fade', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', sleeveRight: '#E31837', beard: true },
        { id: 'human_wall_alt', animal: 'human', name: 'Capital Red', jerseyName: 'D.C.', cost: 5000, heightScale: 1.085, widthScale: 0.9, jerseyColor: '#E31837', shortsColor: '#E31837', sideStripesColor: '#FFF', trimColor: '#002B5C', number: '2', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'cornrows', hairColor: '#000', socksColor: '#FFF', shoesColor: '#002B5C', beard: true },
        { id: 'human_wall_rookie', animal: 'human', name: 'Rookie Wall', jerseyName: 'ROOKIE', cost: 10000, heightScale: 1.085, widthScale: 0.9, jerseyColor: '#002B5C', shortsColor: '#002B5C', trimColor: '#C4A006', number: '2', numberColor: '#C4A006', skinTone: '#5c3a21', hairStyle: 'fade', hairColor: '#000', socksColor: '#FFF', shoesColor: '#C4A006', sleeveRight: '#FFF' },
        { id: 'human_lebron', animal: 'human', name: 'The King', jerseyName: 'THE KING', cost: 25000, heightScale: 1.170, widthScale: 1.0, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '23', numberColor: '#552583', skinTone: '#4a3020', hairStyle: 'short', headAccessory: 'headband', hairColor: '#000', headbandColor: '#552583', hatColor: '#552583', hairStyle2: 'bald', headbandColor2: null, sleeveRight: '#FDB927', socksColor: '#FFF', shoesColor: '#552583', tattoos: true, beard: true },
        { id: 'human_lebron_alt', animal: 'human', name: 'Heatles', jerseyName: 'KING', cost: 25000, heightScale: 1.170, widthScale: 1.0, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#E31837', number: '6', numberColor: '#FFF', skinTone: '#4a3020', hairStyle: 'short', headAccessory: 'headband', hairColor: '#000', headbandColor: '#E31837', hatColor: '#E31837', hairStyle2: 'bald', headbandColor2: null, sleeveRight: '#000', socksColor: '#000', shoesColor: '#E31837', tattoos: true, beard: true },
        { id: 'human_lebron_cavs', animal: 'human', name: 'Believeland', jerseyName: 'KING', cost: 30000, heightScale: 1.170, widthScale: 1.0, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#6F263D', shortsColor: '#6F263D', trimColor: '#FFB81C', number: '23', numberColor: '#FFB81C', skinTone: '#4a3020', hairStyle: 'short', headAccessory: 'headband', hairColor: '#000', headbandColor: '#FFB81C', hatColor: '#FFB81C', hairStyle2: 'bald', headbandColor2: null, sleeveRight: '#6F263D', socksColor: '#000', shoesColor: '#000', tattoos: true, beard: true },
        { id: 'human_kobe8', animal: 'human', name: 'Frobe', jerseyName: 'FROBE', cost: 30000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '8', numberColor: '#552583', skinTone: '#5c3a21', hairStyle: 'afro', afroSize: 1.1, hairStyle2: 'short_afro', hairColor: '#000', socksColor: '#FFF', shoesColor: '#111', beard: true },
        { id: 'human_kobe8_alt', animal: 'human', name: 'Showtime 8', jerseyName: 'MAMBA', cost: 30000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#552583', shortsColor: '#552583', sideStripesColor: '#FDB927', number: '8', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'afro', afroSize: 1.1, hairStyle2: 'short_afro', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_kobe24', animal: 'human', name: 'Black Mamba', jerseyName: 'MAMBA', cost: 30000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#552583', number: '24', numberColor: '#552583', skinTone: '#5c3a21', hairStyle: 'bald', hairStyle2: 'short', hairColor: '#000', sleeveRight: '#FFF', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_kobe24_alt', animal: 'human', name: 'Mamba Forever', jerseyName: 'EIGHT', cost: 30000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#000', shortsColor: '#000', trimColor: '#FDB927', number: '24', numberColor: '#FDB927', skinTone: '#5c3a21', hairStyle: 'bald', hairStyle2: 'short', hairColor: '#000', sleeveRight: '#000', socksColor: '#000', shoesColor: '#FDB927' },
        { id: 'human_curry', animal: 'human', name: 'Chef Curry', jerseyName: 'CHEF', cost: 30000, heightScale: 1.070, widthScale: 0.85, armWidthScale: 0.9, legWidthScale: 0.9, jerseyColor: '#1D428A', shortsColor: '#1D428A', trimColor: '#FFC72C', number: '30', numberColor: '#FFC72C', skinTone: '#dcb98a', hairStyle: 'short_curly', hairStyle2: 'cornrows', hairColor: '#000', jerseyType: 'tshirt', socksColor: '#FFF', shoesColor: '#FFC72C', beard: true },
        { id: 'human_curry_alt', animal: 'human', name: 'The City', jerseyName: 'CHEF', cost: 30000, heightScale: 1.070, widthScale: 0.85, armWidthScale: 0.9, legWidthScale: 0.9, jerseyColor: '#FDB927', shortsColor: '#FDB927', trimColor: '#1D428A', number: '30', numberColor: '#1D428A', skinTone: '#dcb98a', hairStyle: 'short_curly', hairStyle2: 'cornrows', hairColor: '#000', jerseyType: 'tshirt', socksColor: '#1D428A', shoesColor: '#FDB927', beard: true },
        { id: 'human_magic', animal: 'human', name: 'Magic', jerseyName: 'MAGIC', cost: 30000, heightScale: 1.170, widthScale: 0.95, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '32', numberColor: '#552583', skinTone: '#5c3a21', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF', shortsLength: 'short' },
        { id: 'human_magic_alt', animal: 'human', name: 'Purple Magic', jerseyName: 'MAGIC', cost: 30000, heightScale: 1.170, widthScale: 0.95, jerseyColor: '#552583', shortsColor: '#552583', sideStripesColor: '#FDB927', number: '32', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'short', hairColor: '#000', socksColor: '#FDB927', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_drj', animal: 'human', name: 'The Doctor', jerseyName: 'DOCTOR', cost: 35000, heightScale: 1.140, widthScale: 0.9, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#ED174C', number: '32', numberColor: '#ED174C', skinTone: '#5c3a21', hairStyle: 'afro', afroSize: 1.5, hairColor: '#000', socksColor: '#FFF', shoesColor: '#ED174C', shortsLength: 'short' },
        { id: 'human_drj_alt', animal: 'human', name: 'ABA Star', jerseyName: 'DOCTOR', cost: 35000, heightScale: 1.140, widthScale: 0.9, jerseyColor: '#00285E', shortsColor: '#00285E', trimColor: '#E31837', number: '32', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'afro', afroSize: 1.5, hairColor: '#000', socksColor: '#FFF', shoesColor: '#E31837', shortsLength: 'short' },
        { id: 'human_wilt', animal: 'human', name: 'The Stilt', jerseyName: 'STILT', cost: 40000, heightScale: 1.230, widthScale: 0.95, jerseyColor: '#552583', shortsColor: '#552583', sideStripesColor: '#FDB927', number: '13', numberColor: '#FFF', skinTone: '#4a3020', hairStyle: 'short', headAccessory: 'headband', hairColor: '#000', headbandColor: '#FDB927', hatColor: '#FDB927', socksColor: '#FFF', shoesColor: '#FFF', shortsLength: 'short', beard: true },
        { id: 'human_wilt_alt', animal: 'human', name: 'Philly 100', jerseyName: 'THE STILT', cost: 40000, heightScale: 1.230, widthScale: 0.95, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#000', number: '13', numberColor: '#000', skinTone: '#4a3020', hairStyle: 'bald', hairColor: '#000', headbandColor: '#FFF', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short', beard: true },
        { id: 'human_mj', animal: 'human', name: 'The G.O.A.T.', jerseyName: 'G.O.A.T.', shortsPattern: 'bulls', cost: 50000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#CE1141', shortsColor: '#CE1141', trimColor: '#000', number: '23', numberColor: '#000', skinTone: '#3e271a', hairStyle: 'bald', hairStyle2: 'fade', hairColor: '#000', socksColor: '#FFF', shoesColor: '#CE1141' },
        { id: 'human_mj_alt', animal: 'human', name: 'Black Pinstripe', jerseyName: 'G.O.A.T.', cost: 50000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#000', shortsColor: '#000', pinstripesColor: '#CE1141', number: '23', numberColor: '#CE1141', skinTone: '#3e271a', hairStyle: 'bald', hairStyle2: 'fade', hairColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_mj_wiz', animal: 'human', name: 'D.C. GOAT', jerseyName: 'G.O.A.T.', cost: 40000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#002B5C', shortsColor: '#002B5C', trimColor: '#C4A006', number: '23', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald', hairStyle2: 'fade', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_bird', animal: 'human', name: 'Larry Legend', jerseyName: 'LEGEND', cost: 40000, heightScale: 1.170, widthScale: 0.95, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '33', numberColor: '#FFF', skinTone: '#f0d5be', hairStyle: 'mullet_modern', hairColor: '#e3c179', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_bird_alt', animal: 'human', name: 'Celtics Home', jerseyName: 'LEGEND', cost: 40000, heightScale: 1.170, widthScale: 0.95, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#007A33', number: '33', numberColor: '#007A33', skinTone: '#f0d5be', hairStyle: 'mullet_modern', hairColor: '#e3c179', socksColor: '#007A33', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_shaq', animal: 'human', name: 'Diesel', jerseyName: 'DIESEL', cost: 40000, heightScale: 1.230, widthScale: 1.2, armWidthScale: 1.3, legWidthScale: 1.3, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '34', numberColor: '#552583', skinTone: '#3c2415', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#111' },
        { id: 'human_shaq_alt', animal: 'human', name: 'Big Diesel', jerseyName: 'DIESEL', cost: 40000, heightScale: 1.230, widthScale: 1.2, armWidthScale: 1.3, legWidthScale: 1.3, jerseyColor: '#000', shortsColor: '#000', pinstripesColor: '#FFF', number: '32', numberColor: '#FFF', skinTone: '#3c2415', hairStyle: 'bald', hairColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_shaq_magic', animal: 'human', name: 'Magic Diesel', jerseyName: 'DIESEL', cost: 35000, heightScale: 1.230, widthScale: 1.1, armWidthScale: 1.2, legWidthScale: 1.2, jerseyColor: '#0077C0', shortsColor: '#0077C0', pinstripesColor: '#FFF', number: '32', numberColor: '#FFF', skinTone: '#3c2415', hairStyle: 'bald', hairColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_ai', animal: 'human', name: 'The Answer', jerseyName: 'ANSWER', cost: 35000, heightScale: 1.040, widthScale: 0.8, jerseyColor: '#000', shortsColor: '#000', trimColor: '#ED174C', number: '3', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'cornrows', hairStyle2: 'short_afro', headbandColor2: null, hairColor: '#000', headbandColor: '#FFF', sleeveRight: '#000', socksColor: '#000', shoesColor: '#FFF', tattoos: true, beard: true },
        { id: 'human_ai_alt', animal: 'human', name: 'Powder Blue', jerseyName: 'ANSWER', cost: 35000, heightScale: 1.040, widthScale: 0.8, jerseyColor: '#418FDE', shortsColor: '#418FDE', trimColor: '#FDB927', number: '3', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'cornrows', hairStyle2: 'short_afro', headbandColor2: null, hairColor: '#000', headbandColor: '#FFF', sleeveRight: '#418FDE', socksColor: '#FFF', shoesColor: '#FFF', tattoos: true, beard: true },
        { id: 'human_duncan', animal: 'human', name: 'Big Fundamental', jerseyName: 'FUNDAMENTAL', cost: 35000, heightScale: 1.200, widthScale: 0.95, jerseyColor: '#000', shortsColor: '#000', trimColor: '#C4CED4', number: '21', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#000', shoesColor: '#000' },
        { id: 'human_duncan_alt', animal: 'human', name: 'Silver Spur', jerseyName: 'TIMMY', cost: 35000, heightScale: 1.200, widthScale: 0.95, jerseyColor: '#C4CED4', shortsColor: '#C4CED4', trimColor: '#000', number: '21', numberColor: '#000', skinTone: '#5c3a21', hairStyle: 'short', hairColor: '#000', socksColor: '#000', shoesColor: '#000' },
        { id: 'human_rodman', animal: 'human', name: 'The Worm', jerseyName: 'WORM', shortsPattern: 'bulls', cost: 30000, heightScale: 1.140, widthScale: 0.9, jerseyColor: '#CE1141', shortsColor: '#000', trimColor: '#000', number: '91', numberColor: '#000', skinTone: '#3e271a', hairStyle: 'short_curly', hairColor: '#00FF00', hairColor2: '#FFD700', socksColor: '#FFF', shoesColor: '#FFF', shortsLength: 'short', tattoos: true },
        { id: 'human_rodman_alt', animal: 'human', name: 'Bad Boy', jerseyName: 'WORM', cost: 30000, heightScale: 1.140, widthScale: 0.9, jerseyColor: '#00519E', shortsColor: '#00519E', trimColor: '#E31837', number: '10', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'short', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_barkley', animal: 'human', name: 'Sir Charles', jerseyName: 'SIR CHARLES', cost: 30000, heightScale: 1.130, widthScale: 1.05, jerseyColor: '#1D1160', shortsColor: '#1D1160', sideStripesColor: '#E56020', number: '34', numberColor: '#E56020', skinTone: '#8d5524', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_barkley_alt', animal: 'human', name: 'Philly Sir', jerseyName: 'CHUCK', cost: 30000, heightScale: 1.130, widthScale: 1.05, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#CE1141', number: '34', numberColor: '#CE1141', skinTone: '#8d5524', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#CE1141', shortsLength: 'short' },
        { id: 'human_dirk', animal: 'human', name: 'German Jesus', jerseyName: 'GERMAN', cost: 30000, heightScale: 1.215, widthScale: 0.92, jerseyColor: '#00538C', shortsColor: '#00538C', sideStripesColor: '#B8C4CA', number: '41', numberColor: '#FFF', skinTone: '#f0d5be', hairStyle: 'dirk_shaggy', hairColor: '#dcb98a', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_dirk_alt', animal: 'human', name: 'Retro Mav', jerseyName: 'DIRK', cost: 30000, heightScale: 1.215, widthScale: 0.92, jerseyColor: '#007A33', shortsColor: '#007A33', sideStripesColor: '#00538C', number: '41', numberColor: '#FFF', skinTone: '#f0d5be', hairStyle: 'dirk_shaggy', hairColor: '#dcb98a', socksColor: '#000', shoesColor: '#000' },
        { id: 'human_giannis', animal: 'human', name: 'Greek Freak', jerseyName: 'FREAK', cost: 25000, heightScale: 1.200, widthScale: 0.98, jerseyColor: '#00471B', shortsColor: '#00471B', sideStripesColor: '#EEE1C6', number: '34', numberColor: '#EEE1C6', skinTone: '#4a3020', hairStyle: 'fade', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_giannis_alt', animal: 'human', name: 'Cream City', jerseyName: 'FREAK', cost: 25000, heightScale: 1.200, widthScale: 0.98, jerseyColor: '#EEE1C6', shortsColor: '#EEE1C6', sideStripesColor: '#00471B', number: '34', numberColor: '#00471B', skinTone: '#4a3020', hairStyle: 'fade', hairColor: '#000', socksColor: '#00471B', shoesColor: '#FFF' },
        { id: 'human_joker', animal: 'human', name: 'The Joker', jerseyName: 'JOKER', cost: 25000, heightScale: 1.200, widthScale: 1.1, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#0E2240', shortsColor: '#0E2240', trimColor: '#FEC524', number: '15', numberColor: '#FEC524', skinTone: '#f0d5be', hairStyle: 'crew_cut', hairColor: '#4a3020', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_joker_alt', animal: 'human', name: 'Rainbow', jerseyName: 'JOKER', cost: 25000, heightScale: 1.200, widthScale: 1.1, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#FF0000', number: '15', numberColor: '#FEC524', skinTone: '#f0d5be', hairStyle: 'crew_cut', hairColor: '#4a3020', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_luka', animal: 'human', name: 'Luka Magic', jerseyName: 'MAGIC', cost: 25000, heightScale: 1.140, widthScale: 1.0, jerseyColor: '#00538C', shortsColor: '#00538C', sideStripesColor: '#B8C4CA', number: '77', numberColor: '#FFF', skinTone: '#f0d5be', hairStyle: 'luka_fade', hairColor: '#4a3020', socksColor: '#FFF', shoesColor: '#FFF', beard: true },
        { id: 'human_luka_alt', animal: 'human', name: 'Matador', jerseyName: 'LUKA', cost: 25000, heightScale: 1.140, widthScale: 1.0, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#00C1D4', number: '7', numberColor: '#00C1D4', skinTone: '#f0d5be', hairStyle: 'luka_fade', hairColor: '#4a3020', socksColor: '#FFF', shoesColor: '#00C1D4', beard: true },
        { id: 'human_kd', animal: 'human', name: 'Slim Reaper', jerseyName: 'REAPER', cost: 30000, heightScale: 1.200, widthScale: 0.85, armWidthScale: 0.8, legWidthScale: 0.8, jerseyColor: '#1D1160', shortsColor: '#1D1160', sideStripesColor: '#E56020', number: '35', numberColor: '#E56020', skinTone: '#3e271a', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#FFF', shoesColor: '#1D428A', beard: true },
        { id: 'human_kd_alt', animal: 'human', name: 'SuperSonics', jerseyName: 'SLIM', cost: 30000, heightScale: 1.200, widthScale: 0.85, armWidthScale: 0.8, legWidthScale: 0.8, jerseyColor: '#00653A', shortsColor: '#00653A', sideStripesColor: '#FFC200', number: '35', numberColor: '#FFC200', skinTone: '#3e271a', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFC200', beard: true },
        { id: 'human_harden', animal: 'human', name: 'The Beard', jerseyName: 'BEARD', cost: 25000, heightScale: 1.110, widthScale: 0.95, jerseyColor: '#CE1141', shortsColor: '#CE1141', sideStripesColor: '#FFF', number: '13', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'mohawk', hairStyle2: 'braids_back', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true, beardBig: true, beardColor: '#000' },
        { id: 'human_harden_alt', animal: 'human', name: 'Brooklyn', jerseyName: 'BEARD', cost: 25000, heightScale: 1.110, widthScale: 0.95, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#FFF', number: '13', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'mohawk', hairStyle2: 'braids_back', hairColor: '#000', beard: true, beardBig: true, beardColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_vince', animal: 'human', name: 'Vinsanity', jerseyName: 'VINSANITY', cost: 30000, heightScale: 1.130, widthScale: 0.92, jerseyColor: '#753BBD', shortsColor: '#753BBD', pinstripesColor: '#CE1141', number: '15', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_vince_alt', animal: 'human', name: 'Dino White', jerseyName: 'VINSANITY', cost: 30000, heightScale: 1.130, widthScale: 0.92, jerseyColor: '#FFF', shortsColor: '#FFF', pinstripesColor: '#CE1141', number: '15', numberColor: '#CE1141', skinTone: '#3e271a', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#CE1141', beard: true },
        { id: 'human_kareem', animal: 'human', name: 'Cap', jerseyName: 'CAP', cost: 45000, heightScale: 1.245, widthScale: 0.88, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '33', numberColor: '#552583', skinTone: '#4a3020', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#1D428A', shortsLength: 'short' },
        { id: 'human_kareem_alt', animal: 'human', name: 'Bucks Cap', jerseyName: 'CAP', cost: 45000, heightScale: 1.245, widthScale: 0.88, jerseyColor: '#00471B', shortsColor: '#00471B', sideStripesColor: '#EEE1C6', number: '33', numberColor: '#EEE1C6', skinTone: '#4a3020', hairStyle: 'afro', afroSize: 1.1, hairColor: '#000', socksColor: '#00471B', shoesColor: '#EEE1C6', shortsLength: 'short' },
        { id: 'human_russell', animal: 'human', name: 'Bill', jerseyName: 'BILL', cost: 50000, heightScale: 1.185, widthScale: 0.9, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '6', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'afro', afroSize: 1.0, hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short', beard: true },
        { id: 'human_russell_alt', animal: 'human', name: 'Celtics Away', jerseyName: 'BILL', cost: 50000, heightScale: 1.185, widthScale: 0.9, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '6', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'afro', afroSize: 1.0, hairColor: '#000', socksColor: '#000', shoesColor: '#000', shortsLength: 'short', beard: true },
        { id: 'human_jackie', animal: 'human', name: 'Semi Moon', jerseyName: 'MOON', cost: 500, heightScale: 1.1, widthScale: 1.0, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#FFA500', sideStripesColor: '#00CED1', number: '33', numberColor: '#00CED1', skinTone: '#ffe0bd', hairStyle: 'afro', afroSize: 1.3, hairColor: '#5D4037', headAccessory: 'headband', hatColor: '#FFA500', socksColor: '#FFF', shoesColor: '#FFF', shortsLength: 'short' },
        { id: 'human_pip_alt', animal: 'human', name: 'Pip Black', jerseyName: 'PIP', cost: 30000, heightScale: 1.160, widthScale: 0.9, jerseyColor: '#000', shortsColor: '#000', trimColor: '#CE1141', number: '33', numberColor: '#CE1141', skinTone: '#4a3020', hairStyle: 'flat_top', hairColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_wade', animal: 'human', name: 'Flash', jerseyName: 'FLASH', cost: 30000, heightScale: 1.100, widthScale: 0.92, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#98002E', number: '3', numberColor: '#FFF', skinTone: '#4a3020', hairStyle: 'fade', hairColor: '#000', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_wade_alt', animal: 'human', name: 'Vice City', jerseyName: 'FLASH', cost: 30000, heightScale: 1.100, widthScale: 0.92, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#FF69B4', number: '3', numberColor: '#00FFFF', skinTone: '#4a3020', hairStyle: 'fade', hairColor: '#000', socksColor: '#00FFFF', shoesColor: '#FF69B4', beard: true },
        { id: 'human_reggie', animal: 'human', name: 'Reggie', jerseyName: 'REGGIE', cost: 25000, heightScale: 1.140, widthScale: 0.85, jerseyColor: '#002D62', shortsColor: '#002D62', pinstripesColor: '#FDB927', number: '31', numberColor: '#FDB927', skinTone: '#8d5524', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_reggie_alt', animal: 'human', name: 'Pinstripe', jerseyName: 'REGGIE', cost: 25000, heightScale: 1.140, widthScale: 0.85, jerseyColor: '#FDB927', shortsColor: '#FDB927', pinstripesColor: '#002D62', number: '31', numberColor: '#002D62', skinTone: '#8d5524', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#002D62' },
        { id: 'human_tmac', animal: 'human', name: 'T-Mac', jerseyName: 'T-MAC', cost: 25000, heightScale: 1.160, widthScale: 0.9, jerseyColor: '#007DC5', shortsColor: '#007DC5', pinstripesColor: '#C4CED4', number: '1', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_tmac_alt', animal: 'human', name: 'Houston', jerseyName: 'T-MAC', cost: 25000, heightScale: 1.160, widthScale: 0.9, jerseyColor: '#CE1141', shortsColor: '#CE1141', pinstripesColor: '#FFF', number: '1', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald', hairColor: '#000', socksColor: '#CE1141', shoesColor: '#FFF' },
        { id: 'human_kg', animal: 'human', name: 'Big Ticket', jerseyName: 'TICKET', cost: 30000, heightScale: 1.200, widthScale: 0.88, jerseyColor: '#005083', shortsColor: '#005083', trimColor: '#78BE20', number: '21', numberColor: '#FFF', skinTone: '#2e1e16', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_kg_alt', animal: 'human', name: 'Green Ticket', jerseyName: 'TICKET', cost: 30000, heightScale: 1.200, widthScale: 0.88, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '5', numberColor: '#FFF', skinTone: '#2e1e16', hairStyle: 'bald', hairColor: '#000', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_nash', animal: 'human', name: 'Captain Canada', cost: 35000, heightScale: 1.05, widthScale: 0.88, jerseyColor: '#1D1160', shortsColor: '#1D1160', sideStripesColor: '#E56020', number: '13', numberColor: '#E56020', skinTone: '#f0d5be', hairStyle: 'long', hairColor: '#6B4423', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_nash_alt', animal: 'human', name: 'Dallas', jerseyName: 'STEVE', cost: 35000, heightScale: 1.05, widthScale: 0.88, jerseyColor: '#00538C', shortsColor: '#00538C', sideStripesColor: '#B8C4CA', number: '13', numberColor: '#B8C4CA', skinTone: '#f0d5be', hairStyle: 'long', hairColor: '#6B4423', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_dream', animal: 'human', name: 'The Dream', cost: 40000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#CE1141', shortsColor: '#CE1141', trimColor: '#FDB927', number: '34', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_dream_alt', animal: 'human', name: 'Pinstripe Dream', jerseyName: 'DREAM', cost: 40000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#002D62', shortsColor: '#002D62', trimColor: '#FFF', pinstripesColor: '#FFF', number: '34', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_ewing', animal: 'human', name: 'Big Pat', cost: 35000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#006BB6', shortsColor: '#006BB6', trimColor: '#F58426', number: '33', numberColor: '#F58426', skinTone: '#3e271a', hairStyle: 'flat_top', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_ewing_alt', animal: 'human', name: 'New York White', jerseyName: 'PAT', cost: 35000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#F58426', number: '33', numberColor: '#F58426', skinTone: '#3e271a', hairStyle: 'flat_top', hairColor: '#000', socksColor: '#FFF', shoesColor: '#F58426', shortsLength: 'short' },
        { id: 'human_zeke', animal: 'human', name: 'Zeke', cost: 35000, heightScale: 1.02, widthScale: 0.85, jerseyColor: '#006BB6', shortsColor: '#006BB6', sideStripesColor: '#ED174C', number: '11', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_zeke_alt', animal: 'human', name: 'Bad Boys', jerseyName: 'ZEKE', cost: 35000, heightScale: 1.02, widthScale: 0.85, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#ED174C', number: '11', numberColor: '#ED174C', skinTone: '#5c3a21', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_glide', animal: 'human', name: 'The Glide', cost: 35000, heightScale: 1.15, widthScale: 0.92, jerseyColor: '#CE1141', shortsColor: '#CE1141', trimColor: '#000', number: '22', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_glide_alt', animal: 'human', name: 'Houston Glide', jerseyName: 'GLIDE', cost: 35000, heightScale: 1.15, widthScale: 0.92, jerseyColor: '#002D62', shortsColor: '#002D62', trimColor: '#FFF', number: '22', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'bald', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_truth', animal: 'human', name: 'The Truth', cost: 30000, heightScale: 1.15, widthScale: 1.0, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#000', number: '34', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'headband', hairColor: '#000', headbandColor: '#007A33', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_truth_alt', animal: 'human', name: 'Brooklyn Truth', jerseyName: 'TRUTH', cost: 30000, heightScale: 1.15, widthScale: 1.0, jerseyColor: '#000', shortsColor: '#000', trimColor: '#FFF', number: '34', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'short', hairColor: '#000', headbandColor: '#FFF', socksColor: '#000', shoesColor: '#FFF', beard: true },
        { id: 'human_shuttlesworth', animal: 'human', name: 'Jesus', cost: 30000, heightScale: 1.13, widthScale: 0.9, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '20', numberColor: '#FFF', skinTone: '#8d5524', hairStyle: 'bald', hairColor: '#000', sleeveLeft: '#007A33', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_shuttlesworth_alt', animal: 'human', name: 'Heat Ray', jerseyName: 'JESUS', cost: 30000, heightScale: 1.13, widthScale: 0.9, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#CE1141', number: '34', numberColor: '#CE1141', skinTone: '#8d5524', hairStyle: 'bald', hairColor: '#000', sleeveLeft: '#FFF', socksColor: '#FFF', shoesColor: '#CE1141' },
        { id: 'human_klaw', animal: 'human', name: 'The Klaw', cost: 35000, heightScale: 1.15, widthScale: 1.0, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#C4CED4', number: '2', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'braids_back', hairStyle2: 'afro', hairColor: '#000', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_klaw_alt', animal: 'human', name: 'North', jerseyName: 'KLAW', cost: 35000, heightScale: 1.15, widthScale: 1.0, jerseyColor: '#CE1141', shortsColor: '#CE1141', sideStripesColor: '#000', number: '2', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'braids_back', hairStyle2: 'afro', hairColor: '#000', socksColor: '#CE1141', shoesColor: '#000', beard: true },
        { id: 'human_wemby', animal: 'human', name: 'L\'Alien', cost: 35000, heightScale: 1.30, widthScale: 0.85, armWidthScale: 0.8, legWidthScale: 0.8, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#C4CED4', number: '1', numberColor: '#FFF', skinTone: '#8d5524', hairStyle: 'fade', hairColor: '#000', socksColor: '#000', shoesColor: '#000' },
        { id: 'human_wemby_alt', animal: 'human', name: 'France', jerseyName: 'ALIEN', cost: 35000, heightScale: 1.30, widthScale: 0.85, armWidthScale: 0.8, legWidthScale: 0.8, jerseyColor: '#002654', shortsColor: '#002654', sideStripesColor: '#ED2939', number: '32', numberColor: '#FFF', skinTone: '#8d5524', hairStyle: 'fade', hairColor: '#000', socksColor: '#FFF', shoesColor: '#ED2939' },
        { id: 'human_sga', animal: 'human', name: 'SGA', cost: 30000, heightScale: 1.14, widthScale: 0.9, jerseyColor: '#007AC1', shortsColor: '#007AC1', sideStripesColor: '#EF3B24', number: '2', numberColor: '#EF3B24', skinTone: '#5c3a21', hairStyle: 'cornrows', hairColor: '#000', headbandColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_sga_alt', animal: 'human', name: 'Canada', jerseyName: 'SHAI', cost: 30000, heightScale: 1.14, widthScale: 0.9, jerseyColor: '#CE1126', shortsColor: '#CE1126', sideStripesColor: '#FFF', number: '2', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'cornrows', hairColor: '#000', headbandColor: '#CE1126', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_brow', animal: 'human', name: 'The Brow', cost: 30000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '3', numberColor: '#552583', skinTone: '#5c3a21', hairStyle: 'afro', afroSize: 1.1, hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true, beardBig: true },
        { id: 'human_brow_alt', animal: 'human', name: 'NOLA', jerseyName: 'BROW', cost: 30000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#002B5C', shortsColor: '#002B5C', sideStripesColor: '#B4975A', number: '23', numberColor: '#B4975A', skinTone: '#5c3a21', hairStyle: 'afro', afroSize: 1.1, hairColor: '#000', beard: true, beardBig: true, socksColor: '#FFF', shoesColor: '#002B5C' },
        { id: 'human_brow_wiz', animal: 'human', name: 'The Trade', jerseyName: 'BROW', cost: 30000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#002B5C', shortsColor: '#002B5C', sideStripesColor: '#E31837', number: '23', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'afro', afroSize: 1.1, hairColor: '#000', beard: true, beardBig: true, socksColor: '#FFF', shoesColor: '#E31837' },
        { id: 'human_kyrie', animal: 'human', name: 'Uncle Drew', cost: 30000, heightScale: 1.04, widthScale: 0.9, jerseyColor: '#00538C', shortsColor: '#00538C', sideStripesColor: '#B8C4CA', number: '11', numberColor: '#FFF', skinTone: '#8d5524', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_kyrie_alt', animal: 'human', name: 'The Land', jerseyName: 'UNCLE DREW', cost: 30000, heightScale: 1.04, widthScale: 0.9, jerseyColor: '#6F263D', shortsColor: '#6F263D', sideStripesColor: '#FDB927', number: '2', numberColor: '#FDB927', skinTone: '#8d5524', hairStyle: 'short', hairColor: '#000', beard: true, socksColor: '#6F263D', shoesColor: '#FDB927' },
        { id: 'human_dame', animal: 'human', name: 'Dame Time', cost: 30000, heightScale: 1.04, widthScale: 0.95, jerseyColor: '#000', shortsColor: '#000', pinstripesColor: '#CE1141', number: '0', numberColor: '#CE1141', skinTone: '#5c3a21', hairStyle: 'fade', hairColor: '#000', sleeveLeft: '#000', socksColor: '#000', shoesColor: '#000', tattoos: true, beard: true },
        { id: 'human_dame_alt', animal: 'human', name: 'Rip City', jerseyName: 'DAME', cost: 30000, heightScale: 1.04, widthScale: 0.95, jerseyColor: '#FFF', shortsColor: '#FFF', pinstripesColor: '#CE1141', number: '0', numberColor: '#CE1141', skinTone: '#5c3a21', hairStyle: 'fade', hairColor: '#000', sleeveLeft: '#FFF', socksColor: '#FFF', shoesColor: '#CE1141', tattoos: true, beard: true },
        { id: 'human_tatum', animal: 'human', name: 'Taco Jay', cost: 30000, heightScale: 1.18, widthScale: 0.95, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '0', numberColor: '#FFF', skinTone: '#dcb98a', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF', tattoos: true, beard: true },
        { id: 'human_tatum_alt', animal: 'human', name: 'Duke', jerseyName: 'TACO JAY', cost: 30000, heightScale: 1.18, widthScale: 0.95, jerseyColor: '#003087', shortsColor: '#003087', trimColor: '#FFF', number: '0', numberColor: '#FFF', skinTone: '#dcb98a', hairStyle: 'short', hairColor: '#000', beard: true, socksColor: '#FFF', shoesColor: '#000', tattoos: true },
        { id: 'human_process', animal: 'human', name: 'The Process', cost: 30000, heightScale: 1.25, widthScale: 1.1, jerseyColor: '#006BB6', shortsColor: '#006BB6', trimColor: '#ED174C', number: '21', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'short_curly', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_process_alt', animal: 'human', name: 'Kansas', jerseyName: 'PROCESS', cost: 30000, heightScale: 1.25, widthScale: 1.1, jerseyColor: '#0051BA', shortsColor: '#0051BA', trimColor: '#E8000D', number: '21', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'short', hairColor: '#000', beard: true, socksColor: '#FFF', shoesColor: '#0051BA' }
"""

# Simple JS to Python parser approximation
def parse_js_obj_str(s):
    # This is fragile but works for this specific dataset
    s = s.strip()
    if s.endswith(','): s = s[:-1]

    # Remove JS comments if any (simple)
    s = re.sub(r'//.*', '', s)

    # Extract ID
    id_match = re.search(r"id:\s*'([^']*)'", s)
    if not id_match: return None

    obj = {'id': id_match.group(1)}

    # Extract string props
    for prop in ['name', 'jerseyName', 'jerseyColor', 'shortsColor', 'trimColor', 'sideStripesColor', 'number', 'numberColor', 'pinstripesColor', 'shortsPattern', 'pattern']:
        match = re.search(f"{prop}:\s*'([^']*)'", s)
        if match:
            obj[prop] = match.group(1)

    # Extract cost
    cost_match = re.search(r"cost:\s*(\d+)", s)
    if cost_match:
        obj['cost'] = int(cost_match.group(1))

    return obj

skins = []
for line in SKINS_DB_RAW.split('\n'):
    if line.strip():
        o = parse_js_obj_str(line)
        if o: skins.append(o)

new_clothes = []
new_pants = []

# 1. Legend Gear
for skin in skins:
    # Jersey
    if 'jerseyColor' in skin:
        cid = f"clothing_legend_{skin['id'].replace('human_', '')}"
        name = f"Maillot {skin.get('jerseyName', skin['name'])}"
        cost = int(skin.get('cost', 5000) * 0.4)

        c_obj = {
            'id': cid,
            'name': name,
            'cost': cost,
            'type': 'jersey',
            'color': skin['jerseyColor'],
            'sleeveColor': 'none'
        }
        if 'trimColor' in skin: c_obj['trimColor'] = skin['trimColor']
        if 'sideStripesColor' in skin: c_obj['sideStripesColor'] = skin['sideStripesColor'] # Jerseys can have side stripes too
        if 'number' in skin: c_obj['number'] = skin['number']
        if 'numberColor' in skin: c_obj['numberColor'] = skin['numberColor']
        if 'pinstripesColor' in skin: c_obj['pinstripesColor'] = skin['pinstripesColor']
        if 'pattern' in skin: c_obj['pattern'] = skin['pattern']

        # Avoid duplicate IDs or very similar items if possible?
        # Actually, let's just dump them.
        new_clothes.append(c_obj)

    # Pants
    if 'shortsColor' in skin:
        pid = f"pants_legend_{skin['id'].replace('human_', '')}"
        name = f"Shorts {skin.get('jerseyName', skin['name'])}"
        cost = int(skin.get('cost', 5000) * 0.3)

        p_obj = {
            'id': pid,
            'name': name,
            'cost': cost,
            'type': 'short',
            'color': skin['shortsColor']
        }
        if 'sideStripesColor' in skin: p_obj['sideStripesColor'] = skin['sideStripesColor']
        if 'trimColor' in skin: p_obj['trimColor'] = skin['trimColor']
        if 'pinstripesColor' in skin: p_obj['pinstripesColor'] = skin['pinstripesColor']
        if 'shortsPattern' in skin: p_obj['pattern'] = skin['shortsPattern']

        new_pants.append(p_obj)

# 2. Original Items (30-40)
originals = [
    # CAMO Collection
    {'id': 'hoodie_camo_green', 'name': 'Hoodie Camo Jungle', 'cost': 3500, 'type': 'hoodie', 'color': '#556B2F', 'pattern': 'camo', 'sleeveColor': '#556B2F'},
    {'id': 'hoodie_camo_desert', 'name': 'Hoodie Camo Sable', 'cost': 3500, 'type': 'hoodie', 'color': '#D2B48C', 'pattern': 'camo', 'sleeveColor': '#D2B48C'},
    {'id': 'track_camo_urban', 'name': 'Track Camo Urbain', 'cost': 4000, 'type': 'track', 'color': '#808080', 'pattern': 'camo', 'sleeveColor': '#808080'},
    {'id': 'tank_camo_blue', 'name': 'Tank Camo Marine', 'cost': 2000, 'type': 'tank', 'color': '#000080', 'pattern': 'camo'},

    # GALAXY Collection
    {'id': 'hoodie_galaxy_purple', 'name': 'Hoodie Nebuleuse', 'cost': 5000, 'type': 'hoodie', 'color': '#4B0082', 'pattern': 'galaxy', 'sleeveColor': '#4B0082'},
    {'id': 'sweat_galaxy_black', 'name': 'Sweat Espace', 'cost': 4500, 'type': 'sweatshirt', 'color': '#000', 'pattern': 'galaxy', 'sleeveColor': '#000'},
    {'id': 'jersey_galaxy', 'name': 'Maillot Galactique', 'cost': 6000, 'type': 'jersey', 'color': '#191970', 'pattern': 'galaxy', 'sleeveColor': 'none', 'trimColor': '#FFF'},

    # TIE DYE Collection
    {'id': 'hoodie_tiedye_rainbow', 'name': 'Hoodie Woodstock', 'cost': 4000, 'type': 'hoodie', 'color': '#FFF', 'pattern': 'tie_dye', 'sleeveColor': '#FFF'},
    {'id': 'tank_tiedye_peace', 'name': 'Tank Peace', 'cost': 2500, 'type': 'tank', 'color': '#FFF', 'pattern': 'tie_dye'},
    {'id': 'shirt_tiedye_trippy', 'name': 'Chemise Trippy', 'cost': 3500, 'type': 'shirt', 'color': '#FFF', 'pattern': 'tie_dye'},

    # STRIPES SIDE (Tracksuits)
    {'id': 'track_slav_red', 'name': 'Track Russe Rouge', 'cost': 3000, 'type': 'track', 'color': '#CC0000', 'stripeColor': '#FFF', 'pattern': 'stripes_side', 'sleeveColor': '#CC0000'},
    {'id': 'track_slav_blue', 'name': 'Track Russe Bleu', 'cost': 3000, 'type': 'track', 'color': '#0000CC', 'stripeColor': '#FFF', 'pattern': 'stripes_side', 'sleeveColor': '#0000CC'},
    {'id': 'track_slav_green', 'name': 'Track Russe Vert', 'cost': 3000, 'type': 'track', 'color': '#006400', 'stripeColor': '#FFF', 'pattern': 'stripes_side', 'sleeveColor': '#006400'},
    {'id': 'track_slav_grey', 'name': 'Track Russe Gris', 'cost': 3000, 'type': 'track', 'color': '#808080', 'stripeColor': '#000', 'pattern': 'stripes_side', 'sleeveColor': '#808080'},
    {'id': 'track_slav_gold', 'name': 'Track Russe Or', 'cost': 10000, 'type': 'track', 'color': '#FFD700', 'stripeColor': '#000', 'pattern': 'stripes_side', 'sleeveColor': '#FFD700'},

    # MIAMI VICE
    {'id': 'jersey_vice_city', 'name': 'Maillot Vice', 'cost': 5500, 'type': 'jersey', 'color': '#000', 'pattern': 'gradient_blue_pink', 'sleeveColor': 'none', 'trimColor': '#00FFFF'},
    {'id': 'tank_vice', 'name': 'Tank Vice', 'cost': 3000, 'type': 'tank', 'color': '#FFF', 'pattern': 'gradient_blue_pink'},

    # SOLID COLORS (Missing Basics)
    {'id': 'hoodie_pink', 'name': 'Hoodie Rose', 'cost': 1500, 'type': 'hoodie', 'color': '#FF69B4', 'sleeveColor': '#FF69B4'},
    {'id': 'hoodie_yellow', 'name': 'Hoodie Jaune', 'cost': 1500, 'type': 'hoodie', 'color': '#FFD700', 'sleeveColor': '#FFD700'},
    {'id': 'hoodie_maroon', 'name': 'Hoodie Bordeaux', 'cost': 1500, 'type': 'hoodie', 'color': '#800000', 'sleeveColor': '#800000'},
    {'id': 'sweat_cream', 'name': 'Sweat Creme', 'cost': 1200, 'type': 'sweatshirt', 'color': '#F5F5DC', 'sleeveColor': '#F5F5DC'},
    {'id': 'track_orange', 'name': 'Track Orange', 'cost': 2000, 'type': 'track', 'color': '#FF4500', 'stripeColor': '#FFF', 'sleeveColor': '#FF4500'},

    # PLAID
    {'id': 'shirt_plaid_red', 'name': 'Chemise Rouge', 'cost': 1800, 'type': 'shirt', 'color': '#CC0000', 'pattern': 'plaid'},
    {'id': 'shirt_plaid_blue', 'name': 'Chemise Bleue', 'cost': 1800, 'type': 'shirt', 'color': '#00008B', 'pattern': 'plaid'},
    {'id': 'shirt_plaid_green', 'name': 'Chemise Verte', 'cost': 1800, 'type': 'shirt', 'color': '#006400', 'pattern': 'plaid'},

    # SUITS
    {'id': 'suit_white', 'name': 'Costume Blanc', 'cost': 6000, 'type': 'shirt', 'color': '#FFF', 'pattern': 'suit'},
    {'id': 'suit_red', 'name': 'Costume Rouge', 'cost': 6000, 'type': 'shirt', 'color': '#8B0000', 'pattern': 'suit'},
    {'id': 'suit_blue', 'name': 'Costume Bleu', 'cost': 6000, 'type': 'shirt', 'color': '#00008B', 'pattern': 'suit'}
]

new_clothes.extend(originals)

# Add matching pants for some originals
original_pants = [
    {'id': 'pants_camo_green', 'name': 'Treillis Jungle', 'cost': 1500, 'type': 'long', 'color': '#556B2F', 'pattern': 'camo'},
    {'id': 'pants_camo_desert', 'name': 'Treillis Sable', 'cost': 1500, 'type': 'long', 'color': '#D2B48C', 'pattern': 'camo'},
    {'id': 'pants_track_red', 'name': 'Bas Track Rouge', 'cost': 1500, 'type': 'long', 'color': '#CC0000', 'sideStripesColor': '#FFF'},
    {'id': 'pants_track_green', 'name': 'Bas Track Vert', 'cost': 1500, 'type': 'long', 'color': '#006400', 'sideStripesColor': '#FFF'},
    {'id': 'pants_track_grey', 'name': 'Bas Track Gris', 'cost': 1500, 'type': 'long', 'color': '#808080', 'sideStripesColor': '#000'},
    {'id': 'pants_track_gold', 'name': 'Bas Track Or', 'cost': 5000, 'type': 'long', 'color': '#FFD700', 'sideStripesColor': '#000'},
    {'id': 'pants_galaxy', 'name': 'Leggings Galaxy', 'cost': 2500, 'type': 'tights', 'color': '#4B0082', 'pattern': 'galaxy'},
    {'id': 'pants_tiedye', 'name': 'Shorts Tie-Dye', 'cost': 2000, 'type': 'short', 'color': '#FFF', 'pattern': 'tie_dye'},
    {'id': 'pants_plaid_red', 'name': 'Pantalon Pyjama', 'cost': 1200, 'type': 'long', 'color': '#CC0000', 'pattern': 'plaid'}
]
new_pants.extend(original_pants)

def obj_to_js_string(obj):
    # formats a dict to a JS object string like { id: 'x', ... }
    parts = []
    for k, v in obj.items():
        val_str = ""
        if isinstance(v, str):
            val_str = f"'{v}'"
        else:
            val_str = str(v)
        parts.append(f"{k}: {val_str}")
    return "        { " + ", ".join(parts) + " }"

print("// GENERATED CLOTHING")
for c in new_clothes:
    print(obj_to_js_string(c) + ",")

print("\n// GENERATED PANTS")
for p in new_pants:
    print(obj_to_js_string(p) + ",")
