// --- START data.js ---
    var g_viewport = { x: 0, y: 0, w: 1066, h: 600 }; // Default full
    var preJumpTimer = 0;
    var resetTimer = 0;
    var nextAction = null;
    var g_catEatTimer = 0; // Added for Cat Hoop Animation
    // --- 1. DATA & CONSTANTS (DEFINED FIRST) ---
    var ACHIEVEMENTS = [
        { id: 'rookie', name: 'Recrue', desc: 'Premier panier marqué', reward: 100 },
        { id: 'veteran', name: 'Vétéran', desc: 'Marquer 100 paniers au total', reward: 1000 },
        { id: 'ball_hog', name: 'Ball Hog', desc: 'Tirer 500 fois', reward: 500 },
        { id: 'bricklayer', name: 'Briqueur', desc: 'Rater 50 tirs', reward: 250 },
        { id: 'amateur', name: 'Amateur', desc: 'Atteindre 25 pi', reward: 100 },
        { id: 'sniper', name: 'Sniper', desc: 'Atteindre 50 pi', reward: 200 },
        { id: 'pro', name: 'Pro Shooter', desc: 'Atteindre 75 pi', reward: 300 },
        { id: 'parking_lot', name: 'Parking', desc: 'Atteindre 100 pi', reward: 500 },
        { id: 'longshot', name: 'Longue Distance', desc: 'Atteindre 125 pi', reward: 600 },
        { id: 'levis_legend', name: 'Lévis Legend', desc: 'Atteindre 150 pi', reward: 1000 },
        { id: 'interstellar', name: 'Interstellaire', desc: 'Atteindre 200 pi', reward: 1500 },
        { id: 'moonwalker', name: 'Marcheur Lunaire', desc: 'Atteindre 500 pi', reward: 2500 },
        { id: 'demigod', name: 'Demi-Dieu', desc: 'Atteindre 1000 pi', reward: 5000 },
        { id: 'contest_winner', name: 'Roi du Concours', desc: 'Score > 10 au Concours', reward: 1000 },
        { id: 'contest_perfect', name: 'Perfection', desc: 'Score > 20 au Concours', reward: 2500 },
        { id: 'pocket_change', name: 'Fond de poche', desc: 'Avoir 100 Tacos', reward: 50 },
        { id: 'tycoon', name: 'Taco Tycoon', desc: 'Avoir 500 Tacos', reward: 250 },
        { id: 'millionaire', name: 'Millionaire', desc: 'Avoir 50000 Tacos', reward: 5000 },
        { id: 'sweet_tooth', name: 'Bec Sucré', desc: 'Sirop Érable Niv 5', reward: 500 },
        { id: 'hawkeye', name: 'Oeil de Lynx', desc: 'Visée Assistée Niv 5', reward: 500 },
        { id: 'leprechaun', name: 'Chanceux', desc: 'Taco Grease Niv 5', reward: 500 },
        { id: 'moonwalker_pro', name: 'Moonwalker Pro', desc: 'Moonwalk Niv 5', reward: 500 },
        { id: 'fashionista', name: 'Fashionista', desc: 'Débloquer 5 skins', reward: 1000 },
        { id: 'wardrobe_malfunction', name: 'Garde-robe Pleine', desc: 'Débloquer 10 skins', reward: 2500 },
        { id: 'collector', name: 'Collectionneur', desc: 'Débloquer 15 skins', reward: 5000 },
        { id: 'zoo', name: 'Gardien de Zoo', desc: 'Skins pour 3 animaux différents', reward: 1000 },
        { id: 'lucky', name: 'Chance Pure', desc: 'Avoir un rebond chanceux', reward: 100 },
        { id: 'daredevil', name: 'Casse-cou', desc: 'Marquer en difficulté max', reward: 500 },
        { id: 'hard_mode', name: 'Travaillant', desc: 'Marquer en mode Difficile', reward: 250 },
        { id: 'cosplay', name: 'Cosplay', desc: 'Équiper Robot/Alien/Ninja', reward: 250 },
        { id: 'eh', name: 'Canadien', desc: 'Équiper Bûcheron ou Hockey', reward: 250 },
        { id: 'spooky', name: 'Effrayant', desc: 'Équiper Zombie/Vampire/Diable', reward: 250 },
        { id: 'poutine_chef', name: 'Chef Poutine', desc: 'Équiper Poutine', reward: 250 },
        { id: 'urban_legend', name: 'Légende Urbaine', desc: 'Jouer sur le Terrain de Rue', reward: 500 },
        { id: 'ice_cold', name: 'Glace', desc: 'Jouer sur la Patinoire', reward: 1000 },
        { id: 'astronaut_training', name: 'Cadet Spatial', desc: 'Jouer sur la Lune', reward: 2500 },
        // STREAK ACHIEVEMENTS
        { id: 'streak_2', name: 'Le Début', desc: '2 paniers de suite', reward: 25, type: 'streak', threshold: 2 },
        { id: 'streak_3', name: 'Le Hat Trick', desc: '3 paniers de suite', reward: 50, type: 'streak', threshold: 3 },
        { id: 'streak_4', name: 'Le Quatuor', desc: '4 paniers de suite', reward: 75, type: 'streak', threshold: 4 },
        { id: 'streak_5', name: 'En Feu', desc: '5 paniers de suite', reward: 100, type: 'streak', threshold: 5 },
        { id: 'streak_6', name: 'Six-pack', desc: '6 paniers de suite', reward: 125, type: 'streak', threshold: 6 },
        { id: 'streak_7', name: 'Chanceux 7', desc: '7 paniers de suite', reward: 150, type: 'streak', threshold: 7 },
        { id: 'streak_8', name: 'Huitre', desc: '8 paniers de suite', reward: 175, type: 'streak', threshold: 8 },
        { id: 'streak_9', name: 'Le Neuf', desc: '9 paniers de suite', reward: 200, type: 'streak', threshold: 9 },
        { id: 'streak_10', name: 'La Dizaine', desc: '10 paniers de suite', reward: 500, type: 'streak', threshold: 10 },
        { id: 'streak_11', name: 'Onze', desc: '11 paniers de suite', reward: 550, type: 'streak', threshold: 11 },
        { id: 'streak_12', name: 'Douzaine', desc: '12 paniers de suite', reward: 600, type: 'streak', threshold: 12 },
        { id: 'streak_13', name: 'Malchance?', desc: '13 paniers de suite', reward: 650, type: 'streak', threshold: 13 },
        { id: 'streak_14', name: 'Quatorze', desc: '14 paniers de suite', reward: 700, type: 'streak', threshold: 14 },
        { id: 'streak_15', name: 'Quinze', desc: '15 paniers de suite', reward: 750, type: 'streak', threshold: 15 },
        { id: 'streak_16', name: 'Seize', desc: '16 paniers de suite', reward: 800, type: 'streak', threshold: 16 },
        { id: 'streak_17', name: 'Dix-sept', desc: '17 paniers de suite', reward: 850, type: 'streak', threshold: 17 },
        { id: 'streak_18', name: 'Majeur', desc: '18 paniers de suite', reward: 900, type: 'streak', threshold: 18 },
        { id: 'streak_19', name: 'Presque 20', desc: '19 paniers de suite', reward: 950, type: 'streak', threshold: 19 },
        { id: 'streak_20', name: 'Vingtaine', desc: '20 paniers de suite', reward: 1000, type: 'streak', threshold: 20 },
        { id: 'streak_25', name: 'Quart de Siècle', desc: '25 paniers de suite', reward: 1500, type: 'streak', threshold: 25 },
        { id: 'streak_30', name: 'Trente', desc: '30 paniers de suite', reward: 2000, type: 'streak', threshold: 30 },
        { id: 'streak_35', name: 'Trente-Cinq', desc: '35 paniers de suite', reward: 2500, type: 'streak', threshold: 35 },
        { id: 'streak_40', name: 'Quarantaine', desc: '40 paniers de suite', reward: 3000, type: 'streak', threshold: 40 },
        { id: 'streak_45', name: 'Mi-temps', desc: '45 paniers de suite', reward: 3500, type: 'streak', threshold: 45 },
        { id: 'streak_50', name: 'Demi-Centenaire', desc: '50 paniers de suite', reward: 5000, type: 'streak', threshold: 50 },
        { id: 'streak_55', name: 'Vitesse de Croisière', desc: '55 paniers de suite', reward: 5500, type: 'streak', threshold: 55 },
        { id: 'streak_60', name: 'Soixante', desc: '60 paniers de suite', reward: 6000, type: 'streak', threshold: 60 },
        { id: 'streak_65', name: 'L\'Âge d\'Or', desc: '65 paniers de suite', reward: 6500, type: 'streak', threshold: 65 },
        { id: 'streak_70', name: 'Septante', desc: '70 paniers de suite', reward: 7000, type: 'streak', threshold: 70 },
        { id: 'streak_75', name: 'Trois Quarts', desc: '75 paniers de suite', reward: 7500, type: 'streak', threshold: 75 },
        { id: 'streak_80', name: 'Quatre-Vingts', desc: '80 paniers de suite', reward: 8000, type: 'streak', threshold: 80 },
        { id: 'streak_85', name: 'Inarrêtable', desc: '85 paniers de suite', reward: 8500, type: 'streak', threshold: 85 },
        { id: 'streak_90', name: 'L\'Élite', desc: '90 paniers de suite', reward: 9000, type: 'streak', threshold: 90 },
        { id: 'streak_95', name: 'Presque Là', desc: '95 paniers de suite', reward: 9500, type: 'streak', threshold: 95 },
        { id: 'streak_100', name: 'Le Centenaire', desc: '100 paniers de suite !', reward: 25000, type: 'streak', threshold: 100 },
        // DISTANCE ACHIEVEMENTS
        { id: 'dist_250', name: 'La Colline', desc: 'Atteindre 250 pi', reward: 500, type: 'distance', threshold: 250 },
        { id: 'dist_300', name: 'Tour Eiffel (presque)', desc: 'Atteindre 300 pi', reward: 600, type: 'distance', threshold: 300 },
        { id: 'dist_350', name: 'Gratte-ciel', desc: 'Atteindre 350 pi', reward: 700, type: 'distance', threshold: 350 },
        { id: 'dist_400', name: 'Hauteur de la Tour', desc: 'Atteindre 400 pi', reward: 800, type: 'distance', threshold: 400 },
        { id: 'dist_450', name: 'Vue Panoramique', desc: 'Atteindre 450 pi', reward: 900, type: 'distance', threshold: 450 },
        { id: 'dist_600', name: 'Space Needle', desc: 'Atteindre 600 pi', reward: 1200, type: 'distance', threshold: 600 },
        { id: 'dist_700', name: 'Haut Perche', desc: 'Atteindre 700 pi', reward: 1400, type: 'distance', threshold: 700 },
        { id: 'dist_800', name: 'Nuages Bas', desc: 'Atteindre 800 pi', reward: 1600, type: 'distance', threshold: 800 },
        { id: 'dist_900', name: 'Tour Eiffel (Sommet)', desc: 'Atteindre 900 pi', reward: 1800, type: 'distance', threshold: 900 },
        { id: 'dist_1100', name: 'Le Mille +', desc: 'Atteindre 1100 pi', reward: 2000, type: 'distance', threshold: 1100 },
        { id: 'dist_1200', name: 'Empire State', desc: 'Atteindre 1200 pi', reward: 2200, type: 'distance', threshold: 1200 },
        { id: 'dist_1300', name: 'Chicago', desc: 'Atteindre 1300 pi', reward: 2400, type: 'distance', threshold: 1300 },
        { id: 'dist_1400', name: 'CN Tower (Base)', desc: 'Atteindre 1400 pi', reward: 2600, type: 'distance', threshold: 1400 },
        { id: 'dist_1500', name: 'CN Tower (Sommet)', desc: 'Atteindre 1500 pi', reward: 2800, type: 'distance', threshold: 1500 },
        { id: 'dist_1750', name: 'One World Trade', desc: 'Atteindre 1750 pi', reward: 3000, type: 'distance', threshold: 1750 },
        { id: 'dist_2000', name: 'Burj Khalifa (Base)', desc: 'Atteindre 2000 pi', reward: 3500, type: 'distance', threshold: 2000 },
        { id: 'dist_2250', name: 'Burj Khalifa (Demi)', desc: 'Atteindre 2250 pi', reward: 4000, type: 'distance', threshold: 2250 },
        { id: 'dist_2500', name: 'Burj Khalifa (Sommet)', desc: 'Atteindre 2500 pi', reward: 4500, type: 'distance', threshold: 2500 },
        { id: 'dist_2717', name: 'Plus Haut Batiment', desc: 'Atteindre 2717 pi', reward: 5000, type: 'distance', threshold: 2717 },
        { id: 'dist_3000', name: 'Montagne', desc: 'Atteindre 3000 pi', reward: 5500, type: 'distance', threshold: 3000 },
        { id: 'dist_3500', name: 'Kilomètre Vertical', desc: 'Atteindre 3500 pi', reward: 6000, type: 'distance', threshold: 3500 },
        { id: 'dist_4000', name: 'Hélicoptère', desc: 'Atteindre 4000 pi', reward: 6500, type: 'distance', threshold: 4000 },
        { id: 'dist_4500', name: 'Grand Canyon', desc: 'Atteindre 4500 pi', reward: 7000, type: 'distance', threshold: 4500 },
        { id: 'dist_5000', name: 'Un Mille Marin', desc: 'Atteindre 5000 pi', reward: 7500, type: 'distance', threshold: 5000 },
        { id: 'dist_6000', name: 'Denver', desc: 'Atteindre 6000 pi', reward: 8000, type: 'distance', threshold: 6000 },
        { id: 'dist_7000', name: 'Mexico City', desc: 'Atteindre 7000 pi', reward: 8500, type: 'distance', threshold: 7000 },
        { id: 'dist_8000', name: 'Machu Picchu', desc: 'Atteindre 8000 pi', reward: 9000, type: 'distance', threshold: 8000 },
        { id: 'dist_9000', name: 'Quito', desc: 'Atteindre 9000 pi', reward: 9500, type: 'distance', threshold: 9000 },
        { id: 'dist_10000', name: 'Aviation Légère', desc: 'Atteindre 10000 pi', reward: 10000, type: 'distance', threshold: 10000 },
        { id: 'dist_12000', name: 'Mont Fuji', desc: 'Atteindre 12000 pi', reward: 12000, type: 'distance', threshold: 12000 },
        { id: 'dist_14000', name: 'Mont Rainier', desc: 'Atteindre 14000 pi', reward: 14000, type: 'distance', threshold: 14000 },
        { id: 'dist_16000', name: 'Mont Blanc', desc: 'Atteindre 16000 pi', reward: 16000, type: 'distance', threshold: 16000 },
        { id: 'dist_18000', name: 'Camp de Base', desc: 'Atteindre 18000 pi', reward: 18000, type: 'distance', threshold: 18000 },
        { id: 'dist_19000', name: 'Kilimanjaro', desc: 'Atteindre 19000 pi', reward: 19000, type: 'distance', threshold: 19000 },
        { id: 'dist_20000', name: 'Denali', desc: 'Atteindre 20000 pi', reward: 20000, type: 'distance', threshold: 20000 }
    ];

    var DAILY_CHALLENGES = [
        { id: 'makes_50', type: 'makes', desc: 'Marquer 50 Paniers', target: 50, reward: 500 },
        { id: 'makes_100', type: 'makes', desc: 'Marquer 100 Paniers', target: 100, reward: 1200 },
        { id: 'daily_streak_5', type: 'streak', desc: 'Faire une série de 5', target: 5, reward: 300 },
        { id: 'daily_streak_10', type: 'streak', desc: 'Faire une série de 10', target: 10, reward: 1000 },
        { id: 'contest_20', type: 'contest_score', desc: 'Marquer 20 pts (Concours)', target: 20, reward: 600 },
        { id: 'contest_50', type: 'contest_score', desc: 'Marquer 50 pts (Concours)', target: 50, reward: 1500 },
        { id: 'time_30', type: 'time_attack_score', desc: 'Marquer 30 pts (Time Attack)', target: 30, reward: 600 },
        { id: 'time_60', type: 'time_attack_score', desc: 'Marquer 60 pts (Time Attack)', target: 60, reward: 1500 },
        { id: 'distance_500', type: 'distance', desc: 'Parcourir 500 pieds', target: 500, reward: 500 },
        { id: 'play_contest_3', type: 'play_contest', desc: 'Jouer 3 Concours', target: 3, reward: 500 },
        { id: 'play_time_3', type: 'play_time_attack', desc: 'Jouer 3 Time Attack', target: 3, reward: 500 },
        // New Additions for Variety
        { id: 'makes_25', type: 'makes', desc: 'Marquer 25 Paniers', target: 25, reward: 250 },
        { id: 'daily_streak_3', type: 'streak', desc: 'Faire une série de 3', target: 3, reward: 150 },
        { id: 'distance_250', type: 'distance', desc: 'Parcourir 250 pieds', target: 250, reward: 250 },
        { id: 'play_contest_1', type: 'play_contest', desc: 'Jouer 1 Concours', target: 1, reward: 200 },
        { id: 'play_time_1', type: 'play_time_attack', desc: 'Jouer 1 Time Attack', target: 1, reward: 200 }
    ];

    var WEEKLY_CHALLENGES = [
        { id: 'wk_makes_500', type: 'makes', desc: 'Marquer 500 Paniers', target: 500, reward: 5000 },
        { id: 'wk_makes_1000', type: 'makes', desc: 'Marquer 1000 Paniers', target: 1000, reward: 10000 },
        { id: 'wk_streak_20', type: 'streak', desc: 'Série de 20 paniers', target: 20, reward: 5000 },
        { id: 'wk_streak_30', type: 'streak', desc: 'Série de 30 paniers', target: 30, reward: 8000 },
        { id: 'wk_contest_100', type: 'contest_score', desc: 'Score 100 en Concours', target: 100, reward: 5000 },
        { id: 'wk_time_200', type: 'time_attack_score', desc: 'Score 200 en Time Attack', target: 200, reward: 5000 },
        { id: 'wk_dist_5000', type: 'distance', desc: 'Parcourir 5000 pieds', target: 5000, reward: 5000 },
        { id: 'wk_play_cont_50', type: 'play_contest', desc: 'Jouer 50 Concours', target: 50, reward: 5000 },
        { id: 'wk_play_time_50', type: 'play_time_attack', desc: 'Jouer 50 Time Attack', target: 50, reward: 5000 },
        { id: 'wk_swish_50', type: 'swish', desc: 'Marquer 50 Swish', target: 50, reward: 3000 },
        { id: 'wk_lucky_20', type: 'lucky', desc: '20 Paniers Chanceux', target: 20, reward: 4000 },
        { id: 'wk_makes_hard_100', type: 'makes_hard', desc: '100 Paniers (Difficile)', target: 100, reward: 5000 },
        { id: 'wk_makes_legend_50', type: 'makes_legend', desc: '50 Paniers (Lévis Legend)', target: 50, reward: 10000 },
        { id: 'wk_dist_classic_2000', type: 'distance_classic', desc: 'Atteindre 2000 pi (Une partie)', target: 2000, reward: 7500 },
        { id: 'wk_bank_100', type: 'bank_shot', desc: '100 Tirs avec la planche', target: 100, reward: 3000 },
        { id: 'wk_streak10_5', type: 'streak_10_count', desc: 'Faire 5 séries de 10', target: 5, reward: 4000 },
        { id: 'wk_makes_long_50', type: 'makes_long', desc: '50 Paniers > 100 pieds', target: 50, reward: 6000 },
        { id: 'wk_makes_super_20', type: 'makes_super', desc: '20 Paniers > 200 pieds', target: 20, reward: 8000 },
        { id: 'wk_total_cont_500', type: 'total_contest_score', desc: '500 pts Cumulés (Concours)', target: 500, reward: 7000 },
        { id: 'wk_total_time_1000', type: 'total_time_score', desc: '1000 pts Cumulés (Time)', target: 1000, reward: 7000 },
        { id: 'wk_streak15_3', type: 'streak_15_count', desc: 'Faire 3 séries de 15', target: 3, reward: 5000 },
        { id: 'wk_level10_10', type: 'level_10_count', desc: 'Atteindre Niv 10 (10 fois)', target: 10, reward: 5000 },
        { id: 'wk_sur_ligne_250', type: 'sur_la_ligne', desc: '250 Paniers "Sur la ligne"', target: 250, reward: 6000 },
        { id: 'wk_miss_100', type: 'misses', desc: 'Rater 100 tirs', target: 100, reward: 1000 },
        { id: 'wk_makes_animal_300', type: 'makes_animal', desc: '300 Paniers (Skin Animal)', target: 300, reward: 4000 },
        { id: 'wk_makes_human_300', type: 'makes_human', desc: '300 Paniers (Skin Humain)', target: 300, reward: 4000 },
        { id: 'wk_tacos_5000', type: 'earn_tacos', desc: 'Gagner 5000 Tacos', target: 5000, reward: 2500 },
        { id: 'wk_dist_10000', type: 'distance', desc: 'Parcourir 10000 pieds', target: 10000, reward: 8000 },
        { id: 'wk_play_all_10', type: 'play_all_modes', desc: 'Jouer 10 parties de chaque mode', target: 10, reward: 6000 },
        { id: 'wk_perfect_contest', type: 'perfect_rack', desc: 'Réussir un Rack Parfait (5/5)', target: 1, reward: 5000 }
    ];

    var COURT_THEMES = {
        arena: {
            name: "NBA ARENA",
            type: 'arena',
            ground1: '#E0C39C', // Wood Light
            ground2: '#C4A484', // Wood Dark
            sky1: '#050510',
            sky2: '#101020'
        },
        carnival: {
            name: "CARNIVAL",
            type: 'carnival',
            ground1: '#FF4500', // Red
            ground2: '#FFD700', // Yellow
            sky1: '#000080',
            sky2: '#4B0082'
        }
    };

    var COURT_ZONES = [
        { limit: 50, name: "COUR ARRIÈRE", type: 'grass', ground1: '#228B22', ground2: '#32CD32', sky1: '#87CEEB', sky2: '#FFF' },
        { limit: 100, name: "PARC DE LA PAIX", type: 'tree', ground1: '#8B4513', ground2: '#D2691E', sky1: '#87CEEB', sky2: '#E0FFFF' },
        { limit: 200, name: "VIEUX-LÉVIS", type: 'castle', ground1: '#8B0000', ground2: '#A52A2A', sky1: '#4682B4', sky2: '#87CEEB' },
        { limit: 350, name: "TERRAIN DE RUE", type: 'castle', ground1: '#696969', ground2: '#808080', sky1: '#4682B4', sky2: '#87CEEB' },
        { limit: 500, name: "FORÊT BORÉALE", type: 'tree', ground1: '#006400', ground2: '#2F4F4F', sky1: '#2E8B57', sky2: '#8FBC8F' },
        { limit: 750, name: "LA PATINOIRE", type: 'mountain', ground1: '#E0FFFF', ground2: '#FFFFFF', sky1: '#87CEEB', sky2: '#F0F8FF' },
        { limit: 1000, name: "FLEUVE ST-LAURENT", type: 'water', ground1: '#00008B', ground2: '#1E90FF', sky1: '#191970', sky2: '#4169E1' },
        { limit: 1500, name: "MONT-SAINTE-ANNE", type: 'mountain', ground1: '#F0FFFF', ground2: '#E0FFFF', sky1: '#87CEEB', sky2: '#00BFFF' },
        { limit: 2500, name: "HAUTE ATMOSPHÈRE", type: 'space', ground1: '#483D8B', ground2: '#6A5ACD', sky1: '#000080', sky2: '#000000' },
        { limit: 4000, name: "BASE LUNAIRE", type: 'space', ground1: '#808080', ground2: '#A9A9A9', sky1: '#000000', sky2: '#191970' },
        { limit: 6000, name: "MARS", type: 'space', ground1: '#8B4513', ground2: '#CD853F', sky1: '#FF4500', sky2: '#000000' },
        { limit: 8000, name: "LE NETHER", type: 'space', ground1: '#8B0000', ground2: '#2F0000', sky1: '#330000', sky2: '#000000' },
        { limit: 9999999, name: "DIMENSION TACO", type: 'grass', ground1: '#FF00FF', ground2: '#00FFFF', sky1: '#FFFF00', sky2: '#FF0000' }
    ];

    var SCALE_OBJECTS = [
        { limit: 15, name: "Voiture Compacte", icon: "🚗" },
        { limit: 25, name: "Orignal (2m)", icon: "🦌" },
        { limit: 30, name: "Ligne de 3 points", icon: "🏀" },
        { limit: 40, name: "Autobus Scolaire", icon: "🚌" },
        { limit: 60, name: "Piste de Bowling", icon: "🎳" },
        { limit: 94, name: "Terrain NBA", icon: "🏀" },
        { limit: 150, name: "Baleine Bleue", icon: "🐋" },
        { limit: 195, name: "Tour de Pise", icon: "🇮🇹", type: 'landmark_leaning' },
        { limit: 230, name: "Envergure Boeing 747", icon: "✈️" },
        { limit: 272, name: "Chute Montmorency", icon: "🌊" },
        { limit: 305, name: "Statue de la Liberté", icon: "🗽", type: 'landmark_statue' },
        { limit: 350, name: "Château Frontenac", icon: "🏰", type: 'landmark_castle' },
        { limit: 450, name: "Pyramide de Gizeh", icon: "🔺", type: 'landmark_pyramid' },
        { limit: 600, name: "Space Needle", icon: "🛸", type: 'landmark_needle' },
        { limit: 984, name: "Tour Eiffel", icon: "🇫🇷", type: 'landmark_tower' },
        { limit: 1454, name: "Empire State Building", icon: "🏙️", type: 'landmark_building', color: '#555' },
        { limit: 1815, name: "Tour CN", icon: "🗼", type: 'landmark_needle' },
        { limit: 2200, name: "Pont de Québec (Travée)", icon: "🌉" },
        { limit: 2717, name: "Burj Khalifa", icon: "🏢", type: 'landmark_building', color: '#AAA' },
        { limit: 5280, name: "Un Mille (1.6km)", icon: "🛣️" },
        { limit: 10000, name: "Piste Aéroport", icon: "🛫" },
        { limit: 14410, name: "Mont Rainier", icon: "🏔️" },
        { limit: 20310, name: "Mont Denali", icon: "⛰️" },
        { limit: 29029, name: "Mont Everest", icon: "🗻" },
        { limit: 35000, name: "Altitude de Croisière", icon: "✈️" },
        { limit: 100000, name: "Stratosphère", icon: "🎈" },
        { limit: 328000, name: "Ligne de Kármán (Espace)", icon: "🌌" },
        { limit: 1300000, name: "Station Spatiale (ISS)", icon: "🛰️" },
        { limit: 9999999, name: "La Lune", icon: "🌑" }
    ];

    var SKINS_DB = [
        // HUMANS (CUSTOM)
        { id: 'human_custom', animal: 'human', name: 'Personnalisé', cost: 0, heightScale: 1.0, widthScale: 1.0, jerseyColor: '#FFF', shortsColor: '#000', skinTone: '#8d5524', hairStyle: 'buzz_cut', hairColor: '#000', shoesColor: '#FFF' },

        // RATS
        { id: 'rat_classic', animal: 'rat', name: 'Classique', cost: 250, bodyShape: 'oval' },
        { id: 'rat_lumberjack', animal: 'rat', name: 'Bûcheron', cost: 500, jerseyColor: '#b30000', shortsColor: '#00008b', legType: 'pants', shoesColor: '#8B4513', pattern: 'plaid', headAccessory: 'beanie', hatColor: '#FF0000', backProp: 'axe', clothingDetail: 'suspenders' },
        { id: 'rat_mariachi', animal: 'rat', name: 'El Mariachi', cost: 1000, jerseyColor: '#1a1a1a', shortsColor: '#1a1a1a', legType: 'pants', shoesColor: '#000', pattern: 'suit', headAccessory: 'sombrero', hatColor: '#1a1a1a', backProp: 'guitar' },
        { id: 'rat_luchador', animal: 'rat', name: 'Luchador', cost: 1500, jerseyColor: '#008000', shortsColor: '#008000', legType: 'pants', shoesColor: '#000', socksColor: '#FFF' },
        { id: 'rat_alien', animal: 'rat', name: 'Alien', cost: 3000, jerseyColor: '#C0C0C0', shortsColor: '#C0C0C0', sleeveColor: '#C0C0C0', legType: 'pants', shoesColor: '#555', headDetail: 'antenna' },
        { id: 'rat_zombie', animal: 'rat', name: 'Zombie', cost: 3000, jerseyColor: '#5D4037', shortsColor: '#3E2723', legType: 'pants', shoesColor: '#111' },
        { id: 'rat_astronaut', animal: 'rat', name: 'Astronaute', cost: 5000, jerseyColor: '#FFF', shortsColor: '#FFF', sleeveColor: '#FFF', legType: 'pants', shoesColor: '#AAA', headAccessory: 'helmet', hatColor: '#87CEEB', backProp: 'oxygen_tank' },
        { id: 'rat_ninja', animal: 'rat', name: 'Ninja', cost: 5000, jerseyColor: '#111', shortsColor: '#111', sleeveColor: '#111', legType: 'pants', headAccessory: 'headband', hatColor: '#F00', backProp: 'katanas' },
        { id: 'rat_robot', animal: 'rat', name: 'Robot', cost: 5000, jerseyColor: '#808080', shortsColor: '#808080', sleeveColor: '#808080', legType: 'pants', backProp: 'windup_key', headDetail: 'antenna' },
        { id: 'rat_pirate', animal: 'rat', name: 'Pirate', cost: 1500, jerseyColor: '#FFF', shortsColor: '#000', legType: 'pants', shoesColor: '#000', headAccessory: 'eyepatch', backProp: 'sword', headDetail: 'bandana_ties' },
        { id: 'rat_clown', animal: 'rat', name: 'Clown', cost: 1500, jerseyColor: '#FFD700', shortsColor: '#FF4500', shoesColor: '#F00', headAccessory: 'red_nose' },
        { id: 'rat_vampire', animal: 'rat', name: 'Vampire', cost: 3000, jerseyColor: '#FFF', shortsColor: '#000', legType: 'pants', shoesColor: '#000', backAccessory: 'cape', backColor: '#000' },
        { id: 'rat_chef', animal: 'rat', name: 'Chef', cost: 750, jerseyColor: '#FFF', shortsColor: '#000', shoesColor: '#000', headAccessory: 'chef_hat', clothingDetail: 'apron_ties' },
        { id: 'rat_hockey', animal: 'rat', name: 'Joueur Hockey', cost: 7500, jerseyColor: '#CC0000', shortsColor: '#000', legType: 'pants', shoesColor: '#FFF', headAccessory: 'helmet', hatColor: '#FFF', backProp: 'hockey_sticks' },
        { id: 'rat_poutine', animal: 'rat', name: 'Poutine', cost: 7500, jerseyColor: '#8B4513', shortsColor: '#F4C430', shoesColor: '#8B4513' },
        { id: 'rat_king', animal: 'rat', name: 'Roi', cost: 10000, jerseyColor: '#800080', shortsColor: '#800080', legType: 'pants', shoesColor: '#FFD700', headAccessory: 'crown', backAccessory: 'cape', backColor: '#800080' },
        { id: 'rat_wizard', animal: 'rat', name: 'Sorcier', cost: 10000, jerseyColor: '#000080', shortsColor: '#000080', legType: 'pants', shoesColor: '#000', headAccessory: 'wizard_hat', backAccessory: 'cape', backColor: '#000080', backProp: 'staff' },
        { id: 'rat_devil', animal: 'rat', name: 'Diable', cost: 15000, jerseyColor: '#800000', shortsColor: '#800000', legType: 'pants', shoesColor: '#000', headAccessory: 'horns', tailType: 'devil' },
        { id: 'rat_angel', animal: 'rat', name: 'Ange', cost: 15000, jerseyColor: '#FFF', shortsColor: '#FFF', legType: 'pants', shoesColor: '#FFD700', headAccessory: 'halo', backAccessory: 'wings' },
        // NEW RATS
        { id: 'rat_ghost', animal: 'rat', name: 'Fantôme', cost: 2000, furColor: 'rgba(255,255,255,0.6)', jerseyColor: 'rgba(255,255,255,0.3)', shortsColor: 'rgba(255,255,255,0.3)' },
        { id: 'rat_jester', animal: 'rat', name: 'Bouffon', cost: 2500, jerseyColor: '#FF00FF', shortsColor: '#FFFF00', shoesColor: '#00FFFF', headAccessory: 'crown', hatColor: '#FF00FF' },
        { id: 'rat_miner', animal: 'rat', name: 'Mineur', cost: 3000, jerseyColor: '#555', shortsColor: '#333', headAccessory: 'helmet', hatColor: '#FFA500' },
        { id: 'rat_rapper', animal: 'rat', name: 'Rappeur', cost: 3500, jerseyColor: '#FFF', shortsColor: '#000', headAccessory: 'beanie', hatColor: '#000', backAccessory: 'backpack' },
        { id: 'rat_detective', animal: 'rat', name: 'Détective', cost: 4000, jerseyColor: '#D2B48C', shortsColor: '#8B4513', legType: 'pants', headAccessory: 'hat', hatColor: '#8B4513' },

        // CATS
        { id: 'cat_classic', animal: 'cat', name: 'Classique', cost: 250, bodyShape: 'oval' },
        { id: 'cat_tabby', animal: 'cat', name: 'Tigré', cost: 1000, furColor: '#FFA500' },
        { id: 'cat_tuxedo', animal: 'cat', name: 'Tuxedo', cost: 1000, furColor: '#111' },
        // NEW CATS
        { id: 'cat_mainecoon', animal: 'cat', name: 'Maine Coon', cost: 3000, furColor: '#8B4513', pattern: 'tiger_stripes', widthScale: 1.2 },
        { id: 'cat_british', animal: 'cat', name: 'British', cost: 2500, furColor: '#778899', bodyShape: 'round' },
        { id: 'cat_ragdoll', animal: 'cat', name: 'Ragdoll', cost: 3500, furColor: '#FFF', earColor: '#555' },
        { id: 'cat_abyssinian', animal: 'cat', name: 'Abyssin', cost: 3000, furColor: '#CD5C5C', widthScale: 0.9 },
        { id: 'cat_bengal', animal: 'cat', name: 'Bengal', cost: 4000, furColor: '#D2B48C', hasSpots: true, spotColor: '#000' },
        { id: 'cat_scottish', animal: 'cat', name: 'Scottish', cost: 3000, furColor: '#A9A9A9', earColor: '#808080' },
        { id: 'cat_russian', animal: 'cat', name: 'Russe', cost: 2500, furColor: '#708090' },
        { id: 'cat_calico', animal: 'cat', name: 'Calico', cost: 3000, furColor: '#FFF', pattern: 'cow_spots', spotColor: '#D2691E' },
        { id: 'cat_tortie', animal: 'cat', name: 'Tortie', cost: 3000, furColor: '#222', pattern: 'cow_spots', spotColor: '#D2691E' },
        { id: 'cat_birman', animal: 'cat', name: 'Sacré', cost: 3500, furColor: '#FAF0E6', earColor: '#654321' },
        { id: 'cat_oriental', animal: 'cat', name: 'Oriental', cost: 3000, furColor: '#FFF', widthScale: 0.8 },
        { id: 'cat_norwegian', animal: 'cat', name: 'Norvégien', cost: 3500, furColor: '#808080', widthScale: 1.2 },
        { id: 'cat_american', animal: 'cat', name: 'Américain', cost: 2000, furColor: '#C0C0C0', pattern: 'tiger_stripes' },
        { id: 'cat_exotic', animal: 'cat', name: 'Exotic', cost: 3000, furColor: '#F5F5DC', bodyShape: 'round' },
        { id: 'cat_bombay', animal: 'cat', name: 'Bombay', cost: 2500, furColor: '#111' },
        { id: 'cat_panther', animal: 'cat', name: 'Panthère', cost: 2500, furColor: '#000', headAccessory: 'collar', hatColor: '#FFD700' },
        { id: 'cat_siamese', animal: 'cat', name: 'Siamois', cost: 2500, furColor: '#D2B48C', hasSpots: true, headAccessory: 'bow', hatColor: '#FF69B4' },
        { id: 'cat_sphinx', animal: 'cat', name: 'Sphinx', cost: 3000, furColor: '#FFC0CB', headAccessory: 'crown' },
        { id: 'cat_garfield', animal: 'cat', name: 'Lundi', cost: 3500, furColor: '#FF8C00', pattern: 'tiger_stripes', headAccessory: 'beanie', hatColor: '#000' },
        { id: 'cat_persian', animal: 'cat', name: 'Persan', cost: 4000, furColor: '#FFF', headAccessory: 'bow', hatColor: '#800080' },

        // DOGS
        { id: 'dog_classic', animal: 'dog', name: 'Classique', cost: 250, bodyShape: 'athletic_animal' },
        { id: 'dog_dalmation', animal: 'dog', name: 'Dalmatien', cost: 1000, furColor: '#FFF', hasSpots: true },
        { id: 'dog_pug', animal: 'dog', name: 'Carlin', cost: 1500, furColor: '#d2b48c' },
        // NEW DOGS
        { id: 'dog_albert', animal: 'dog', name: 'Albert', cost: 5000, furColor: '#D2B48C', hasBlackEars: true, heightScale: 0.8 },
        { id: 'dog_shepherd', animal: 'dog', name: 'Berger', cost: 3000, furColor: '#8B4513', jerseyColor: '#000', shortsColor: '#000', jerseyType: 'none' },
        { id: 'dog_beagle', animal: 'dog', name: 'Beagle', cost: 2500, furColor: '#FFF', pattern: 'cow_spots', spotColor: '#8B4513' },
        { id: 'dog_poodle_white', animal: 'dog', name: 'Caniche', cost: 3000, furColor: '#FFF', headDetail: 'afro', hairColor: '#FFF' },
        { id: 'dog_rottweiler', animal: 'dog', name: 'Rottweiler', cost: 3000, furColor: '#000', pattern: 'cow_spots', spotColor: '#8B4513' },
        { id: 'dog_dachshund', animal: 'dog', name: 'Saucisse', cost: 2500, furColor: '#8B4513', widthScale: 0.8, heightScale: 0.7 },
        { id: 'dog_yorkie', animal: 'dog', name: 'Yorkie', cost: 2500, furColor: '#B8860B', heightScale: 0.6 },
        { id: 'dog_shiba', animal: 'dog', name: 'Shiba', cost: 3500, furColor: '#D2691E' },
        { id: 'dog_collie', animal: 'dog', name: 'Collie', cost: 3000, furColor: '#000', jerseyColor: '#FFF', shortsColor: '#FFF' },
        { id: 'dog_corgi', animal: 'dog', name: 'Corgi', cost: 3500, furColor: '#D2691E', heightScale: 0.7, widthScale: 1.1 },
        { id: 'dog_doberman', animal: 'dog', name: 'Doberman', cost: 3000, furColor: '#000', heightScale: 1.1 },
        { id: 'dog_dane', animal: 'dog', name: 'Grand Danois', cost: 4000, furColor: '#778899', heightScale: 1.3 },
        { id: 'dog_chihuahua', animal: 'dog', name: 'Chihuahua', cost: 2000, furColor: '#D2B48C', heightScale: 0.5 },
        { id: 'dog_bernard', animal: 'dog', name: 'St-Bernard', cost: 4000, furColor: '#FFF', pattern: 'cow_spots', spotColor: '#8B4513', widthScale: 1.3 },
        { id: 'dog_bulldog', animal: 'dog', name: 'Bulldog', cost: 3000, furColor: '#FFF', bodyShape: 'round' },
        { id: 'dog_lab_choco', animal: 'dog', name: 'Lab Chocolat', cost: 2500, furColor: '#5D4037' },
        { id: 'dog_husky', animal: 'dog', name: 'Husky', cost: 2500, furColor: '#AAA', headAccessory: 'scarf', hatColor: '#FF0000' },
        { id: 'dog_boxer', animal: 'dog', name: 'Boxer', cost: 2500, furColor: '#8B4513', headAccessory: 'headband', hatColor: '#FFF' },
        { id: 'dog_police', animal: 'dog', name: 'K-9', cost: 3000, jerseyColor: '#000080', shortsColor: '#000080', headAccessory: 'hat', hatColor: '#000080' },
        { id: 'dog_golden', animal: 'dog', name: 'Golden', cost: 3500, furColor: '#FFD700', headAccessory: 'halo' },
        { id: 'dog_hotdog', animal: 'dog', name: 'Hot-Dog', cost: 4000, jerseyColor: '#FFA500', shortsColor: '#8B4513' },
        { id: 'dog_airbud', animal: 'dog', name: 'Golden Bud', cost: 500, furColor: '#DAA520', jerseyColor: '#191970', shortsColor: '#191970', trimColor: '#FFD700', number: '1', numberColor: '#FFD700' },

        // BEARS
        { id: 'bear_classic', animal: 'bear', name: 'Classique', cost: 500, bodyShape: 'bear_new', widthScale: 1.3 },
        { id: 'bear_panda', animal: 'bear', name: 'Panda', cost: 3000, furColor: '#FFF', legType: 'panda_limbs', hasBlackEars: true },
        { id: 'bear_polar', animal: 'bear', name: 'Polaire', cost: 3000, furColor: '#F0F8FF' },
        // NEW BEARS
        { id: 'bear_grizzly', animal: 'bear', name: 'Grizzly', cost: 2500, furColor: '#3E2723', headAccessory: 'hat', hatColor: '#5D4037' },
        { id: 'bear_teddy', animal: 'bear', name: 'Toutou', cost: 2500, furColor: '#D2691E', headAccessory: 'bow', hatColor: '#FF0000' },
        { id: 'bear_cyborg', animal: 'bear', name: 'Cyborg', cost: 4000, furColor: '#C0C0C0', headDetail: 'antenna' },
        { id: 'bear_gummy', animal: 'bear', name: 'Gélatine', cost: 3500, furColor: 'rgba(255,0,0,0.6)' },
        { id: 'bear_care', animal: 'bear', name: 'Calin', cost: 3500, furColor: '#FF69B4', pattern: 'heart' },

        // RABBITS
        { id: 'rabbit_classic', animal: 'rabbit', name: 'Classique', cost: 250, furColor: '#8B4513' },
        { id: 'rabbit_jack', animal: 'rabbit', name: 'Lièvre', cost: 1000, furColor: '#FFFFFF' },
        { id: 'rabbit_magic', animal: 'rabbit', name: 'Magicien', cost: 2500, jerseyColor: '#000', shortsColor: '#000', legType: 'pants', shoesColor: '#FFF', headAccessory: 'wizard_hat', hatColor: '#000', backProp: 'staff' },
        // NEW RABBITS
        { id: 'rabbit_easter', animal: 'rabbit', name: 'Pâques', cost: 2500, furColor: '#ADD8E6', pattern: 'spots', backProp: 'basket' },
        { id: 'rabbit_energizer', animal: 'rabbit', name: 'Duracell', cost: 3000, furColor: '#FF69B4', headAccessory: 'headband', hatColor: '#000' },
        { id: 'rabbit_velveteen', animal: 'rabbit', name: 'Peluche', cost: 2000, furColor: '#A0522D', clothingDetail: 'stitches' },
        { id: 'rabbit_killer', animal: 'rabbit', name: 'Vorpal', cost: 5000, furColor: '#FFF', headAccessory: 'collar', hatColor: '#FF0000' },
        { id: 'rabbit_cyborg', animal: 'rabbit', name: 'Robo-Lapin', cost: 4000, furColor: '#C0C0C0' },

        // MOOSE
        { id: 'moose_classic', animal: 'moose', name: 'Classique', cost: 750 },
        { id: 'moose_royal', animal: 'moose', name: 'Royal', cost: 5000, headAccessory: 'crown', backAccessory: 'cape', backColor: '#800080' },
        // NEW MOOSE
        { id: 'moose_mountie', animal: 'moose', name: 'Gendarme', cost: 3000, jerseyColor: '#FF0000', shortsColor: '#000', headAccessory: 'hat', hatColor: '#8B4513' },
        { id: 'moose_christmas', animal: 'moose', name: 'Noël', cost: 3000, jerseyColor: '#006400', shortsColor: '#FF0000', headAccessory: 'antlers_lights' },
        { id: 'moose_swamp', animal: 'moose', name: 'Marais', cost: 2500, furColor: '#556B2F', headAccessory: 'algae' },
        { id: 'moose_albino', animal: 'moose', name: 'Albinos', cost: 4000, furColor: '#FFF', headAccessory: 'halo' },
        { id: 'moose_bullwinkle', animal: 'moose', name: 'Toon', cost: 3500, furColor: '#8B4513', jerseyType: 'tshirt' },

        // FOXES (NEW)
        { id: 'fox_classic', animal: 'fox', name: 'Classique', cost: 1000 },
        { id: 'fox_arctic', animal: 'fox', name: 'Arctique', cost: 2000, furColor: '#FFF', headAccessory: 'ear_muffs', hatColor: '#ADD8E6' },
        { id: 'fox_kitsune', animal: 'fox', name: 'Kitsune', cost: 5000, furColor: '#FFD700', tailType: 'multi' },
        { id: 'fox_ninja', animal: 'fox', name: 'Ombre', cost: 3000, jerseyColor: '#000', shortsColor: '#000', headAccessory: 'headband' },
        { id: 'fox_pilot', animal: 'fox', name: 'Pilote', cost: 3000, jerseyColor: '#FFF', shortsColor: '#228B22', headAccessory: 'helmet', hatColor: '#CCC' },
        { id: 'fox_gentleman', animal: 'fox', name: 'Gentleman', cost: 4000, jerseyColor: '#000', shortsColor: '#000', legType: 'pants', pattern: 'suit', headAccessory: 'top_hat' },

        // WOLVES (NEW)
        { id: 'wolf_classic', animal: 'wolf', name: 'Classique', cost: 1000, bodyShape: 'athletic_animal' },
        { id: 'wolf_black', animal: 'wolf', name: 'Noir', cost: 2000, furColor: '#1a1a1a', headAccessory: 'collar', hatColor: '#FF0000' },
        { id: 'wolf_white', animal: 'wolf', name: 'Blanc', cost: 2000, furColor: '#FFF', headAccessory: 'scarf', hatColor: '#00008B' },
        { id: 'wolf_alpha', animal: 'wolf', name: 'Alpha', cost: 5000, furColor: '#333' },
        { id: 'wolf_cyber', animal: 'wolf', name: 'Cyber', cost: 4000, furColor: '#C0C0C0', headDetail: 'visor' },
        { id: 'wolf_shaman', animal: 'wolf', name: 'Chaman', cost: 3500, furColor: '#808080', headAccessory: 'feathers' },

        // LIONS (NEW)
        { id: 'lion_classic', animal: 'lion', name: 'Classique', cost: 1500 },
        { id: 'lion_scar', animal: 'lion', name: 'Balafré', cost: 3000, furColor: '#8B4513' },
        { id: 'lion_white', animal: 'lion', name: 'Blanc', cost: 3000, furColor: '#FFF', headAccessory: 'crown' },
        { id: 'lion_king', animal: 'lion', name: 'Roi', cost: 10000, headAccessory: 'crown', backAccessory: 'cape', backColor: '#800080' },
        { id: 'lion_rasta', animal: 'lion', name: 'Rasta', cost: 4000, jerseyColor: '#008000', shortsColor: '#FFFF00', shoesColor: '#FF0000', headAccessory: 'beanie' },
        { id: 'lion_mech', animal: 'lion', name: 'Mecha', cost: 5000, furColor: '#C0C0C0', headDetail: 'visor' },

        // TIGERS (NEW)
        { id: 'tiger_classic', animal: 'tiger', name: 'Classique', cost: 1500, pattern: 'tiger_stripes' },
        { id: 'tiger_white', animal: 'tiger', name: 'Blanc', cost: 3000, furColor: '#FFF', pattern: 'tiger_stripes', headAccessory: 'headband', hatColor: '#FFF' },
        { id: 'tiger_sabretooth', animal: 'tiger', name: 'Smilodon', cost: 5000, furColor: '#D2B48C', headAccessory: 'collar', hatColor: '#000' },
        { id: 'tiger_karate', animal: 'tiger', name: 'Karaté', cost: 3500, jerseyColor: '#FFF', shortsColor: '#FFF', legType: 'pants', headAccessory: 'headband' },
        { id: 'tiger_tony', animal: 'tiger', name: 'Mascotte', cost: 4000, jerseyColor: '#FF0000', headAccessory: 'bandana_neck' },
        { id: 'tiger_neon', animal: 'tiger', name: 'Néon', cost: 4500, furColor: '#00FFFF', pattern: 'tiger_stripes' },

        // PIGS (NEW)
        { id: 'pig_classic', animal: 'pig', name: 'Classique', cost: 1000 },
        { id: 'pig_muddy', animal: 'pig', name: 'Boueux', cost: 2000, furColor: '#FFC0CB', pattern: 'spots', spotColor: '#8B4513' },
        { id: 'pig_boar', animal: 'pig', name: 'Sanglier', cost: 3000, furColor: '#5D4037', headDetail: 'mohawk', hairColor: '#000' },
        { id: 'pig_bank', animal: 'pig', name: 'Tirelire', cost: 4000, furColor: '#FF69B4', skinType: 'shiny' },
        { id: 'pig_police', animal: 'pig', name: 'Police', cost: 3500, jerseyColor: '#000080', shortsColor: '#000080', headAccessory: 'hat', hatColor: '#000080' },
        { id: 'pig_gentleman', animal: 'pig', name: 'Riche', cost: 5000, jerseyColor: '#000', shortsColor: '#000', legType: 'pants', headAccessory: 'top_hat', pattern: 'suit' },

        // COWS (NEW)
        { id: 'cow_classic', animal: 'cow', name: 'Classique', cost: 500, bodyShape: 'round' },
        { id: 'cow_highland', animal: 'cow', name: 'Highland', cost: 3000, furColor: '#8B0000' },
        { id: 'cow_bull', animal: 'cow', name: 'Taureau', cost: 3500, furColor: '#000', headAccessory: 'bandana_neck' },
        { id: 'cow_strawberry', animal: 'cow', name: 'Fraise', cost: 2500, furColor: '#FFC0CB', pattern: 'cow_spots', headAccessory: 'flower' },
        { id: 'cow_farmer', animal: 'cow', name: 'Fermier', cost: 3000, clothingDetail: 'overalls', jerseyColor: '#87CEEB', shortsColor: '#000080' },
        { id: 'cow_space', animal: 'cow', name: 'Espace', cost: 5000, furColor: '#00FF00', headAccessory: 'helmet' },

        // MONKEYS (NEW)
        { id: 'monkey_classic', animal: 'monkey', name: 'Classique', cost: 500, bodyShape: 'athletic_animal', armLen: 1.2 },
        { id: 'monkey_gorilla', animal: 'monkey', name: 'Gorille', cost: 3000, furColor: '#000', backProp: 'barrel' },
        { id: 'monkey_chimp', animal: 'monkey', name: 'Chimpanzé', cost: 2500, furColor: '#333', headAccessory: 'fez' },
        { id: 'monkey_wukong', animal: 'monkey', name: 'Wukong', cost: 10000, furColor: '#FFD700', headAccessory: 'crown', backProp: 'staff' },
        { id: 'monkey_space', animal: 'monkey', name: 'Cosmonaute', cost: 4000, jerseyColor: '#FFA500', shortsColor: '#FFA500', legType: 'pants', headAccessory: 'helmet' },
        { id: 'monkey_zombie', animal: 'monkey', name: 'Zombie', cost: 3000, furColor: '#556B2F' },

        // PENGUINS (NEW)
        { id: 'penguin_classic', animal: 'penguin', name: 'Classique', cost: 500, bodyShape: 'penguin', limbLen: 0.5 },
        { id: 'penguin_emperor', animal: 'penguin', name: 'Empereur', cost: 2500, headDetail: 'yellow_neck' },
        { id: 'penguin_tuxedo', animal: 'penguin', name: 'Tuxedo', cost: 2000, pattern: 'suit' },
        { id: 'penguin_icy', animal: 'penguin', name: 'Glace', cost: 3000, furColor: '#ADD8E6', headAccessory: 'ear_muffs', hatColor: '#FFF' },
        { id: 'penguin_pilot', animal: 'penguin', name: 'Pilote', cost: 3500, headAccessory: 'helmet', hatColor: '#CCC' },
        { id: 'penguin_rico', animal: 'penguin', name: 'Rico', cost: 3000, headDetail: 'mohawk' },

        // NBA LEGENDS (Humans - Accurate Colors & Patterns)
        { id: 'human_wall', animal: 'human', name: 'Speedy', shortsPattern: 'wizards', jerseyName: 'SPEEDY', cost: 5000, heightScale: 1.085, widthScale: 0.9, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#002B5C', trimColor: '#E31837', number: '2', numberColor: '#E31837', skinTone: '#5c3a21', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', sleeveRight: '#E31837', beard: true },
        { id: 'human_wall_alt', animal: 'human', name: 'Capital Red', jerseyName: 'D.C.', cost: 5000, heightScale: 1.085, widthScale: 0.9, jerseyColor: '#E31837', shortsColor: '#E31837', sideStripesColor: '#FFF', trimColor: '#002B5C', number: '2', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#FFF', shoesColor: '#002B5C', beard: true },
        { id: 'human_wall_rookie', animal: 'human', name: 'Rookie Wall', jerseyName: 'ROOKIE', cost: 10000, heightScale: 1.085, widthScale: 0.9, jerseyColor: '#002B5C', shortsColor: '#002B5C', trimColor: '#C4A006', number: '2', numberColor: '#C4A006', skinTone: '#5c3a21', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#FFF', shoesColor: '#C4A006', sleeveRight: '#FFF' },
        { id: 'human_lebron', animal: 'human', name: 'The King', jerseyName: 'THE KING', cost: 25000, heightScale: 1.170, widthScale: 1.0, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '23', numberColor: '#552583', skinTone: '#4a3020', hairStyle: 'fade_king', headAccessory: 'headband', hairColor: '#000', headbandColor: '#552583', hatColor: '#552583', hairStyle2: 'bald_stubble', headbandColor2: null, sleeveRight: '#FDB927', socksColor: '#FFF', shoesColor: '#552583', tattoos: true, beard: true },
        { id: 'human_lebron_alt', animal: 'human', name: 'Heatles', jerseyName: 'KING', cost: 25000, heightScale: 1.170, widthScale: 1.0, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#E31837', number: '6', numberColor: '#FFF', skinTone: '#4a3020', hairStyle: 'fade_king', headAccessory: 'headband', hairColor: '#000', headbandColor: '#E31837', hatColor: '#E31837', hairStyle2: 'bald_stubble', headbandColor2: null, sleeveRight: '#000', socksColor: '#000', shoesColor: '#E31837', tattoos: true, beard: true },
        { id: 'human_lebron_cavs', animal: 'human', name: 'Believeland', jerseyName: 'KING', cost: 30000, heightScale: 1.170, widthScale: 1.0, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#6F263D', shortsColor: '#6F263D', trimColor: '#FFB81C', number: '23', numberColor: '#FFB81C', skinTone: '#4a3020', hairStyle: 'fade_king', headAccessory: 'headband', hairColor: '#000', headbandColor: '#FFB81C', hatColor: '#FFB81C', hairStyle2: 'bald_stubble', headbandColor2: null, sleeveRight: '#6F263D', socksColor: '#000', shoesColor: '#000', tattoos: true, beard: true },
        { id: 'human_kobe8', animal: 'human', name: 'Frobe', jerseyName: 'FROBE', cost: 30000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '8', numberColor: '#552583', skinTone: '#5c3a21', hairStyle: 'afro_mini', afroSize: 1.1, hairStyle2: 'afro_mini', hairColor: '#000', socksColor: '#FFF', shoesColor: '#111', beard: true },
        { id: 'human_kobe8_alt', animal: 'human', name: 'Showtime 8', jerseyName: 'MAMBA', cost: 30000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#552583', shortsColor: '#552583', sideStripesColor: '#FDB927', number: '8', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'afro_mini', afroSize: 1.1, hairStyle2: 'afro_mini', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_kobe24', animal: 'human', name: 'Black Mamba', jerseyName: 'MAMBA', cost: 30000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#552583', number: '24', numberColor: '#552583', skinTone: '#5c3a21', hairStyle: 'bald_stubble', hairStyle2: 'bald_stubble', hairColor: '#000', sleeveRight: '#FFF', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_kobe24_alt', animal: 'human', name: 'Mamba Forever', jerseyName: 'EIGHT', cost: 30000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#000', shortsColor: '#000', trimColor: '#FDB927', number: '24', numberColor: '#FDB927', skinTone: '#5c3a21', hairStyle: 'bald_stubble', hairStyle2: 'bald_stubble', hairColor: '#000', sleeveRight: '#000', socksColor: '#000', shoesColor: '#FDB927' },
        { id: 'human_curry', animal: 'human', name: 'Chef Curry', jerseyName: 'CHEF', cost: 30000, heightScale: 1.070, widthScale: 0.85, armWidthScale: 0.9, legWidthScale: 0.9, jerseyColor: '#1D428A', shortsColor: '#1D428A', trimColor: '#FFC72C', number: '30', numberColor: '#FFC72C', skinTone: '#dcb98a', hairStyle: 'fade_chef', hairStyle2: 'fade_low', hairColor: '#000', jerseyType: 'tshirt', socksColor: '#FFF', shoesColor: '#FFC72C', beard: true },
        { id: 'human_curry_alt', animal: 'human', name: 'The City', jerseyName: 'CHEF', cost: 30000, heightScale: 1.070, widthScale: 0.85, armWidthScale: 0.9, legWidthScale: 0.9, jerseyColor: '#FDB927', shortsColor: '#FDB927', trimColor: '#1D428A', number: '30', numberColor: '#1D428A', skinTone: '#dcb98a', hairStyle: 'fade_chef', hairStyle2: 'fade_low', hairColor: '#000', jerseyType: 'tshirt', socksColor: '#1D428A', shoesColor: '#FDB927', beard: true },
        { id: 'human_magic', animal: 'human', name: 'Magic', jerseyName: 'MAGIC', cost: 30000, heightScale: 1.170, widthScale: 0.95, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '32', numberColor: '#552583', skinTone: '#5c3a21', hairStyle: 'fade_retro', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF', shortsLength: 'short' },
        { id: 'human_magic_alt', animal: 'human', name: 'Purple Magic', jerseyName: 'MAGIC', cost: 30000, heightScale: 1.170, widthScale: 0.95, jerseyColor: '#552583', shortsColor: '#552583', sideStripesColor: '#FDB927', number: '32', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'fade_retro', hairColor: '#000', socksColor: '#FDB927', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_drj', animal: 'human', name: 'The Doctor', jerseyName: 'DOCTOR', cost: 35000, heightScale: 1.140, widthScale: 0.9, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#ED174C', number: '32', numberColor: '#ED174C', skinTone: '#5c3a21', hairStyle: 'afro_70s', afroSize: 1.5, hairColor: '#000', socksColor: '#FFF', shoesColor: '#ED174C', shortsLength: 'short' },
        { id: 'human_drj_alt', animal: 'human', name: 'ABA Star', jerseyName: 'DOCTOR', cost: 35000, heightScale: 1.140, widthScale: 0.9, jerseyColor: '#00285E', shortsColor: '#00285E', trimColor: '#E31837', number: '32', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'afro_70s', afroSize: 1.5, hairColor: '#000', socksColor: '#FFF', shoesColor: '#E31837', shortsLength: 'short' },
        { id: 'human_wilt', animal: 'human', name: 'The Stilt', jerseyName: 'STILT', cost: 40000, heightScale: 1.230, widthScale: 0.95, jerseyColor: '#552583', shortsColor: '#552583', sideStripesColor: '#FDB927', number: '13', numberColor: '#FFF', skinTone: '#4a3020', hairStyle: 'fade_retro', headAccessory: 'headband', hairColor: '#000', headbandColor: '#FDB927', hatColor: '#FDB927', socksColor: '#FFF', shoesColor: '#FFF', shortsLength: 'short', beard: true },
        { id: 'human_wilt_alt', animal: 'human', name: 'Philly 100', jerseyName: 'THE STILT', cost: 40000, heightScale: 1.230, widthScale: 0.95, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#000', number: '13', numberColor: '#000', skinTone: '#4a3020', hairStyle: 'bald_clean', hairColor: '#000', headbandColor: '#FFF', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short', beard: true },
        { id: 'human_mj', animal: 'human', name: 'The G.O.A.T.', jerseyName: 'G.O.A.T.', shortsPattern: 'bulls', cost: 50000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#CE1141', shortsColor: '#CE1141', trimColor: '#000', number: '23', numberColor: '#000', skinTone: '#3e271a', hairStyle: 'bald_clean', hairStyle2: 'bald_stubble', hairColor: '#000', socksColor: '#FFF', shoesColor: '#CE1141' },
        { id: 'human_mj_alt', animal: 'human', name: 'Black Pinstripe', jerseyName: 'G.O.A.T.', cost: 50000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#000', shortsColor: '#000', pinstripesColor: '#CE1141', number: '23', numberColor: '#CE1141', skinTone: '#3e271a', hairStyle: 'bald_clean', hairStyle2: 'bald_stubble', hairColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_mj_wiz', animal: 'human', name: 'D.C. GOAT', jerseyName: 'G.O.A.T.', cost: 40000, heightScale: 1.130, widthScale: 0.9, jerseyColor: '#002B5C', shortsColor: '#002B5C', trimColor: '#C4A006', number: '23', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald_clean', hairStyle2: 'bald_stubble', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_bird', animal: 'human', name: 'Larry Legend', jerseyName: 'LEGEND', cost: 40000, heightScale: 1.170, widthScale: 0.95, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '33', numberColor: '#FFF', skinTone: '#f0d5be', hairStyle: 'mullet_80s', hairColor: '#e3c179', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_bird_alt', animal: 'human', name: 'Celtics Home', jerseyName: 'LEGEND', cost: 40000, heightScale: 1.170, widthScale: 0.95, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#007A33', number: '33', numberColor: '#007A33', skinTone: '#f0d5be', hairStyle: 'mullet_80s', hairColor: '#e3c179', socksColor: '#007A33', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_shaq', animal: 'human', name: 'Diesel', jerseyName: 'DIESEL', cost: 40000, heightScale: 1.230, widthScale: 1.2, armWidthScale: 1.3, legWidthScale: 1.3, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '34', numberColor: '#552583', skinTone: '#3c2415', hairStyle: 'bald_stubble', hairColor: '#000', socksColor: '#FFF', shoesColor: '#111' },
        { id: 'human_shaq_alt', animal: 'human', name: 'Big Diesel', jerseyName: 'DIESEL', cost: 40000, heightScale: 1.230, widthScale: 1.2, armWidthScale: 1.3, legWidthScale: 1.3, jerseyColor: '#000', shortsColor: '#000', pinstripesColor: '#FFF', number: '32', numberColor: '#FFF', skinTone: '#3c2415', hairStyle: 'bald_stubble', hairColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_shaq_magic', animal: 'human', name: 'Magic Diesel', jerseyName: 'DIESEL', cost: 35000, heightScale: 1.230, widthScale: 1.1, armWidthScale: 1.2, legWidthScale: 1.2, jerseyColor: '#0077C0', shortsColor: '#0077C0', pinstripesColor: '#FFF', number: '32', numberColor: '#FFF', skinTone: '#3c2415', hairStyle: 'bald_stubble', hairColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_ai', animal: 'human', name: 'The Answer', jerseyName: 'ANSWER', cost: 35000, heightScale: 1.040, widthScale: 0.8, jerseyColor: '#000', shortsColor: '#000', trimColor: '#ED174C', number: '3', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'cornrows_straight', hairStyle2: 'afro_mini', headbandColor2: null, hairColor: '#000', headbandColor: '#FFF', sleeveRight: '#000', socksColor: '#000', shoesColor: '#FFF', tattoos: true, beard: true },
        { id: 'human_ai_alt', animal: 'human', name: 'Powder Blue', jerseyName: 'ANSWER', cost: 35000, heightScale: 1.040, widthScale: 0.8, jerseyColor: '#418FDE', shortsColor: '#418FDE', trimColor: '#FDB927', number: '3', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'cornrows_straight', hairStyle2: 'afro_mini', headbandColor2: null, hairColor: '#000', headbandColor: '#FFF', sleeveRight: '#418FDE', socksColor: '#FFF', shoesColor: '#FFF', tattoos: true, beard: true },
        { id: 'human_duncan', animal: 'human', name: 'Big Fundamental', jerseyName: 'FUNDAMENTAL', cost: 35000, heightScale: 1.200, widthScale: 0.95, jerseyColor: '#000', shortsColor: '#000', trimColor: '#C4CED4', number: '21', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#000', shoesColor: '#000' },
        { id: 'human_duncan_alt', animal: 'human', name: 'Silver Spur', jerseyName: 'TIMMY', cost: 35000, heightScale: 1.200, widthScale: 0.95, jerseyColor: '#C4CED4', shortsColor: '#C4CED4', trimColor: '#000', number: '21', numberColor: '#000', skinTone: '#5c3a21', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#000', shoesColor: '#000' },
        { id: 'human_rodman', animal: 'human', name: 'The Worm', jerseyName: 'WORM', shortsPattern: 'bulls', cost: 30000, heightScale: 1.140, widthScale: 0.9, jerseyColor: '#CE1141', shortsColor: '#000', trimColor: '#000', number: '91', numberColor: '#000', skinTone: '#3e271a', hairStyle: 'buzz_colored', hairColor: '#00FF00', hairColor2: '#FFD700', socksColor: '#FFF', shoesColor: '#FFF', shortsLength: 'short', tattoos: true },
        { id: 'human_rodman_alt', animal: 'human', name: 'Bad Boy', jerseyName: 'WORM', cost: 30000, heightScale: 1.140, widthScale: 0.9, jerseyColor: '#00519E', shortsColor: '#00519E', trimColor: '#E31837', number: '10', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'buzz_colored', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_barkley', animal: 'human', name: 'Sir Charles', jerseyName: 'SIR CHARLES', cost: 30000, heightScale: 1.130, widthScale: 1.05, jerseyColor: '#1D1160', shortsColor: '#1D1160', sideStripesColor: '#E56020', number: '34', numberColor: '#E56020', skinTone: '#8d5524', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_barkley_alt', animal: 'human', name: 'Philly Sir', jerseyName: 'CHUCK', cost: 30000, heightScale: 1.130, widthScale: 1.05, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#CE1141', number: '34', numberColor: '#CE1141', skinTone: '#8d5524', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#CE1141', shortsLength: 'short' },
        { id: 'human_dirk', animal: 'human', name: 'German Jesus', jerseyName: 'GERMAN', cost: 30000, heightScale: 1.215, widthScale: 0.92, jerseyColor: '#00538C', shortsColor: '#00538C', sideStripesColor: '#B8C4CA', number: '41', numberColor: '#FFF', skinTone: '#f0d5be', hairStyle: 'long_flow', hairColor: '#dcb98a', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_dirk_alt', animal: 'human', name: 'Retro Mav', jerseyName: 'DIRK', cost: 30000, heightScale: 1.215, widthScale: 0.92, jerseyColor: '#007A33', shortsColor: '#007A33', sideStripesColor: '#00538C', number: '41', numberColor: '#FFF', skinTone: '#f0d5be', hairStyle: 'long_flow', hairColor: '#dcb98a', socksColor: '#000', shoesColor: '#000' },
        { id: 'human_giannis', animal: 'human', name: 'Greek Freak', jerseyName: 'FREAK', cost: 25000, heightScale: 1.200, widthScale: 0.98, jerseyColor: '#00471B', shortsColor: '#00471B', sideStripesColor: '#EEE1C6', number: '34', numberColor: '#EEE1C6', skinTone: '#4a3020', hairStyle: 'fade_king', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_giannis_alt', animal: 'human', name: 'Cream City', jerseyName: 'FREAK', cost: 25000, heightScale: 1.200, widthScale: 0.98, jerseyColor: '#EEE1C6', shortsColor: '#EEE1C6', sideStripesColor: '#00471B', number: '34', numberColor: '#00471B', skinTone: '#4a3020', hairStyle: 'fade_king', hairColor: '#000', socksColor: '#00471B', shoesColor: '#FFF' },
        { id: 'human_joker', animal: 'human', name: 'The Joker', jerseyName: 'JOKER', cost: 25000, heightScale: 1.200, widthScale: 1.1, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#0E2240', shortsColor: '#0E2240', trimColor: '#FEC524', number: '15', numberColor: '#FEC524', skinTone: '#f0d5be', hairStyle: 'crew_messy', hairColor: '#4a3020', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_joker_alt', animal: 'human', name: 'Rainbow', jerseyName: 'JOKER', cost: 25000, heightScale: 1.200, widthScale: 1.1, armWidthScale: 1.1, legWidthScale: 1.1, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#FF0000', number: '15', numberColor: '#FEC524', skinTone: '#f0d5be', hairStyle: 'crew_messy', hairColor: '#4a3020', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_luka', animal: 'human', name: 'Luka Magic', jerseyName: 'MAGIC', cost: 25000, heightScale: 1.140, widthScale: 1.0, jerseyColor: '#00538C', shortsColor: '#00538C', sideStripesColor: '#B8C4CA', number: '77', numberColor: '#FFF', skinTone: '#f0d5be', hairStyle: 'fade_pompadour', hairColor: '#4a3020', socksColor: '#FFF', shoesColor: '#FFF', beard: true },
        { id: 'human_luka_alt', animal: 'human', name: 'Matador', jerseyName: 'LUKA', cost: 25000, heightScale: 1.140, widthScale: 1.0, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#00C1D4', number: '7', numberColor: '#00C1D4', skinTone: '#f0d5be', hairStyle: 'fade_pompadour', hairColor: '#4a3020', socksColor: '#FFF', shoesColor: '#00C1D4', beard: true },
        { id: 'human_kd', animal: 'human', name: 'Slim Reaper', jerseyName: 'REAPER', cost: 30000, heightScale: 1.200, widthScale: 0.85, armWidthScale: 0.8, legWidthScale: 0.8, jerseyColor: '#1D1160', shortsColor: '#1D1160', sideStripesColor: '#E56020', number: '35', numberColor: '#E56020', skinTone: '#3e271a', hairStyle: 'curls_textured', hairColor: '#000', socksColor: '#FFF', shoesColor: '#1D428A', beard: true },
        { id: 'human_kd_alt', animal: 'human', name: 'SuperSonics', jerseyName: 'SLIM', cost: 30000, heightScale: 1.200, widthScale: 0.85, armWidthScale: 0.8, legWidthScale: 0.8, jerseyColor: '#00653A', shortsColor: '#00653A', sideStripesColor: '#FFC200', number: '35', numberColor: '#FFC200', skinTone: '#3e271a', hairStyle: 'curls_textured', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFC200', beard: true },
        { id: 'human_harden', animal: 'human', name: 'The Beard', jerseyName: 'BEARD', cost: 25000, heightScale: 1.110, widthScale: 0.95, jerseyColor: '#CE1141', shortsColor: '#CE1141', sideStripesColor: '#FFF', number: '13', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'mohawk_fade', hairStyle2: 'cornrows_straight', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true, beardBig: true, beardColor: '#000' },
        { id: 'human_harden_alt', animal: 'human', name: 'Brooklyn', jerseyName: 'BEARD', cost: 25000, heightScale: 1.110, widthScale: 0.95, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#FFF', number: '13', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'mohawk_fade', hairStyle2: 'cornrows_straight', hairColor: '#000', beard: true, beardBig: true, beardColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_vince', animal: 'human', name: 'Vinsanity', jerseyName: 'VINSANITY', cost: 30000, heightScale: 1.130, widthScale: 0.92, jerseyColor: '#753BBD', shortsColor: '#753BBD', pinstripesColor: '#CE1141', number: '15', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald_stubble', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_vince_alt', animal: 'human', name: 'Dino White', jerseyName: 'VINSANITY', cost: 30000, heightScale: 1.130, widthScale: 0.92, jerseyColor: '#FFF', shortsColor: '#FFF', pinstripesColor: '#CE1141', number: '15', numberColor: '#CE1141', skinTone: '#3e271a', hairStyle: 'bald_stubble', hairColor: '#000', socksColor: '#FFF', shoesColor: '#CE1141', beard: true },
        { id: 'human_kareem', animal: 'human', name: 'Cap', jerseyName: 'CAP', cost: 45000, heightScale: 1.245, widthScale: 0.88, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '33', numberColor: '#552583', skinTone: '#4a3020', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#1D428A', shortsLength: 'short' },
        { id: 'human_kareem_alt', animal: 'human', name: 'Bucks Cap', jerseyName: 'CAP', cost: 45000, heightScale: 1.245, widthScale: 0.88, jerseyColor: '#00471B', shortsColor: '#00471B', sideStripesColor: '#EEE1C6', number: '33', numberColor: '#EEE1C6', skinTone: '#4a3020', hairStyle: 'afro_70s', afroSize: 1.1, hairColor: '#000', socksColor: '#00471B', shoesColor: '#EEE1C6', shortsLength: 'short' },
        { id: 'human_russell', animal: 'human', name: 'Bill', jerseyName: 'BILL', cost: 50000, heightScale: 1.185, widthScale: 0.9, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '6', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'afro_70s', afroSize: 1.0, hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short', beard: true },
        { id: 'human_russell_alt', animal: 'human', name: 'Celtics Away', jerseyName: 'BILL', cost: 50000, heightScale: 1.185, widthScale: 0.9, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '6', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'afro_70s', afroSize: 1.0, hairColor: '#000', socksColor: '#000', shoesColor: '#000', shortsLength: 'short', beard: true },
        { id: 'human_jackie', animal: 'human', name: 'Semi Moon', jerseyName: 'MOON', cost: 500, heightScale: 1.1, widthScale: 1.0, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#FFA500', sideStripesColor: '#00CED1', number: '33', numberColor: '#00CED1', skinTone: '#ffe0bd', hairStyle: 'afro_70s', afroSize: 1.3, hairColor: '#5D4037', headAccessory: 'headband', hatColor: '#FFA500', socksColor: '#FFF', shoesColor: '#FFF', shortsLength: 'short' },
        { id: 'human_pip_alt', animal: 'human', name: 'Pip Black', jerseyName: 'PIP', cost: 30000, heightScale: 1.160, widthScale: 0.9, jerseyColor: '#000', shortsColor: '#000', trimColor: '#CE1141', number: '33', numberColor: '#CE1141', skinTone: '#4a3020', hairStyle: 'fade_box', hairColor: '#000', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_wade', animal: 'human', name: 'Flash', jerseyName: 'FLASH', cost: 30000, heightScale: 1.100, widthScale: 0.92, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#98002E', number: '3', numberColor: '#FFF', skinTone: '#4a3020', hairStyle: 'fade_high', hairColor: '#000', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_wade_alt', animal: 'human', name: 'Vice City', jerseyName: 'FLASH', cost: 30000, heightScale: 1.100, widthScale: 0.92, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#FF69B4', number: '3', numberColor: '#00FFFF', skinTone: '#4a3020', hairStyle: 'fade_high', hairColor: '#000', socksColor: '#00FFFF', shoesColor: '#FF69B4', beard: true },
        { id: 'human_reggie', animal: 'human', name: 'Reggie', jerseyName: 'REGGIE', cost: 25000, heightScale: 1.140, widthScale: 0.85, jerseyColor: '#002D62', shortsColor: '#002D62', pinstripesColor: '#FDB927', number: '31', numberColor: '#FDB927', skinTone: '#8d5524', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#FFF' },
        { id: 'human_reggie_alt', animal: 'human', name: 'Pinstripe', jerseyName: 'REGGIE', cost: 25000, heightScale: 1.140, widthScale: 0.85, jerseyColor: '#FDB927', shortsColor: '#FDB927', pinstripesColor: '#002D62', number: '31', numberColor: '#002D62', skinTone: '#8d5524', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#002D62' },
        { id: 'human_tmac', animal: 'human', name: 'T-Mac', jerseyName: 'T-MAC', cost: 25000, heightScale: 1.160, widthScale: 0.9, jerseyColor: '#007DC5', shortsColor: '#007DC5', pinstripesColor: '#C4CED4', number: '1', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_tmac_alt', animal: 'human', name: 'Houston', jerseyName: 'T-MAC', cost: 25000, heightScale: 1.160, widthScale: 0.9, jerseyColor: '#CE1141', shortsColor: '#CE1141', pinstripesColor: '#FFF', number: '1', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#CE1141', shoesColor: '#FFF' },
        { id: 'human_vince_legend', animal: 'human', name: 'Vinsanity', jerseyName: 'VINSANITY', cost: 30000, heightScale: 1.130, widthScale: 0.92, jerseyColor: '#753BBD', shortsColor: '#753BBD', pinstripesColor: '#CE1141', number: '15', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_vince_alt_legend', animal: 'human', name: 'Dino White', jerseyName: 'VINSANITY', cost: 30000, heightScale: 1.130, widthScale: 0.92, jerseyColor: '#FFF', shortsColor: '#FFF', pinstripesColor: '#CE1141', number: '15', numberColor: '#CE1141', skinTone: '#3e271a', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#CE1141', beard: true },
        { id: 'human_nash', animal: 'human', name: 'Captain Canada', cost: 35000, heightScale: 1.05, widthScale: 0.88, jerseyColor: '#1D1160', shortsColor: '#1D1160', sideStripesColor: '#E56020', number: '13', numberColor: '#E56020', skinTone: '#f0d5be', hairStyle: 'long_flow', hairColor: '#6B4423', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_nash_alt', animal: 'human', name: 'Dallas', jerseyName: 'STEVE', cost: 35000, heightScale: 1.05, widthScale: 0.88, jerseyColor: '#00538C', shortsColor: '#00538C', sideStripesColor: '#B8C4CA', number: '13', numberColor: '#B8C4CA', skinTone: '#f0d5be', hairStyle: 'long_flow', hairColor: '#6B4423', socksColor: '#000', shoesColor: '#FFF' },
        { id: 'human_dream', animal: 'human', name: 'The Dream', cost: 40000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#CE1141', shortsColor: '#CE1141', trimColor: '#FDB927', number: '34', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'fade_retro', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_dream_alt', animal: 'human', name: 'Pinstripe Dream', jerseyName: 'DREAM', cost: 40000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#002D62', shortsColor: '#002D62', trimColor: '#FFF', pinstripesColor: '#FFF', number: '34', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'fade_retro', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_ewing', animal: 'human', name: 'Big Pat', cost: 10500, type: 'jersey', color: '#006BB6', sleeveColor: 'none', trimColor: '#F58426', number: '33', numberColor: '#F58426', skinTone: '#3e271a', hairStyle: 'fade_box', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_ewing_alt', animal: 'human', name: 'New York White', jerseyName: 'PAT', cost: 10500, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#F58426', number: '33', numberColor: '#F58426', skinTone: '#3e271a', hairStyle: 'fade_box', hairColor: '#000', socksColor: '#FFF', shoesColor: '#F58426', shortsLength: 'short' },
        { id: 'human_zeke', animal: 'human', name: 'Zeke', cost: 35000, heightScale: 1.02, widthScale: 0.85, jerseyColor: '#006BB6', shortsColor: '#006BB6', sideStripesColor: '#ED174C', number: '11', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'fade_retro', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_zeke_alt', animal: 'human', name: 'Bad Boys', jerseyName: 'ZEKE', cost: 35000, heightScale: 1.02, widthScale: 0.85, jerseyColor: '#FFF', shortsColor: '#FFF', sideStripesColor: '#ED174C', number: '11', numberColor: '#ED174C', skinTone: '#5c3a21', hairStyle: 'fade_retro', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_glide', animal: 'human', name: 'The Glide', cost: 35000, heightScale: 1.15, widthScale: 0.92, jerseyColor: '#CE1141', shortsColor: '#CE1141', trimColor: '#000', number: '22', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', shortsLength: 'short' },
        { id: 'human_glide_alt', animal: 'human', name: 'Houston Glide', jerseyName: 'GLIDE', cost: 35000, heightScale: 1.15, widthScale: 0.92, jerseyColor: '#002D62', shortsColor: '#002D62', trimColor: '#FFF', number: '22', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'bald_clean', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_truth', animal: 'human', name: 'The Truth', cost: 30000, heightScale: 1.15, widthScale: 1.0, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#000', number: '34', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'fade_retro', headAccessory: 'headband', hairColor: '#000', headbandColor: '#007A33', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_truth_alt', animal: 'human', name: 'Brooklyn Truth', jerseyName: 'TRUTH', cost: 30000, heightScale: 1.15, widthScale: 1.0, jerseyColor: '#000', shortsColor: '#000', trimColor: '#FFF', number: '34', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'buzz_cut', hairColor: '#000', headbandColor: '#FFF', socksColor: '#000', shoesColor: '#FFF', beard: true },
        { id: 'human_shuttlesworth', animal: 'human', name: 'Jesus', cost: 30000, heightScale: 1.13, widthScale: 0.9, jerseyColor: '#007A33', shortsColor: '#007A33', trimColor: '#FFF', number: '20', numberColor: '#FFF', skinTone: '#8d5524', hairStyle: 'bald_clean', hairColor: '#000', sleeveLeft: '#007A33', socksColor: '#FFF', shoesColor: '#000' },
        { id: 'human_shuttlesworth_alt', animal: 'human', name: 'Heat Ray', jerseyName: 'JESUS', cost: 30000, heightScale: 1.13, widthScale: 0.9, jerseyColor: '#FFF', shortsColor: '#FFF', trimColor: '#CE1141', number: '34', numberColor: '#CE1141', skinTone: '#8d5524', hairStyle: 'bald_clean', hairColor: '#000', sleeveLeft: '#FFF', socksColor: '#FFF', shoesColor: '#CE1141' },
        { id: 'human_klaw', animal: 'human', name: 'The Klaw', cost: 35000, heightScale: 1.15, widthScale: 1.0, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#C4CED4', number: '2', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'cornrows_braids', hairStyle2: 'afro_mini', hairColor: '#000', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_klaw_alt', animal: 'human', name: 'North', jerseyName: 'KLAW', cost: 35000, heightScale: 1.15, widthScale: 1.0, jerseyColor: '#CE1141', shortsColor: '#CE1141', sideStripesColor: '#000', number: '2', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'cornrows_braids', hairStyle2: 'afro_mini', hairColor: '#000', socksColor: '#CE1141', shoesColor: '#000', beard: true },
        { id: 'human_wemby', animal: 'human', name: 'L\'Alien', cost: 35000, heightScale: 1.30, widthScale: 0.85, armWidthScale: 0.8, legWidthScale: 0.8, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#C4CED4', number: '1', numberColor: '#FFF', skinTone: '#8d5524', hairStyle: 'fade_high', hairColor: '#000', socksColor: '#000', shoesColor: '#000' },
        { id: 'human_wemby_alt', animal: 'human', name: 'France', jerseyName: 'ALIEN', cost: 35000, heightScale: 1.30, widthScale: 0.85, armWidthScale: 0.8, legWidthScale: 0.8, jerseyColor: '#002654', shortsColor: '#002654', sideStripesColor: '#ED2939', number: '32', numberColor: '#FFF', skinTone: '#8d5524', hairStyle: 'fade_high', hairColor: '#000', socksColor: '#FFF', shoesColor: '#ED2939' },
        { id: 'human_sga', animal: 'human', name: 'SGA', cost: 30000, heightScale: 1.14, widthScale: 0.9, jerseyColor: '#007AC1', shortsColor: '#007AC1', sideStripesColor: '#EF3B24', number: '2', numberColor: '#EF3B24', skinTone: '#5c3a21', hairStyle: 'braids_zigzag', hairColor: '#000', headbandColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_sga_alt', animal: 'human', name: 'Canada', jerseyName: 'SHAI', cost: 30000, heightScale: 1.14, widthScale: 0.9, jerseyColor: '#CE1126', shortsColor: '#CE1126', sideStripesColor: '#FFF', number: '2', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'braids_zigzag', hairColor: '#000', headbandColor: '#CE1126', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_brow', animal: 'human', name: 'The Brow', cost: 30000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#FDB927', shortsColor: '#FDB927', sideStripesColor: '#552583', number: '3', numberColor: '#552583', skinTone: '#5c3a21', hairStyle: 'afro_mini', afroSize: 1.1, hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true, beardBig: true },
        { id: 'human_brow_alt', animal: 'human', name: 'NOLA', jerseyName: 'BROW', cost: 30000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#002B5C', shortsColor: '#002B5C', sideStripesColor: '#B4975A', number: '23', numberColor: '#B4975A', skinTone: '#5c3a21', hairStyle: 'afro_mini', afroSize: 1.1, hairColor: '#000', beard: true, beardBig: true, socksColor: '#FFF', shoesColor: '#002B5C' },
        { id: 'human_brow_wiz', animal: 'human', name: 'The Trade', jerseyName: 'BROW', cost: 30000, heightScale: 1.21, widthScale: 0.95, jerseyColor: '#002B5C', shortsColor: '#002B5C', sideStripesColor: '#E31837', number: '23', numberColor: '#FFF', skinTone: '#5c3a21', hairStyle: 'afro_mini', afroSize: 1.1, hairColor: '#000', beard: true, beardBig: true, socksColor: '#FFF', shoesColor: '#E31837' },
        { id: 'human_kyrie', animal: 'human', name: 'Uncle Drew', cost: 30000, heightScale: 1.04, widthScale: 0.9, jerseyColor: '#00538C', shortsColor: '#00538C', sideStripesColor: '#B8C4CA', number: '11', numberColor: '#FFF', skinTone: '#8d5524', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_kyrie_alt', animal: 'human', name: 'The Land', jerseyName: 'UNCLE DREW', cost: 30000, heightScale: 1.04, widthScale: 0.9, jerseyColor: '#6F263D', shortsColor: '#6F263D', sideStripesColor: '#FDB927', number: '2', numberColor: '#FDB927', skinTone: '#8d5524', hairStyle: 'curly_top_fade', hairColor: '#000', beard: true, socksColor: '#6F263D', shoesColor: '#FDB927' },
        { id: 'human_dame', animal: 'human', name: 'Dame Time', cost: 30000, heightScale: 1.04, widthScale: 0.95, jerseyColor: '#000', shortsColor: '#000', pinstripesColor: '#CE1141', number: '0', numberColor: '#CE1141', skinTone: '#5c3a21', hairStyle: 'fade_low', hairColor: '#000', sleeveLeft: '#000', socksColor: '#000', shoesColor: '#000', tattoos: true, beard: true },
        { id: 'human_dame_alt', animal: 'human', name: 'Rip City', jerseyName: 'DAME', cost: 30000, heightScale: 1.04, widthScale: 0.95, jerseyColor: '#FFF', shortsColor: '#FFF', pinstripesColor: '#CE1141', number: '0', numberColor: '#CE1141', skinTone: '#5c3a21', hairStyle: 'fade_low', hairColor: '#000', sleeveLeft: '#FFF', socksColor: '#FFF', shoesColor: '#CE1141', tattoos: true, beard: true },
        { id: 'human_process', animal: 'human', name: 'The Process', cost: 30000, heightScale: 1.25, widthScale: 1.1, jerseyColor: '#006BB6', shortsColor: '#006BB6', trimColor: '#ED174C', number: '21', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'fade_chef', hairColor: '#000', socksColor: '#FFF', shoesColor: '#000', beard: true },
        { id: 'human_wade_legend', animal: 'human', name: 'Flash', jerseyName: 'FLASH', cost: 30000, heightScale: 1.100, widthScale: 0.92, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#98002E', number: '3', numberColor: '#FFF', skinTone: '#4a3020', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#000', shoesColor: '#000', beard: true },
        { id: 'human_wade_alt_legend', animal: 'human', name: 'Vice City', jerseyName: 'FLASH', cost: 30000, heightScale: 1.100, widthScale: 0.92, jerseyColor: '#000', shortsColor: '#000', sideStripesColor: '#FF69B4', number: '3', numberColor: '#00FFFF', skinTone: '#4a3020', hairStyle: 'fade_low', hairColor: '#000', socksColor: '#00FFFF', shoesColor: '#FF69B4', beard: true },
        { id: 'human_process_alt', animal: 'human', name: 'Kansas', jerseyName: 'PROCESS', cost: 30000, heightScale: 1.25, widthScale: 1.1, jerseyColor: '#0051BA', shortsColor: '#0051BA', trimColor: '#E8000D', number: '21', numberColor: '#FFF', skinTone: '#3e271a', hairStyle: 'buzz_cut', hairColor: '#000', beard: true, socksColor: '#FFF', shoesColor: '#0051BA' },
        { id: 'human_anchor', animal: 'human', name: 'The Anchor', cost: 500, heightScale: 1.06, widthScale: 1.05, jerseyColor: '#800020', shortsColor: '#800020', legType: 'pants', sleeveColor: '#800020', hairStyle: 'anchor_man_80s', hairColor: '#5D4037', skinTone: '#f0d5be', shoesColor: '#333', pattern: 'suit_jacket', jerseyType: 'tshirt' },
        { id: 'human_waluigi', animal: 'human', name: 'Mauvais Perdant', cost: 15000, heightScale: 1.2, widthScale: 0.8, jerseyColor: '#800080', shortsColor: '#000', clothingDetail: 'overalls', headAccessory: 'hat', hatColor: '#800080', skinTone: '#ffe0bd', hairStyle: 'default', hairColor: '#333', shoesColor: '#FFA500' },
        { id: 'human_potter', animal: 'human', name: 'Sorcier Lunettes', cost: 15000, jerseyColor: '#111', shortsColor: '#111', legType: 'pants', skinTone: '#ffe0bd', backAccessory: 'cape', backColor: '#111', headAccessory: 'scarf', hatColor: '#8B0000', shoesColor: '#000', hairStyle: 'shaggy_top', hairColor: '#000' },
        { id: 'human_mario', animal: 'human', name: 'Plombier Rouge', cost: 15000, heightScale: 0.9, widthScale: 1.1, jerseyColor: '#FF0000', shortsColor: '#0000FF', clothingDetail: 'overalls', headAccessory: 'hat', hatColor: '#FF0000', skinTone: '#ffe0bd', hairStyle: 'default', hairColor: '#333', shoesColor: '#8B4513' },
        { id: 'human_luigi', animal: 'human', name: 'Plombier Vert', cost: 15000, heightScale: 1.1, widthScale: 0.9, jerseyColor: '#008000', shortsColor: '#0000FF', clothingDetail: 'overalls', headAccessory: 'hat', hatColor: '#008000', skinTone: '#ffe0bd', hairStyle: 'default', hairColor: '#333', shoesColor: '#8B4513' },
        { id: 'human_wario', animal: 'human', name: 'Mauvais Gagnant', cost: 15000, heightScale: 1.0, widthScale: 1.3, jerseyColor: '#FFFF00', shortsColor: '#800080', clothingDetail: 'overalls', headAccessory: 'hat', hatColor: '#FFFF00', skinTone: '#ffe0bd', hairStyle: 'default', hairColor: '#333', shoesColor: '#008000' },
        { id: 'human_peach', animal: 'human', name: 'Princesse Rose', cost: 15000, heightScale: 1.0, widthScale: 0.9, jerseyColor: '#FFC0CB', shortsColor: '#FF69B4', legType: 'tights', headAccessory: 'crown', hatColor: '#FFD700', skinTone: '#ffe0bd', hairStyle: 'long_flow', hairColor: '#FFD700', shoesColor: '#FF1493' },
        { id: 'human_link', animal: 'human', name: 'Héros du Temps', cost: 15000, heightScale: 1.0, widthScale: 0.95, jerseyColor: '#008000', shortsColor: '#F5F5DC', legType: 'tights', headAccessory: 'hat', hatColor: '#008000', skinTone: '#ffe0bd', backProp: 'sword', hairStyle: 'long_flow', hairColor: '#FFD700', shoesColor: '#8B4513' },

    ];

    var CLOTHING_DB = [
        { id: 'clothes_none', name: 'Aucun (Défaut)', cost: 0, type: 'none' },

        // TRACK SUITS (Manches longues, col montant)
        { id: 'track_red', name: 'Track Rouge', cost: 500, type: 'track', color: '#FF0000', sleeveColor: '#FF0000', stripeColor: '#FFF' },
        { id: 'track_blue', name: 'Track Bleu', cost: 500, type: 'track', color: '#0000FF', sleeveColor: '#0000FF', stripeColor: '#FFF' },
        { id: 'track_black', name: 'Track Noir', cost: 750, type: 'track', color: '#1a1a1a', sleeveColor: '#1a1a1a', stripeColor: '#FFF' },
        { id: 'track_green', name: 'Track Vert', cost: 500, type: 'track', color: '#008000', sleeveColor: '#008000', stripeColor: '#FFF' },
        { id: 'track_adidas', name: 'Slav King', cost: 2000, type: 'track', color: '#000', sleeveColor: '#000', stripeColor: '#FFF', pattern: 'stripes_side' },

        // HOODIES (Capuchon dans le dos)
        { id: 'hoodie_grey', name: 'Hoodie Gris', cost: 1000, type: 'hoodie', color: '#808080', sleeveColor: '#808080', hoodColor: '#707070' },
        { id: 'hoodie_black', name: 'Hoodie Noir', cost: 1500, type: 'hoodie', color: '#111', sleeveColor: '#111', hoodColor: '#000' },
        { id: 'hoodie_orange', name: 'Kenny', cost: 2000, type: 'hoodie', color: '#FF4500', sleeveColor: '#FF4500', hoodColor: '#CD3700' },
        { id: 'hoodie_tie_dye', name: 'Hippie', cost: 2500, type: 'hoodie', color: '#FF00FF', sleeveColor: '#00FFFF', hoodColor: '#FFFF00', pattern: 'tie_dye' },
        { id: 'hoodie_camo', name: 'Camouflage', cost: 3000, type: 'hoodie', color: '#556B2F', sleeveColor: '#556B2F', hoodColor: '#4b5e29', pattern: 'camo' },

        // SWEATSHIRTS (Simple, manches longues)
        { id: 'sweat_white', name: 'Sweat Blanc', cost: 750, type: 'sweatshirt', color: '#FFF', sleeveColor: '#FFF' },
        { id: 'sweat_navy', name: 'Sweat Marine', cost: 750, type: 'sweatshirt', color: '#000080', sleeveColor: '#000080' },
        { id: 'sweat_nasa', name: 'Espace', cost: 2000, type: 'sweatshirt', color: '#FFF', sleeveColor: '#FFF', decal: 'nasa' },

        // T-SHIRTS (Manches courtes)
        { id: 'tshirt_tiedye', name: 'T-Shirt Fun', cost: 1000, type: 'tshirt', color: '#FFD700', sleeveColor: '#FFD700', pattern: 'tie_dye' },
        { id: 'tshirt_rock', name: 'Groupe Rock', cost: 1500, type: 'tshirt', color: '#111', sleeveColor: '#111', decal: 'skull' },

        // JERSEYS (Over-top layer)
        { id: 'jersey_bulls', name: 'Chicago Red', cost: 5000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', trimColor: '#000' },
        { id: 'jersey_lakers', name: 'LA Gold', cost: 5000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', trimColor: '#552583' },
        { id: 'jersey_celtics', name: 'Boston Green', cost: 5000, type: 'jersey', color: '#007A33', sleeveColor: 'none', trimColor: '#FFF' },
        { id: 'jersey_miami', name: 'Vice City', cost: 5000, type: 'jersey', color: '#000', sleeveColor: 'none', trimColor: '#FF69B4', pattern: 'gradient_blue_pink' },
        { id: 'jersey_raptors', name: 'We The North', cost: 5000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', trimColor: '#000', chevron: true },
        { id: 'jersey_memphis', name: 'Grizzlies', cost: 5000, type: 'jersey', color: '#00FFFF', sleeveColor: 'none', trimColor: '#000' },
        { id: 'jersey_tune', name: 'Tune Squad', cost: 7500, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#0000FF', decal: 'bullseye' },
        { id: 'jersey_monstars', name: 'Monstars', cost: 7500, type: 'jersey', color: '#000', sleeveColor: 'none', trimColor: '#800080' },
        { id: 'tank_camo', name: 'Débardeur Camo', cost: 1500, type: 'tank', color: '#556B2F', pattern: 'camo' },
        { id: 'tank_beach', name: 'Plage', cost: 1500, type: 'tank', color: '#FFD700', pattern: 'floral' },
        { id: 'shirt_hawaiian', name: 'Chemise Hawaïenne', cost: 2500, type: 'shirt', color: '#00FFFF', pattern: 'floral' },
        { id: 'shirt_tuxedo', name: 'Smoking', cost: 5000, type: 'shirt', color: '#000', pattern: 'suit' },
        { id: 'hoodie_galaxy', name: 'Galaxie', cost: 3500, type: 'hoodie', color: '#4B0082', hoodColor: '#8A2BE2', pattern: 'galaxy' },
        { id: 'tshirt_8bit', name: 'Rétro 8-Bit', cost: 2000, type: 'tshirt', color: '#333', decal: 'pixel_heart' },
        { id: 'poncho', name: 'Poncho', cost: 3000, type: 'poncho', color: '#8B4513', pattern: 'striped' },
        { id: 'clothing_legend_wall', name: 'Maillot SPEEDY', cost: 2000, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#E31837', sideStripesColor: '#002B5C', number: '2', numberColor: '#E31837' },
        { id: 'clothing_legend_wall_alt', name: 'Maillot D.C.', cost: 2000, type: 'jersey', color: '#E31837', sleeveColor: 'none', trimColor: '#002B5C', sideStripesColor: '#FFF', number: '2', numberColor: '#FFF' },
        { id: 'clothing_legend_wall_rookie', name: 'Maillot ROOKIE', cost: 4000, type: 'jersey', color: '#002B5C', sleeveColor: 'none', trimColor: '#C4A006', number: '2', numberColor: '#C4A006' },
        { id: 'clothing_legend_lebron', name: 'Maillot THE KING', cost: 10000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', sideStripesColor: '#552583', number: '23', numberColor: '#552583' },
        { id: 'clothing_legend_lebron_alt', name: 'Maillot KING', cost: 10000, type: 'jersey', color: '#000', sleeveColor: 'none', sideStripesColor: '#E31837', number: '6', numberColor: '#FFF' },
        { id: 'clothing_legend_lebron_cavs', name: 'Maillot KING', cost: 12000, type: 'jersey', color: '#6F263D', sleeveColor: 'none', trimColor: '#FFB81C', number: '23', numberColor: '#FFB81C' },
        { id: 'clothing_legend_kobe8', name: 'Maillot FROBE', cost: 12000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', sideStripesColor: '#552583', number: '8', numberColor: '#552583' },
        { id: 'clothing_legend_kobe8_alt', name: 'Maillot MAMBA', cost: 12000, type: 'jersey', color: '#552583', sleeveColor: 'none', sideStripesColor: '#FDB927', number: '8', numberColor: '#FFF' },
        { id: 'clothing_legend_kobe24', name: 'Maillot MAMBA', cost: 12000, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#552583', number: '24', numberColor: '#552583' },
        { id: 'clothing_legend_kobe24_alt', name: 'Maillot EIGHT', cost: 12000, type: 'jersey', color: '#000', sleeveColor: 'none', trimColor: '#FDB927', number: '24', numberColor: '#FDB927' },
        { id: 'clothing_legend_curry', name: 'Maillot CHEF', cost: 12000, type: 'jersey', color: '#1D428A', sleeveColor: 'none', trimColor: '#FFC72C', number: '30', numberColor: '#FFC72C' },
        { id: 'clothing_legend_curry_alt', name: 'Maillot CHEF', cost: 12000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', trimColor: '#1D428A', number: '30', numberColor: '#1D428A' },
        { id: 'clothing_legend_magic', name: 'Maillot MAGIC', cost: 12000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', sideStripesColor: '#552583', number: '32', numberColor: '#552583' },
        { id: 'clothing_legend_magic_alt', name: 'Maillot MAGIC', cost: 12000, type: 'jersey', color: '#552583', sleeveColor: 'none', sideStripesColor: '#FDB927', number: '32', numberColor: '#FFF' },
        { id: 'clothing_legend_drj', name: 'Maillot DOCTOR', cost: 14000, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#ED174C', number: '32', numberColor: '#ED174C' },
        { id: 'clothing_legend_drj_alt', name: 'Maillot DOCTOR', cost: 14000, type: 'jersey', color: '#00285E', sleeveColor: 'none', trimColor: '#E31837', number: '32', numberColor: '#FFF' },
        { id: 'clothing_legend_wilt', name: 'Maillot STILT', cost: 16000, type: 'jersey', color: '#552583', sleeveColor: 'none', sideStripesColor: '#FDB927', number: '13', numberColor: '#FFF' },
        { id: 'clothing_legend_wilt_alt', name: 'Maillot THE STILT', cost: 16000, type: 'jersey', color: '#FFF', sleeveColor: 'none', sideStripesColor: '#000', number: '13', numberColor: '#000' },
        { id: 'clothing_legend_mj', name: 'Maillot G.O.A.T.', cost: 20000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', trimColor: '#000', number: '23', numberColor: '#000' },
        { id: 'clothing_legend_mj_alt', name: 'Maillot G.O.A.T.', cost: 20000, type: 'jersey', color: '#000', sleeveColor: 'none', number: '23', numberColor: '#CE1141', pinstripesColor: '#CE1141' },
        { id: 'clothing_legend_mj_wiz', name: 'Maillot G.O.A.T.', cost: 16000, type: 'jersey', color: '#002B5C', sleeveColor: 'none', trimColor: '#C4A006', number: '23', numberColor: '#FFF' },
        { id: 'clothing_legend_bird', name: 'Maillot LEGEND', cost: 16000, type: 'jersey', color: '#007A33', sleeveColor: 'none', trimColor: '#FFF', number: '33', numberColor: '#FFF' },
        { id: 'clothing_legend_bird_alt', name: 'Maillot LEGEND', cost: 16000, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#007A33', number: '33', numberColor: '#007A33' },
        { id: 'clothing_legend_shaq', name: 'Maillot DIESEL', cost: 16000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', sideStripesColor: '#552583', number: '34', numberColor: '#552583' },
        { id: 'clothing_legend_shaq_alt', name: 'Maillot DIESEL', cost: 16000, type: 'jersey', color: '#000', sleeveColor: 'none', number: '32', numberColor: '#FFF', pinstripesColor: '#FFF' },
        { id: 'clothing_legend_shaq_magic', name: 'Maillot DIESEL', cost: 14000, type: 'jersey', color: '#0077C0', sleeveColor: 'none', number: '32', numberColor: '#FFF', pinstripesColor: '#FFF' },
        { id: 'clothing_legend_ai', name: 'Maillot ANSWER', cost: 14000, type: 'jersey', color: '#000', sleeveColor: 'none', trimColor: '#ED174C', number: '3', numberColor: '#FFF' },
        { id: 'clothing_legend_ai_alt', name: 'Maillot ANSWER', cost: 14000, type: 'jersey', color: '#418FDE', sleeveColor: 'none', trimColor: '#FDB927', number: '3', numberColor: '#FFF' },
        { id: 'clothing_legend_duncan', name: 'Maillot FUNDAMENTAL', cost: 14000, type: 'jersey', color: '#000', sleeveColor: 'none', trimColor: '#C4CED4', number: '21', numberColor: '#FFF' },
        { id: 'clothing_legend_duncan_alt', name: 'Maillot TIMMY', cost: 14000, type: 'jersey', color: '#C4CED4', sleeveColor: 'none', trimColor: '#000', number: '21', numberColor: '#000' },
        { id: 'clothing_legend_rodman', name: 'Maillot WORM', cost: 12000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', trimColor: '#000', number: '91', numberColor: '#000' },
        { id: 'clothing_legend_rodman_alt', name: 'Maillot WORM', cost: 12000, type: 'jersey', color: '#00519E', sleeveColor: 'none', trimColor: '#E31837', number: '10', numberColor: '#FFF' },
        { id: 'clothing_legend_barkley', name: 'Maillot SIR CHARLES', cost: 12000, type: 'jersey', color: '#1D1160', sleeveColor: 'none', sideStripesColor: '#E56020', number: '34', numberColor: '#E56020' },
        { id: 'clothing_legend_barkley_alt', name: 'Maillot CHUCK', cost: 12000, type: 'jersey', color: '#FFF', sleeveColor: 'none', sideStripesColor: '#CE1141', number: '34', numberColor: '#CE1141' },
        { id: 'clothing_legend_dirk', name: 'Maillot GERMAN', cost: 12000, type: 'jersey', color: '#00538C', sleeveColor: 'none', sideStripesColor: '#B8C4CA', number: '41', numberColor: '#FFF' },
        { id: 'clothing_legend_dirk_alt', name: 'Maillot DIRK', cost: 12000, type: 'jersey', color: '#007A33', sleeveColor: 'none', sideStripesColor: '#00538C', number: '41', numberColor: '#FFF' },
        { id: 'clothing_legend_giannis', name: 'Maillot FREAK', cost: 10000, type: 'jersey', color: '#00471B', sleeveColor: 'none', sideStripesColor: '#EEE1C6', number: '34', numberColor: '#EEE1C6' },
        { id: 'clothing_legend_giannis_alt', name: 'Maillot FREAK', cost: 10000, type: 'jersey', color: '#EEE1C6', sleeveColor: 'none', sideStripesColor: '#00471B', number: '34', numberColor: '#00471B' },
        { id: 'clothing_legend_joker', name: 'Maillot JOKER', cost: 10000, type: 'jersey', color: '#0E2240', sleeveColor: 'none', trimColor: '#FEC524', number: '15', numberColor: '#FEC524' },
        { id: 'clothing_legend_joker_alt', name: 'Maillot JOKER', cost: 10000, type: 'jersey', color: '#FFF', sleeveColor: 'none', sideStripesColor: '#FF0000', number: '15', numberColor: '#FEC524' },
        { id: 'clothing_legend_luka', name: 'Maillot MAGIC', cost: 10000, type: 'jersey', color: '#00538C', sleeveColor: 'none', sideStripesColor: '#B8C4CA', number: '77', numberColor: '#FFF' },
        { id: 'clothing_legend_luka_alt', name: 'Maillot LUKA', cost: 10000, type: 'jersey', color: '#FFF', sleeveColor: 'none', sideStripesColor: '#00C1D4', number: '7', numberColor: '#00C1D4' },
        { id: 'clothing_legend_kd', name: 'Maillot REAPER', cost: 12000, type: 'jersey', color: '#1D1160', sleeveColor: 'none', sideStripesColor: '#E56020', number: '35', numberColor: '#E56020' },
        { id: 'clothing_legend_kd_alt', name: 'Maillot SLIM', cost: 12000, type: 'jersey', color: '#00653A', sleeveColor: 'none', sideStripesColor: '#FFC200', number: '35', numberColor: '#FFC200' },
        { id: 'clothing_legend_harden', name: 'Maillot BEARD', cost: 10000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', sideStripesColor: '#FFF', number: '13', numberColor: '#FFF' },
        { id: 'clothing_legend_harden_alt', name: 'Maillot BEARD', cost: 10000, type: 'jersey', color: '#000', sleeveColor: 'none', sideStripesColor: '#FFF', number: '13', numberColor: '#FFF' },
        { id: 'clothing_legend_vince', name: 'Maillot VINSANITY', cost: 12000, type: 'jersey', color: '#753BBD', sleeveColor: 'none', number: '15', numberColor: '#FFF', pinstripesColor: '#CE1141' },
        { id: 'clothing_legend_vince_alt', name: 'Maillot VINSANITY', cost: 12000, type: 'jersey', color: '#FFF', sleeveColor: 'none', number: '15', numberColor: '#CE1141', pinstripesColor: '#CE1141' },
        { id: 'clothing_legend_kareem', name: 'Maillot CAP', cost: 18000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', sideStripesColor: '#552583', number: '33', numberColor: '#552583' },
        { id: 'clothing_legend_kareem_alt', name: 'Maillot CAP', cost: 18000, type: 'jersey', color: '#00471B', sleeveColor: 'none', sideStripesColor: '#EEE1C6', number: '33', numberColor: '#EEE1C6' },
        { id: 'clothing_legend_russell', name: 'Maillot BILL', cost: 20000, type: 'jersey', color: '#007A33', sleeveColor: 'none', trimColor: '#FFF', number: '6', numberColor: '#FFF' },
        { id: 'clothing_legend_russell_alt', name: 'Maillot BILL', cost: 20000, type: 'jersey', color: '#007A33', sleeveColor: 'none', trimColor: '#FFF', number: '6', numberColor: '#FFF' },
        { id: 'clothing_legend_jackie', name: 'Maillot MOON', cost: 200, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#FFA500', sideStripesColor: '#00CED1', number: '33', numberColor: '#00CED1' },
        { id: 'clothing_legend_pip_alt', name: 'Maillot PIP', cost: 12000, type: 'jersey', color: '#000', sleeveColor: 'none', trimColor: '#CE1141', number: '33', numberColor: '#CE1141' },
        { id: 'clothing_legend_wade', name: 'Maillot FLASH', cost: 12000, type: 'jersey', color: '#000', sleeveColor: 'none', sideStripesColor: '#98002E', number: '3', numberColor: '#FFF' },
        { id: 'clothing_legend_wade_alt', name: 'Maillot FLASH', cost: 12000, type: 'jersey', color: '#000', sleeveColor: 'none', sideStripesColor: '#FF69B4', number: '3', numberColor: '#00FFFF' },
        { id: 'clothing_legend_reggie', name: 'Maillot REGGIE', cost: 10000, type: 'jersey', color: '#002D62', sleeveColor: 'none', number: '31', numberColor: '#FDB927', pinstripesColor: '#FDB927' },
        { id: 'clothing_legend_reggie_alt', name: 'Maillot REGGIE', cost: 10000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', number: '31', numberColor: '#002D62', pinstripesColor: '#002D62' },
        { id: 'clothing_legend_tmac', name: 'Maillot T-MAC', cost: 10000, type: 'jersey', color: '#007DC5', sleeveColor: 'none', number: '1', numberColor: '#FFF', pinstripesColor: '#C4CED4' },
        { id: 'clothing_legend_tmac_alt', name: 'Maillot T-MAC', cost: 10000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', number: '1', numberColor: '#FFF', pinstripesColor: '#FFF' },
        { id: 'clothing_legend_kg', name: 'Maillot TICKET', cost: 12000, type: 'jersey', color: '#005083', sleeveColor: 'none', trimColor: '#78BE20', number: '21', numberColor: '#FFF' },
        { id: 'clothing_legend_kg_alt', name: 'Maillot TICKET', cost: 12000, type: 'jersey', color: '#007A33', sleeveColor: 'none', trimColor: '#FFF', number: '5', numberColor: '#FFF' },
        { id: 'clothing_legend_nash', name: 'Maillot Captain Canada', cost: 14000, type: 'jersey', color: '#1D1160', sleeveColor: 'none', sideStripesColor: '#E56020', number: '13', numberColor: '#E56020' },
        { id: 'clothing_legend_nash_alt', name: 'Maillot STEVE', cost: 14000, type: 'jersey', color: '#00538C', sleeveColor: 'none', sideStripesColor: '#B8C4CA', number: '13', numberColor: '#B8C4CA' },
        { id: 'clothing_legend_dream', name: 'Maillot The Dream', cost: 16000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', trimColor: '#FDB927', number: '34', numberColor: '#FFF' },
        { id: 'clothing_legend_dream_alt', name: 'Maillot DREAM', cost: 16000, type: 'jersey', color: '#002D62', sleeveColor: 'none', trimColor: '#FFF', number: '34', numberColor: '#FFF', pinstripesColor: '#FFF' },
        { id: 'clothing_legend_ewing', name: 'Maillot Big Pat', cost: 14000, type: 'jersey', color: '#006BB6', sleeveColor: 'none', trimColor: '#F58426', number: '33', numberColor: '#F58426' },
        { id: 'clothing_legend_ewing_alt', name: 'Maillot PAT', cost: 14000, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#F58426', number: '33', numberColor: '#F58426' },
        { id: 'clothing_legend_zeke', name: 'Maillot Zeke', cost: 14000, type: 'jersey', color: '#006BB6', sleeveColor: 'none', sideStripesColor: '#ED174C', number: '11', numberColor: '#FFF' },
        { id: 'clothing_legend_zeke_alt', name: 'Maillot ZEKE', cost: 14000, type: 'jersey', color: '#FFF', sleeveColor: 'none', sideStripesColor: '#ED174C', number: '11', numberColor: '#ED174C' },
        { id: 'clothing_legend_glide', name: 'Maillot The Glide', cost: 14000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', trimColor: '#000', number: '22', numberColor: '#FFF' },
        { id: 'clothing_legend_glide_alt', name: 'Maillot GLIDE', cost: 14000, type: 'jersey', color: '#002D62', sleeveColor: 'none', trimColor: '#FFF', number: '22', numberColor: '#FFF' },
        { id: 'clothing_legend_truth', name: 'Maillot The Truth', cost: 12000, type: 'jersey', color: '#007A33', sleeveColor: 'none', trimColor: '#000', number: '34', numberColor: '#FFF' },
        { id: 'clothing_legend_truth_alt', name: 'Maillot TRUTH', cost: 12000, type: 'jersey', color: '#000', sleeveColor: 'none', trimColor: '#FFF', number: '34', numberColor: '#FFF' },
        { id: 'clothing_legend_shuttlesworth', name: 'Maillot Jesus', cost: 12000, type: 'jersey', color: '#007A33', sleeveColor: 'none', trimColor: '#FFF', number: '20', numberColor: '#FFF' },
        { id: 'clothing_legend_shuttlesworth_alt', name: 'Maillot JESUS', cost: 12000, type: 'jersey', color: '#FFF', sleeveColor: 'none', trimColor: '#CE1141', number: '34', numberColor: '#CE1141' },
        { id: 'clothing_legend_klaw', name: 'Maillot The Klaw', cost: 14000, type: 'jersey', color: '#000', sleeveColor: 'none', sideStripesColor: '#C4CED4', number: '2', numberColor: '#FFF' },
        { id: 'clothing_legend_klaw_alt', name: 'Maillot KLAW', cost: 14000, type: 'jersey', color: '#CE1141', sleeveColor: 'none', sideStripesColor: '#000', number: '2', numberColor: '#FFF' },
        { id: 'clothing_legend_wemby', name: 'Maillot L', cost: 14000, type: 'jersey', color: '#000', sleeveColor: 'none', sideStripesColor: '#C4CED4', number: '1', numberColor: '#FFF' },
        { id: 'clothing_legend_wemby_alt', name: 'Maillot ALIEN', cost: 14000, type: 'jersey', color: '#002654', sleeveColor: 'none', sideStripesColor: '#ED2939', number: '32', numberColor: '#FFF' },
        { id: 'clothing_legend_sga', name: 'Maillot SGA', cost: 12000, type: 'jersey', color: '#007AC1', sleeveColor: 'none', sideStripesColor: '#EF3B24', number: '2', numberColor: '#EF3B24' },
        { id: 'clothing_legend_sga_alt', name: 'Maillot SHAI', cost: 12000, type: 'jersey', color: '#CE1126', sleeveColor: 'none', sideStripesColor: '#FFF', number: '2', numberColor: '#FFF' },
        { id: 'clothing_legend_brow', name: 'Maillot The Brow', cost: 12000, type: 'jersey', color: '#FDB927', sleeveColor: 'none', sideStripesColor: '#552583', number: '3', numberColor: '#552583' },
        { id: 'clothing_legend_brow_alt', name: 'Maillot BROW', cost: 12000, type: 'jersey', color: '#002B5C', sleeveColor: 'none', sideStripesColor: '#B4975A', number: '23', numberColor: '#B4975A' },
        { id: 'clothing_legend_brow_wiz', name: 'Maillot BROW', cost: 12000, type: 'jersey', color: '#002B5C', sleeveColor: 'none', sideStripesColor: '#E31837', number: '23', numberColor: '#FFF' },
        { id: 'clothing_legend_kyrie', name: 'Maillot Uncle Drew', cost: 12000, type: 'jersey', color: '#00538C', sleeveColor: 'none', sideStripesColor: '#B8C4CA', number: '11', numberColor: '#FFF' },
        { id: 'clothing_legend_kyrie_alt', name: 'Maillot UNCLE DREW', cost: 12000, type: 'jersey', color: '#6F263D', sleeveColor: 'none', sideStripesColor: '#FDB927', number: '2', numberColor: '#FDB927' },
        { id: 'clothing_legend_dame', name: 'Maillot Dame Time', cost: 12000, type: 'jersey', color: '#000', sleeveColor: 'none', number: '0', numberColor: '#CE1141', pinstripesColor: '#CE1141' },
        { id: 'clothing_legend_dame_alt', name: 'Maillot DAME', cost: 12000, type: 'jersey', color: '#FFF', sleeveColor: 'none', number: '0', numberColor: '#CE1141', pinstripesColor: '#CE1141' },
        { id: 'clothing_legend_tatum', name: 'Maillot Taco Jay', cost: 12000, type: 'jersey', color: '#007A33', sleeveColor: 'none', trimColor: '#FFF', number: '0', numberColor: '#FFF' },
        { id: 'clothing_legend_tatum_alt', name: 'Maillot TACO JAY', cost: 12000, type: 'jersey', color: '#003087', sleeveColor: 'none', trimColor: '#FFF', number: '0', numberColor: '#FFF' },
        { id: 'clothing_legend_process', name: 'Maillot The Process', cost: 12000, type: 'jersey', color: '#006BB6', sleeveColor: 'none', trimColor: '#ED174C', number: '21', numberColor: '#FFF' },
        { id: 'clothing_legend_process_alt', name: 'Maillot PROCESS', cost: 12000, type: 'jersey', color: '#0051BA', sleeveColor: 'none', trimColor: '#E8000D', number: '21', numberColor: '#FFF' },
        { id: 'hoodie_camo_green', name: 'Hoodie Camo Jungle', cost: 3500, type: 'hoodie', color: '#556B2F', pattern: 'camo', sleeveColor: '#556B2F' },
        { id: 'hoodie_camo_desert', name: 'Hoodie Camo Sable', cost: 3500, type: 'hoodie', color: '#D2B48C', pattern: 'camo', sleeveColor: '#D2B48C' },
        { id: 'track_camo_urban', name: 'Track Camo Urbain', cost: 4000, type: 'track', color: '#808080', pattern: 'camo', sleeveColor: '#808080' },
        { id: 'tank_camo_blue', name: 'Tank Camo Marine', cost: 2000, type: 'tank', color: '#000080', pattern: 'camo' },
        { id: 'hoodie_galaxy_purple', name: 'Hoodie Nebuleuse', cost: 5000, type: 'hoodie', color: '#4B0082', pattern: 'galaxy', sleeveColor: '#4B0082' },
        { id: 'sweat_galaxy_black', name: 'Sweat Espace', cost: 4500, type: 'sweatshirt', color: '#000', pattern: 'galaxy', sleeveColor: '#000' },
        { id: 'jersey_galaxy', name: 'Maillot Galactique', cost: 6000, type: 'jersey', color: '#191970', pattern: 'galaxy', sleeveColor: 'none', trimColor: '#FFF' },
        { id: 'hoodie_tiedye_rainbow', name: 'Hoodie Woodstock', cost: 4000, type: 'hoodie', color: '#FFF', pattern: 'tie_dye', sleeveColor: '#FFF' },
        { id: 'tank_tiedye_peace', name: 'Tank Peace', cost: 2500, type: 'tank', color: '#FFF', pattern: 'tie_dye' },
        { id: 'shirt_tiedye_trippy', name: 'Chemise Trippy', cost: 3500, type: 'shirt', color: '#FFF', pattern: 'tie_dye' },
        { id: 'track_slav_red', name: 'Track Russe Rouge', cost: 3000, type: 'track', color: '#CC0000', stripeColor: '#FFF', pattern: 'stripes_side', sleeveColor: '#CC0000' },
        { id: 'track_slav_blue', name: 'Track Russe Bleu', cost: 3000, type: 'track', color: '#0000CC', stripeColor: '#FFF', pattern: 'stripes_side', sleeveColor: '#0000CC' },
        { id: 'track_slav_green', name: 'Track Russe Vert', cost: 3000, type: 'track', color: '#006400', stripeColor: '#FFF', pattern: 'stripes_side', sleeveColor: '#006400' },
        { id: 'track_slav_grey', name: 'Track Russe Gris', cost: 3000, type: 'track', color: '#808080', stripeColor: '#000', pattern: 'stripes_side', sleeveColor: '#808080' },
        { id: 'track_slav_gold', name: 'Track Russe Or', cost: 10000, type: 'track', color: '#FFD700', stripeColor: '#000', pattern: 'stripes_side', sleeveColor: '#FFD700' },
        { id: 'jersey_vice_city', name: 'Maillot Vice', cost: 5500, type: 'jersey', color: '#000', pattern: 'gradient_blue_pink', sleeveColor: 'none', trimColor: '#00FFFF' },
        { id: 'tank_vice', name: 'Tank Vice', cost: 3000, type: 'tank', color: '#FFF', pattern: 'gradient_blue_pink' },
        { id: 'hoodie_pink', name: 'Hoodie Rose', cost: 1500, type: 'hoodie', color: '#FF69B4', sleeveColor: '#FF69B4' },
        { id: 'hoodie_yellow', name: 'Hoodie Jaune', cost: 1500, type: 'hoodie', color: '#FFD700', sleeveColor: '#FFD700' },
        { id: 'hoodie_maroon', name: 'Hoodie Bordeaux', cost: 1500, type: 'hoodie', color: '#800000', sleeveColor: '#800000' },
        { id: 'sweat_cream', name: 'Sweat Creme', cost: 1200, type: 'sweatshirt', color: '#F5F5DC', sleeveColor: '#F5F5DC' },
        { id: 'track_orange', name: 'Track Orange', cost: 2000, type: 'track', color: '#FF4500', stripeColor: '#FFF', sleeveColor: '#FF4500' },
        { id: 'shirt_plaid_red', name: 'Chemise Rouge', cost: 1800, type: 'shirt', color: '#CC0000', pattern: 'plaid' },
        { id: 'shirt_plaid_blue', name: 'Chemise Bleue', cost: 1800, type: 'shirt', color: '#00008B', pattern: 'plaid' },
        { id: 'shirt_plaid_green', name: 'Chemise Verte', cost: 1800, type: 'shirt', color: '#006400', pattern: 'plaid' },
        { id: 'suit_white', name: 'Costume Blanc', cost: 6000, type: 'shirt', color: '#FFF', pattern: 'suit' },
        { id: 'suit_red', name: 'Costume Rouge', cost: 6000, type: 'shirt', color: '#8B0000', pattern: 'suit' },
        { id: 'suit_blue', name: 'Costume Bleu', cost: 6000, type: 'shirt', color: '#00008B', pattern: 'suit' },

        // JACKETS
        { id: 'jacket_leather', name: 'Veste Cuir', cost: 5000, type: 'jacket', color: '#111', material: 'leather' },
        { id: 'jacket_puffer_black', name: 'Puffer Noir', cost: 4000, type: 'jacket', color: '#222', style: 'puffer' },
        { id: 'jacket_puffer_orange', name: 'Puffer Orange', cost: 4000, type: 'jacket', color: '#FF4500', style: 'puffer' },
        { id: 'jacket_varsity_red', name: 'Varsity Rouge', cost: 4500, type: 'jacket', color: '#CC0000', sleeveColor: '#FFF', style: 'varsity' },
        { id: 'jacket_varsity_blue', name: 'Varsity Bleu', cost: 4500, type: 'jacket', color: '#00008B', sleeveColor: '#F5F5DC', style: 'varsity' },
        { id: 'jacket_denim', name: 'Veste Jean', cost: 3500, type: 'jacket', color: '#4682B4', material: 'denim' },

        // VESTS
        { id: 'vest_denim', name: 'Gilet Jean', cost: 3000, type: 'vest', color: '#4682B4', material: 'denim' },
        { id: 'vest_puffer_red', name: 'Gilet Puffer', cost: 3500, type: 'vest', color: '#CC0000', style: 'puffer' },
        { id: 'vest_tactical', name: 'Gilet Tactique', cost: 4000, type: 'vest', color: '#333', style: 'tactical' },

        // ROBES
        { id: 'robe_boxer', name: 'Robe Boxeur', cost: 3000, type: 'robe', color: '#CC0000', trimColor: '#FFD700', pattern: 'satin' },
        { id: 'robe_wizard_blue', name: 'Robe Sorcier', cost: 4000, type: 'robe', color: '#191970', pattern: 'stars' },

        // NEW HOODIES
        { id: 'hoodie_offwhite', name: 'Streetwear', cost: 8000, type: 'hoodie', color: '#FFF', pattern: 'stripes_sleeve_diag' },
        { id: 'hoodie_bape', name: 'Camo Requin', cost: 10000, type: 'hoodie', color: '#556B2F', pattern: 'camo_shark' }
    ];

    var HATS_DB = [
        { id: 'hat_none', name: 'Aucun (Défaut)', cost: 0, type: 'none' },
        { id: 'hat_cap_red', name: 'Casquette Rouge', cost: 500, type: 'cap', color: '#FF0000' },
        { id: 'hat_cap_blue', name: 'Casquette Bleue', cost: 500, type: 'cap', color: '#0000FF' },
        { id: 'hat_cap_black', name: 'Casquette Noire', cost: 500, type: 'cap', color: '#111' },
        { id: 'hat_cap_white', name: 'Casquette Blanche', cost: 500, type: 'cap', color: '#FFF' },
        { id: 'hat_cap_green', name: 'Casquette Verte', cost: 500, type: 'cap', color: '#008000' },
        { id: 'hat_beanie_red', name: 'Tuque Rouge', cost: 750, type: 'beanie', color: '#FF0000' },
        { id: 'hat_beanie_black', name: 'Tuque Noire', cost: 750, type: 'beanie', color: '#111' },
        { id: 'hat_beanie_orange', name: 'Tuque Orange', cost: 750, type: 'beanie', color: '#FFA500' },
        { id: 'hat_headband_red', name: 'Bandeau Rouge', cost: 1000, type: 'headband', color: '#FF0000' },
        { id: 'hat_headband_blue', name: 'Bandeau Bleu', cost: 1000, type: 'headband', color: '#0000FF' },
        { id: 'hat_headband_white', name: 'Bandeau Blanc', cost: 1000, type: 'headband', color: '#FFF' },
        { id: 'hat_tophat', name: 'Haut-de-forme', cost: 2000, type: 'top_hat', color: '#111' },
        { id: 'hat_cowboy', name: 'Cowboy', cost: 2500, type: 'hat', color: '#8B4513' },
        { id: 'hat_panama', name: 'Panama', cost: 2000, type: 'hat', color: '#F5F5DC' },
        { id: 'hat_sombrero', name: 'Sombrero', cost: 3000, type: 'sombrero', color: '#1a1a1a' },
        { id: 'hat_fez', name: 'Fez', cost: 2500, type: 'fez', color: '#8B0000' },
        { id: 'hat_crown', name: 'Couronne', cost: 5000, type: 'crown' },
        { id: 'hat_halo', name: 'Auréole', cost: 5000, type: 'halo' },
        { id: 'hat_horns', name: 'Cornes', cost: 4000, type: 'horns' },
        { id: 'hat_wizard', name: 'Sorcier', cost: 4500, type: 'wizard_hat', color: '#000080' },
        { id: 'hat_chef', name: 'Chef', cost: 1500, type: 'chef_hat' },
        { id: 'hat_helmet_astro', name: 'Astronaute', cost: 5000, type: 'helmet', color: '#EEE' },
        { id: 'hat_helmet_army', name: 'Militaire', cost: 3000, type: 'helmet', color: '#556B2F' },
        { id: 'hat_bow_pink', name: 'Boucle Rose', cost: 1000, type: 'bow', color: '#FFC0CB' },
        { id: 'hat_flower', name: 'Fleur', cost: 1000, type: 'flower' },
        { id: 'hat_party', name: 'Fête', cost: 1500, type: 'party_hat', color: '#FF00FF' },
        { id: 'hat_propeller', name: 'Hélice', cost: 2000, type: 'propeller_cap', color: '#FFD700' },
        { id: 'hat_bucket', name: 'Bucket Hat', cost: 2000, type: 'bucket_hat', color: '#FFFF00' },
        { id: 'hat_santa', name: 'Père Noël', cost: 3000, type: 'santa_hat', color: '#FF0000' },
        { id: 'hat_viking', name: 'Viking', cost: 4000, type: 'viking_helmet', color: '#AAA' },
        { id: 'hat_pirate', name: 'Pirate', cost: 3500, type: 'pirate_hat', color: '#111' },
        { id: 'hat_fedora', name: 'Fedora', cost: 2500, type: 'fedora', color: '#333' },
        { id: 'hat_beret', name: 'Béret', cost: 2000, type: 'beret', color: '#000' },
        { id: 'hat_visor_white', name: 'Visière', cost: 1000, type: 'visor', color: '#FFF' },
        { id: 'hat_ushanka', name: 'Chapka', cost: 3000, type: 'ushanka', color: '#8B4513' },
        { id: 'hat_jester', name: 'Bouffon', cost: 4000, type: 'jester', color: '#FF00FF' },
        { id: 'hat_police', name: 'Képi', cost: 2500, type: 'police_cap', color: '#000080' },
        { id: 'hat_turban', name: 'Turban', cost: 2500, type: 'turban', color: '#FFF' },
        { id: 'hat_bandana_blue', name: 'Bandana Bleu', cost: 1500, type: 'bandana', color: '#0000FF' },
        { id: 'hat_bandana_green', name: 'Bandana Vert', cost: 1500, type: 'bandana', color: '#008000' },
        { id: 'hat_headphones', name: 'Écouteurs', cost: 2000, type: 'headphones', color: '#333' },
        { id: 'hat_antlers', name: 'Bois de Renne', cost: 2500, type: 'antlers', color: '#8B4513' },
        { id: 'hat_arrow', name: 'Flèche', cost: 2000, type: 'arrow_through_head' },
        { id: 'hat_disguise', name: 'Moustache', cost: 1500, type: 'groucho' }
    ];

    var PANTS_DB = [
        { id: 'pants_none', name: 'Aucun (Défaut)', cost: 0, type: 'none' },
        { id: 'pants_jeans', name: 'Jeans Bleus', cost: 500, type: 'long', color: '#000080' },
        { id: 'pants_jeans_black', name: 'Jeans Noirs', cost: 500, type: 'long', color: '#111' },
        { id: 'pants_khaki', name: 'Chinos', cost: 750, type: 'long', color: '#F0E68C' },
        { id: 'pants_camo', name: 'Treillis Camo', cost: 1000, type: 'long', color: '#556B2F' },
        { id: 'pants_joggers_grey', name: 'Joggers Gris', cost: 750, type: 'long', color: '#808080' },
        { id: 'pants_joggers_red', name: 'Joggers Rouges', cost: 750, type: 'long', color: '#FF0000' },
        { id: 'pants_track_blue', name: 'Survêt Bleu', cost: 1000, type: 'long', color: '#0000FF' },
        { id: 'pants_shorts_denim', name: 'Shorts Jeans', cost: 500, type: 'short', color: '#000080' },
        { id: 'pants_shorts_white', name: 'Shorts Blancs', cost: 500, type: 'short', color: '#FFF' },
        { id: 'pants_shorts_black', name: 'Shorts Noirs', cost: 500, type: 'short', color: '#000' },
        { id: 'pants_shorts_red', name: 'Shorts Rouges', cost: 500, type: 'short', color: '#FF0000' },
        { id: 'pants_shorts_camo', name: 'Shorts Camo', cost: 750, type: 'short', color: '#556B2F' },
        { id: 'pants_leggings', name: 'Leggings', cost: 1000, type: 'tights', color: '#000' },
        { id: 'pants_skirt_plaid', name: 'Kilt Écossais', cost: 1500, type: 'short', color: '#CC0000' }, // Treated as short pants for rendering logic
        { id: 'pants_gold', name: 'Pantalons Or', cost: 5000, type: 'long', color: '#FFD700' },
        { id: 'pants_legend_wall', name: 'Shorts SPEEDY', cost: 1500, type: 'short', color: '#FFF', sideStripesColor: '#002B5C', trimColor: '#E31837', pattern: 'wizards' },
        { id: 'pants_legend_wall_alt', name: 'Shorts D.C.', cost: 1500, type: 'short', color: '#E31837', sideStripesColor: '#FFF', trimColor: '#002B5C' },
        { id: 'pants_legend_wall_rookie', name: 'Shorts ROOKIE', cost: 3000, type: 'short', color: '#002B5C', trimColor: '#C4A006' },
        { id: 'pants_legend_lebron', name: 'Shorts THE KING', cost: 7500, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
        { id: 'pants_legend_lebron_alt', name: 'Shorts KING', cost: 7500, type: 'short', color: '#000', sideStripesColor: '#E31837' },
        { id: 'pants_legend_lebron_cavs', name: 'Shorts KING', cost: 9000, type: 'short', color: '#6F263D', trimColor: '#FFB81C' },
        { id: 'pants_legend_kobe8', name: 'Shorts FROBE', cost: 9000, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
        { id: 'pants_legend_kobe8_alt', name: 'Shorts MAMBA', cost: 9000, type: 'short', color: '#552583', sideStripesColor: '#FDB927' },
        { id: 'pants_legend_kobe24', name: 'Shorts MAMBA', cost: 9000, type: 'short', color: '#FFF', trimColor: '#552583' },
        { id: 'pants_legend_kobe24_alt', name: 'Shorts EIGHT', cost: 9000, type: 'short', color: '#000', trimColor: '#FDB927' },
        { id: 'pants_legend_curry', name: 'Shorts CHEF', cost: 9000, type: 'short', color: '#1D428A', trimColor: '#FFC72C' },
        { id: 'pants_legend_curry_alt', name: 'Shorts CHEF', cost: 9000, type: 'short', color: '#FDB927', trimColor: '#1D428A' },
        { id: 'pants_legend_magic', name: 'Shorts MAGIC', cost: 9000, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
        { id: 'pants_legend_magic_alt', name: 'Shorts MAGIC', cost: 9000, type: 'short', color: '#552583', sideStripesColor: '#FDB927' },
        { id: 'pants_legend_drj', name: 'Shorts DOCTOR', cost: 10500, type: 'short', color: '#FFF', trimColor: '#ED174C' },
        { id: 'pants_legend_drj_alt', name: 'Shorts DOCTOR', cost: 10500, type: 'short', color: '#00285E', trimColor: '#E31837' },
        { id: 'pants_legend_wilt', name: 'Shorts STILT', cost: 12000, type: 'short', color: '#552583', sideStripesColor: '#FDB927' },
        { id: 'pants_legend_wilt_alt', name: 'Shorts THE STILT', cost: 12000, type: 'short', color: '#FFF', sideStripesColor: '#000' },
        { id: 'pants_legend_mj', name: 'Shorts G.O.A.T.', cost: 15000, type: 'short', color: '#CE1141', trimColor: '#000', pattern: 'bulls' },
        { id: 'pants_legend_mj_alt', name: 'Shorts G.O.A.T.', cost: 15000, type: 'short', color: '#000', pinstripesColor: '#CE1141' },
        { id: 'pants_legend_mj_wiz', name: 'Shorts G.O.A.T.', cost: 12000, type: 'short', color: '#002B5C', trimColor: '#C4A006' },
        { id: 'pants_legend_bird', name: 'Shorts LEGEND', cost: 12000, type: 'short', color: '#007A33', trimColor: '#FFF' },
        { id: 'pants_legend_bird_alt', name: 'Shorts LEGEND', cost: 12000, type: 'short', color: '#FFF', trimColor: '#007A33' },
        { id: 'pants_legend_shaq', name: 'Shorts DIESEL', cost: 12000, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
        { id: 'pants_legend_shaq_alt', name: 'Shorts DIESEL', cost: 12000, type: 'short', color: '#000', pinstripesColor: '#FFF' },
        { id: 'pants_legend_shaq_magic', name: 'Shorts DIESEL', cost: 10500, type: 'short', color: '#0077C0', pinstripesColor: '#FFF' },
        { id: 'pants_legend_ai', name: 'Shorts ANSWER', cost: 10500, type: 'short', color: '#000', trimColor: '#ED174C' },
        { id: 'pants_legend_ai_alt', name: 'Shorts ANSWER', cost: 10500, type: 'short', color: '#418FDE', trimColor: '#FDB927' },
        { id: 'pants_legend_duncan', name: 'Shorts FUNDAMENTAL', cost: 10500, type: 'short', color: '#000', trimColor: '#C4CED4' },
        { id: 'pants_legend_duncan_alt', name: 'Shorts TIMMY', cost: 10500, type: 'short', color: '#C4CED4', trimColor: '#000' },
        { id: 'pants_legend_rodman', name: 'Shorts WORM', cost: 9000, type: 'short', color: '#000', trimColor: '#000', pattern: 'bulls' },
        { id: 'pants_legend_rodman_alt', name: 'Shorts WORM', cost: 9000, type: 'short', color: '#00519E', trimColor: '#E31837' },
        { id: 'pants_legend_barkley', name: 'Shorts SIR CHARLES', cost: 9000, type: 'short', color: '#1D1160', sideStripesColor: '#E56020' },
        { id: 'pants_legend_barkley_alt', name: 'Shorts CHUCK', cost: 9000, type: 'short', color: '#FFF', sideStripesColor: '#CE1141' },
        { id: 'pants_legend_dirk', name: 'Shorts GERMAN', cost: 9000, type: 'short', color: '#00538C', sideStripesColor: '#B8C4CA' },
        { id: 'pants_legend_dirk_alt', name: 'Shorts DIRK', cost: 9000, type: 'short', color: '#007A33', sideStripesColor: '#00538C' },
        { id: 'pants_legend_giannis', name: 'Shorts FREAK', cost: 7500, type: 'short', color: '#00471B', sideStripesColor: '#EEE1C6' },
        { id: 'pants_legend_giannis_alt', name: 'Shorts FREAK', cost: 7500, type: 'short', color: '#EEE1C6', sideStripesColor: '#00471B' },
        { id: 'pants_legend_joker', name: 'Shorts JOKER', cost: 7500, type: 'short', color: '#0E2240', trimColor: '#FEC524' },
        { id: 'pants_legend_joker_alt', name: 'Shorts JOKER', cost: 7500, type: 'short', color: '#FFF', sideStripesColor: '#FF0000' },
        { id: 'pants_legend_luka', name: 'Shorts MAGIC', cost: 7500, type: 'short', color: '#00538C', sideStripesColor: '#B8C4CA' },
        { id: 'pants_legend_luka_alt', name: 'Shorts LUKA', cost: 7500, type: 'short', color: '#FFF', sideStripesColor: '#00C1D4' },
        { id: 'pants_legend_kd', name: 'Shorts REAPER', cost: 9000, type: 'short', color: '#1D1160', sideStripesColor: '#E56020' },
        { id: 'pants_legend_kd_alt', name: 'Shorts SLIM', cost: 9000, type: 'short', color: '#00653A', sideStripesColor: '#FFC200' },
        { id: 'pants_legend_harden', name: 'Shorts BEARD', cost: 7500, type: 'short', color: '#CE1141', sideStripesColor: '#FFF' },
        { id: 'pants_legend_harden_alt', name: 'Shorts BEARD', cost: 7500, type: 'short', color: '#000', sideStripesColor: '#FFF' },
        { id: 'pants_legend_vince', name: 'Shorts VINSANITY', cost: 9000, type: 'short', color: '#753BBD', pinstripesColor: '#CE1141' },
        { id: 'pants_legend_vince_alt', name: 'Shorts VINSANITY', cost: 9000, type: 'short', color: '#FFF', pinstripesColor: '#CE1141' },
        { id: 'pants_legend_kareem', name: 'Shorts CAP', cost: 13500, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
        { id: 'pants_legend_kareem_alt', name: 'Shorts CAP', cost: 13500, type: 'short', color: '#00471B', sideStripesColor: '#EEE1C6' },
        { id: 'pants_legend_russell', name: 'Shorts BILL', cost: 15000, type: 'short', color: '#007A33', trimColor: '#FFF' },
        { id: 'pants_legend_russell_alt', name: 'Shorts BILL', cost: 15000, type: 'short', color: '#007A33', trimColor: '#FFF' },
        { id: 'pants_legend_jackie', name: 'Shorts MOON', cost: 150, type: 'short', color: '#FFF', sideStripesColor: '#00CED1', trimColor: '#FFA500' },
        { id: 'pants_legend_pip_alt', name: 'Shorts PIP', cost: 9000, type: 'short', color: '#000', trimColor: '#CE1141' },
        { id: 'pants_legend_wade', name: 'Shorts FLASH', cost: 9000, type: 'short', color: '#000', sideStripesColor: '#98002E' },
        { id: 'pants_legend_wade_alt', name: 'Shorts FLASH', cost: 9000, type: 'short', color: '#000', sideStripesColor: '#FF69B4' },
        { id: 'pants_legend_reggie', name: 'Shorts REGGIE', cost: 7500, type: 'short', color: '#002D62', pinstripesColor: '#FDB927' },
        { id: 'pants_legend_reggie_alt', name: 'Shorts REGGIE', cost: 7500, type: 'short', color: '#FDB927', pinstripesColor: '#002D62' },
        { id: 'pants_legend_tmac', name: 'Shorts T-MAC', cost: 7500, type: 'short', color: '#007DC5', pinstripesColor: '#C4CED4' },
        { id: 'pants_legend_tmac_alt', name: 'Shorts T-MAC', cost: 7500, type: 'short', color: '#CE1141', pinstripesColor: '#FFF' },
        { id: 'pants_legend_kg', name: 'Shorts TICKET', cost: 9000, type: 'short', color: '#005083', trimColor: '#78BE20' },
        { id: 'pants_legend_kg_alt', name: 'Shorts TICKET', cost: 9000, type: 'short', color: '#007A33', trimColor: '#FFF' },
        { id: 'pants_legend_nash', name: 'Shorts Captain Canada', cost: 10500, type: 'short', color: '#1D1160', sideStripesColor: '#E56020' },
        { id: 'pants_legend_nash_alt', name: 'Shorts STEVE', cost: 10500, type: 'short', color: '#00538C', sideStripesColor: '#B8C4CA' },
        { id: 'pants_legend_dream', name: 'Shorts The Dream', cost: 12000, type: 'short', color: '#CE1141', trimColor: '#FDB927' },
        { id: 'pants_legend_dream_alt', name: 'Shorts DREAM', cost: 12000, type: 'short', color: '#002D62', trimColor: '#FFF', pinstripesColor: '#FFF' },
        { id: 'pants_legend_ewing', name: 'Shorts Big Pat', cost: 10500, type: 'short', color: '#006BB6', trimColor: '#F58426' },
        { id: 'pants_legend_ewing_alt', name: 'Shorts PAT', cost: 10500, type: 'short', color: '#FFF', trimColor: '#F58426' },
        { id: 'pants_legend_zeke', name: 'Shorts Zeke', cost: 10500, type: 'short', color: '#006BB6', sideStripesColor: '#ED174C' },
        { id: 'pants_legend_zeke_alt', name: 'Shorts ZEKE', cost: 10500, type: 'short', color: '#FFF', sideStripesColor: '#ED174C' },
        { id: 'pants_legend_glide', name: 'Shorts The Glide', cost: 10500, type: 'short', color: '#CE1141', trimColor: '#000' },
        { id: 'pants_legend_glide_alt', name: 'Shorts GLIDE', cost: 10500, type: 'short', color: '#002D62', trimColor: '#FFF' },
        { id: 'pants_legend_truth', name: 'Shorts The Truth', cost: 9000, type: 'short', color: '#007A33', trimColor: '#000' },
        { id: 'pants_legend_truth_alt', name: 'Shorts TRUTH', cost: 9000, type: 'short', color: '#000', trimColor: '#FFF' },
        { id: 'pants_legend_shuttlesworth', name: 'Shorts Jesus', cost: 9000, type: 'short', color: '#007A33', trimColor: '#FFF' },
        { id: 'pants_legend_shuttlesworth_alt', name: 'Shorts JESUS', cost: 9000, type: 'short', color: '#FFF', trimColor: '#CE1141' },
        { id: 'pants_legend_klaw', name: 'Shorts The Klaw', cost: 10500, type: 'short', color: '#000', sideStripesColor: '#C4CED4' },
        { id: 'pants_legend_klaw_alt', name: 'Shorts KLAW', cost: 10500, type: 'short', color: '#CE1141', sideStripesColor: '#000' },
        { id: 'pants_legend_wemby', name: 'Shorts L', cost: 10500, type: 'short', color: '#000', sideStripesColor: '#C4CED4' },
        { id: 'pants_legend_wemby_alt', name: 'Shorts ALIEN', cost: 10500, type: 'short', color: '#002654', sideStripesColor: '#ED2939' },
        { id: 'pants_legend_sga', name: 'Shorts SGA', cost: 9000, type: 'short', color: '#007AC1', sideStripesColor: '#EF3B24' },
        { id: 'pants_legend_sga_alt', name: 'Shorts SHAI', cost: 9000, type: 'short', color: '#CE1126', sideStripesColor: '#FFF' },
        { id: 'pants_legend_brow', name: 'Shorts The Brow', cost: 9000, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
        { id: 'pants_legend_brow_alt', name: 'Shorts BROW', cost: 9000, type: 'short', color: '#002B5C', sideStripesColor: '#B4975A' },
        { id: 'pants_legend_brow_wiz', name: 'Shorts BROW', cost: 9000, type: 'short', color: '#002B5C', sideStripesColor: '#E31837' },
        { id: 'pants_legend_kyrie', name: 'Shorts Uncle Drew', cost: 9000, type: 'short', color: '#00538C', sideStripesColor: '#B8C4CA' },
        { id: 'pants_legend_kyrie_alt', name: 'Shorts UNCLE DREW', cost: 9000, type: 'short', color: '#6F263D', sideStripesColor: '#FDB927' },
        { id: 'pants_legend_dame', name: 'Shorts Dame Time', cost: 9000, type: 'short', color: '#000', pinstripesColor: '#CE1141' },
        { id: 'pants_legend_dame_alt', name: 'Shorts DAME', cost: 9000, type: 'short', color: '#FFF', pinstripesColor: '#CE1141' },
        { id: 'pants_legend_tatum', name: 'Shorts Taco Jay', cost: 9000, type: 'short', color: '#007A33', trimColor: '#FFF' },
        { id: 'pants_legend_tatum_alt', name: 'Shorts TACO JAY', cost: 9000, type: 'short', color: '#003087', trimColor: '#FFF' },
        { id: 'pants_legend_process', name: 'Shorts The Process', cost: 9000, type: 'short', color: '#006BB6', trimColor: '#ED174C' },
        { id: 'pants_legend_process_alt', name: 'Shorts PROCESS', cost: 9000, type: 'short', color: '#0051BA', trimColor: '#E8000D' },
        { id: 'pants_camo_green', name: 'Treillis Jungle', cost: 1500, type: 'long', color: '#556B2F', pattern: 'camo' },
        { id: 'pants_camo_desert', name: 'Treillis Sable', cost: 1500, type: 'long', color: '#D2B48C', pattern: 'camo' },
        { id: 'pants_track_red', name: 'Bas Track Rouge', cost: 1500, type: 'long', color: '#CC0000', sideStripesColor: '#FFF' },
        { id: 'pants_track_green', name: 'Bas Track Vert', cost: 1500, type: 'long', color: '#006400', sideStripesColor: '#FFF' },
        { id: 'pants_track_grey', name: 'Bas Track Gris', cost: 1500, type: 'long', color: '#808080', sideStripesColor: '#000' },
        { id: 'pants_track_gold', name: 'Bas Track Or', cost: 5000, type: 'long', color: '#FFD700', sideStripesColor: '#000' },
        { id: 'pants_galaxy', name: 'Leggings Galaxy', cost: 2500, type: 'tights', color: '#4B0082', pattern: 'galaxy' },
        { id: 'pants_tiedye', name: 'Shorts Tie-Dye', cost: 2000, type: 'short', color: '#FFF', pattern: 'tie_dye' },
        { id: 'pants_plaid_red', name: 'Pantalon Pyjama', cost: 1200, type: 'long', color: '#CC0000', pattern: 'plaid' }
    ];

    var SHOES_DB = [
        { id: 'shoe_none', name: 'Aucun (Pieds nus)', cost: 0, type: 'none' },
        { id: 'shoe_sneakers_white', name: 'Baskets Blanches', cost: 500, type: 'sneakers', color: '#FFF' },
        { id: 'shoe_sneakers_black', name: 'Baskets Noires', cost: 500, type: 'sneakers', color: '#111' },
        { id: 'shoe_sneakers_red', name: 'Baskets Rouges', cost: 750, type: 'sneakers', color: '#FF0000' },
        { id: 'shoe_sneakers_blue', name: 'Baskets Bleues', cost: 750, type: 'sneakers', color: '#0000FF' },
        { id: 'shoe_jordan1_chi', name: 'Air Legend 1', cost: 2500, type: 'hightop', color: '#FFF', detailColor: '#FF0000' },
        { id: 'shoe_jordan11', name: 'Concord 11', cost: 3000, type: 'hightop', color: '#FFF', detailColor: '#000', shiny: true },
        { id: 'shoe_boots_timber', name: 'Bottes Chantier', cost: 1500, type: 'boots', color: '#D2B48C' },
        { id: 'shoe_boots_black', name: 'Bottes Militaires', cost: 1500, type: 'boots', color: '#111' },
        { id: 'shoe_crocs_green', name: 'Crocos Verts', cost: 1000, type: 'clogs', color: '#00FF00' },
        { id: 'shoe_crocs_pink', name: 'Crocos Roses', cost: 1000, type: 'clogs', color: '#FF69B4' },
        { id: 'shoe_sandals', name: 'Sandales', cost: 750, type: 'sandals', color: '#8B4513' },
        { id: 'shoe_slides', name: 'Claquettes', cost: 750, type: 'slides', color: '#000' },
        { id: 'shoe_heels_red', name: 'Talons Rouges', cost: 2000, type: 'heels', color: '#FF0000' },
        { id: 'shoe_dress', name: 'Souliers Chics', cost: 2000, type: 'dress', color: '#000', shiny: true },
        { id: 'shoe_cleats', name: 'Crampons', cost: 2500, type: 'cleats', color: '#FFFF00' },
        { id: 'shoe_slippers', name: 'Pantoufles Lapin', cost: 3000, type: 'slippers_bunny', color: '#FFF' },
        { id: 'shoe_skates', name: 'Patins', cost: 4000, type: 'skates', color: '#000' },
        { id: 'shoe_space', name: 'Bottes Lunaires', cost: 5000, type: 'boots_heavy', color: '#AAA' },
        // NEW SHOES
        { id: 'shoe_yeezy_foam', name: 'Alien Foam', cost: 4000, type: 'foam', color: '#E0E0E0' },
        { id: 'shoe_yeezy_red', name: 'Red Octobers', cost: 10000, type: 'retro', color: '#FF0000', detailColor: '#8B0000' },
        { id: 'shoe_converse_black', name: 'All-Stars Noir', cost: 1200, type: 'hightop_canvas', color: '#111', detailColor: '#FFF' },
        { id: 'shoe_converse_red', name: 'All-Stars Rouge', cost: 1200, type: 'hightop_canvas', color: '#CC0000', detailColor: '#FFF' },
        { id: 'shoe_vans_check', name: 'Skater Check', cost: 1500, type: 'slipon', color: '#FFF', pattern: 'check', detailColor: '#000' },
        { id: 'shoe_vans_black', name: 'Skater Noir', cost: 1500, type: 'slipon', color: '#111', detailColor: '#FFF' },
        { id: 'shoe_timbs', name: 'Timbs', cost: 2500, type: 'boots_work', color: '#D2B48C', detailColor: '#5D4037' },
        { id: 'shoe_jordan4_cement', name: 'Retro 4 Cement', cost: 5000, type: 'retro_bulky', color: '#FFF', detailColor: '#000', color3: '#808080' },
        { id: 'shoe_jordan4_bred', name: 'Retro 4 Bred', cost: 5000, type: 'retro_bulky', color: '#111', detailColor: '#CC0000', color3: '#808080' },
        { id: 'shoe_mag', name: 'McFly Future', cost: 50000, type: 'hightop_future', color: '#C0C0C0', detailColor: '#00FFFF', shiny: true }
    ];

    var ANIMALS = ['human', 'rat', 'cat', 'dog', 'bear', 'rabbit', 'moose', 'fox', 'wolf', 'lion', 'tiger', 'pig', 'cow', 'monkey', 'penguin', 'chicken', 'frog', 'turtle', 'elephant', 'dino', 'zebra', 'giraffe'];

    var SKIN_TONES = [
        '#f0d5be', // Light
        '#e0ac69',
        '#dcb98a',
        '#d2b48c',
        '#8d5524', // Medium (Default)
        '#c68642',
        '#5c3a21',
        '#4a3020',
        '#3e271a',
        '#2e1e16', // Dark
        '#FFD700', // Gold
        '#C0C0C0', // Silver
        '#32CD32', // Alien Green
        '#87CEEB', // Ice Blue
        '#FF69B4'  // Pink
    ];

    var HAIR_COLORS = [
        '#000000', // Black (Default)
        '#2C2C2C', // Dark Grey
        '#4B3621', // Dark Brown
        '#5D4037', // Brown
        '#8B4513', // Saddle Brown
        '#A0522D', // Sienna
        '#CD853F', // Light Brown
        '#D2B48C', // Tan
        '#E6BE8A', // Dirty Blonde
        '#FFD700', // Gold/Blonde
        '#FFFFE0', // Platinum Blonde
        '#A52A2A', // Auburn
        '#800000', // Maroon
        '#FF0000', // Red
        '#FF4500', // Orange Red
        '#FFA500', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#008000', // Dark Green
        '#00FFFF', // Cyan
        '#0000FF', // Blue
        '#000080', // Navy
        '#800080', // Purple
        '#FF00FF', // Magenta
        '#FF69B4', // Pink
        '#FFFFFF', // White
        '#808080'  // Grey
    ];
    var CROWD_EMOJIS = ['🐭', '🐱', '🐶', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐢', '🐘', '🦕', '🦓', '🦒'];

    // --- BALL GEOMETRY & RENDERER ---
    var CAT_SKINS_DB = [
        { id: 'cat_default', name: 'Classique', cost: 0, type: 'dynamic', stance: 'sitting' },
        { id: 'cat_white', name: 'Boule de Neige', cost: 0, furColor: '#FFFFFF', bellyColor: '#F0F8FF', stance: 'sleeping' },
        { id: 'cat_yoga', name: 'Namaste', cost: 0, furColor: '#FFA07A', bellyColor: '#FFDAB9', stance: 'yoga' }, // NEW 1
        { id: 'cat_black', name: 'Ombre', cost: 0, furColor: '#111111', bellyColor: '#333333', stance: 'arched' },
        { id: 'cat_dab', name: 'Le Dab', cost: 0, furColor: '#4169E1', bellyColor: '#87CEFA', stance: 'dab' }, // NEW 2
        { id: 'cat_grey', name: 'Fumée', cost: 0, furColor: '#808080', bellyColor: '#A9A9A9', stance: 'loaf' },
        { id: 'cat_meditate', name: 'Zen', cost: 0, furColor: '#98FB98', bellyColor: '#F0FFF0', stance: 'meditate' }, // NEW 3
        { id: 'cat_orange', name: 'Marmelade', cost: 0, furColor: '#FFA500', bellyColor: '#FFD700', stance: 'stretching' },
        { id: 'cat_boxing', name: 'Rocky', cost: 0, furColor: '#A52A2A', bellyColor: '#DEB887', stance: 'boxing' }, // NEW 4
        { id: 'cat_cream', name: 'Vanille', cost: 0, furColor: '#F5DEB3', bellyColor: '#FFF8DC', stance: 'begging' },
        { id: 'cat_grooming', name: 'Propre', cost: 0, furColor: '#D3D3D3', bellyColor: '#FFFFFF', stance: 'grooming' }, // NEW 5
        { id: 'cat_brown', name: 'Chocolat', cost: 0, furColor: '#8B4513', bellyColor: '#D2691E', stance: 'sleeping' },
        { id: 'cat_upside_down', name: 'Chauve-souris', cost: 0, furColor: '#2F4F4F', bellyColor: '#708090', stance: 'upside_down' }, // NEW 6
        { id: 'basket_cat_tuxedo', name: 'Félix', cost: 0, furColor: '#111', bellyColor: '#FFF', stance: 'begging' },
        { id: 'cat_superman', name: 'Superchat', cost: 0, furColor: '#0000FF', bellyColor: '#FF0000', stance: 'superman' }, // NEW 7
        { id: 'basket_cat_calico', name: 'Patchwork', cost: 0, furColor: '#FFF', bellyColor: '#FFF', pattern: 'spots', spotColor: '#D2691E', stance: 'sitting' },
        { id: 'cat_ball', name: 'Boule de Poils', cost: 0, furColor: '#8B0000', bellyColor: '#CD5C5C', stance: 'ball' }, // NEW 8
        { id: 'basket_cat_siamese', name: 'Siamois', cost: 0, furColor: '#F5DEB3', bellyColor: '#F5DEB3', earColor: '#333', stance: 'stretching' },
        { id: 'cat_scared_leap', name: 'Sursaut', cost: 0, furColor: '#FF4500', bellyColor: '#FFA07A', stance: 'scared_leap' }, // NEW 9
        { id: 'basket_cat_tabby', name: 'Tigré', cost: 0, furColor: '#808080', bellyColor: '#A9A9A9', pattern: 'stripes', stance: 'loaf' },
        { id: 'cat_high_five', name: 'Tope Là', cost: 0, furColor: '#FFD700', bellyColor: '#FFFFE0', stance: 'high_five' }, // NEW 10
        { id: 'cat_pink', name: 'Barbe à Papa', cost: 0, furColor: '#FFB6C1', bellyColor: '#FFC0CB', stance: 'sprawled' },
        { id: 'cat_stalking', name: 'Chasseur', cost: 0, furColor: '#556B2F', bellyColor: '#8FBC8F', stance: 'stalking' }, // NEW 11
        { id: 'cat_blue', name: 'Ciel', cost: 0, furColor: '#87CEEB', bellyColor: '#E0FFFF', stance: 'sleeping' },
        { id: 'cat_belly_up', name: 'Gratouille', cost: 0, furColor: '#D8BFD8', bellyColor: '#E6E6FA', stance: 'belly_up' }, // NEW 12
        { id: 'cat_green', name: 'Radioactif', cost: 0, furColor: '#00FF00', bellyColor: '#ADFF2F', stance: 'standing' },
        { id: 'cat_butt_wiggle', name: 'Prêt', cost: 0, furColor: '#CD853F', bellyColor: '#F4A460', stance: 'butt_wiggle' }, // NEW 13
        { id: 'cat_purple', name: 'Galaxie', cost: 0, furColor: '#4B0082', bellyColor: '#8A2BE2', stance: 'stretching' },
        { id: 'cat_facepalm', name: 'Désespoir', cost: 0, furColor: '#708090', bellyColor: '#B0C4DE', stance: 'facepalm' }, // NEW 14
        { id: 'cat_gold', name: 'Luxe', cost: 0, furColor: '#FFD700', bellyColor: '#FFFACD', shininess: 1.0, stance: 'sitting' },
        { id: 'cat_thinking', name: 'Penseur', cost: 0, furColor: '#4682B4', bellyColor: '#87CEEB', stance: 'thinking' }, // NEW 15
        { id: 'cat_red', name: 'Diablotin', cost: 0, furColor: '#FF0000', bellyColor: '#8B0000', stance: 'arched' },
        { id: 'cat_surprised', name: 'Kevin', cost: 0, furColor: '#FF6347', bellyColor: '#FFA07A', stance: 'surprised' }, // NEW 16
        { id: 'cat_silver', name: 'Robo-Chat', cost: 0, furColor: '#C0C0C0', bellyColor: '#A9A9A9', stance: 'standing' },
        { id: 'cat_running', name: 'Zoomies', cost: 0, furColor: '#FFFF00', bellyColor: '#FFFFE0', stance: 'running' }, // NEW 17
        { id: 'cat_ghost', name: 'Fantôme', cost: 0, furColor: 'rgba(255,255,255,0.5)', bellyColor: 'rgba(255,255,255,0.3)', stance: 'sprawled' },
        { id: 'cat_sitting_chair', name: 'Humain', cost: 0, furColor: '#8B4513', bellyColor: '#D2B48C', stance: 'sitting_chair' }, // NEW 18
        { id: 'cat_tiger', name: 'Tigre', cost: 0, furColor: '#FFA500', bellyColor: '#FFF', pattern: 'stripes', spotColor: '#000', stance: 'standing' },
        { id: 'cat_ninja_kick', name: 'Ninja', cost: 0, furColor: '#000000', bellyColor: '#1a1a1a', stance: 'ninja_kick' }, // NEW 19
        { id: 'cat_leopard', name: 'Léopard', cost: 0, furColor: '#FFD700', bellyColor: '#FFF', pattern: 'spots', spotColor: '#000', stance: 'stretching' },
        { id: 'cat_crying', name: 'Triste', cost: 0, furColor: '#4169E1', bellyColor: '#87CEFA', stance: 'crying' }, // NEW 20
        { id: 'cat_zebra', name: 'Zèbre', cost: 0, furColor: '#FFF', bellyColor: '#FFF', pattern: 'stripes', spotColor: '#000', stance: 'standing' },
        { id: 'cat_sunglasses', name: 'Cool', cost: 0, furColor: '#FF1493', bellyColor: '#FF69B4', stance: 'sunglasses_cool' }, // NEW 21
        { id: 'cat_panda', name: 'Panda', cost: 0, furColor: '#FFF', bellyColor: '#FFF', earColor: '#000', pattern: 'panda', stance: 'sitting' },
        { id: 'cat_box', name: 'Livraison', cost: 0, furColor: '#D2691E', bellyColor: '#DEB887', stance: 'sleeping_box' }, // NEW 22
        { id: 'cat_camo', name: 'Camouflage', cost: 0, furColor: '#556B2F', bellyColor: '#8B4513', pattern: 'camo', stance: 'loaf' },
        { id: 'cat_yarn', name: 'Tricot', cost: 0, furColor: '#FF4500', bellyColor: '#FFA07A', stance: 'yarn_tangle' }, // NEW 23
        { id: 'cat_rainbow', name: 'Arc-en-ciel', cost: 0, furColor: '#FF0000', bellyColor: '#0000FF', pattern: 'rainbow', stance: 'begging' },
        { id: 'cat_bread', name: 'Sandwich', cost: 0, furColor: '#F4A460', bellyColor: '#FFE4B5', stance: 'bread_head' }, // NEW 24
        { id: 'cat_lava', name: 'Magma', cost: 0, furColor: '#FF4500', bellyColor: '#FFFF00', pattern: 'lava', stance: 'arched' },
        { id: 'cat_liquid', name: 'Liquide', cost: 0, furColor: '#00CED1', bellyColor: '#AFEEEE', stance: 'liquid' }, // NEW 25
        { id: 'cat_ice', name: 'Glace', cost: 0, furColor: '#E0FFFF', bellyColor: '#FFFFFF', shininess: 0.8, stance: 'sleeping' },
        { id: 'cat_stone', name: 'Statue', cost: 0, furColor: '#696969', bellyColor: '#808080', stance: 'sitting' },
        { id: 'cat_neon', name: 'Cyberpunk', cost: 0, furColor: '#00FFFF', bellyColor: '#FF00FF', stance: 'stretching' },
        { id: 'cat_void', name: 'Néant', cost: 0, furColor: '#000', bellyColor: '#000', stance: 'sprawled' }
    ];

    // Mapped from js/renderer.js drawCatDecor function
    var CAT_STANCES = {
        'sitting': 0,
        'loaf': 1,
        'standing': 2,
        'sprawled': 3,
        'sleeping': 4,
        'begging': 5,
        'stretching': 6,
        'arched': 7,
        'yoga': 8,
        'dab': 9,
        'meditate': 10,
        'boxing': 11,
        'grooming': 12,
        'upside_down': 13,
        'superman': 14,
        'ball': 15,
        'scared_leap': 16,
        'high_five': 17,
        'stalking': 18,
        'belly_up': 19,
        'butt_wiggle': 20,
        'facepalm': 21,
        'thinking': 22,
        'surprised': 23,
        'running': 24,
        'sitting_chair': 25,
        'ninja_kick': 26,
        'crying': 27,
        'sunglasses_cool': 28,
        'sleeping_box': 29,
        'yarn_tangle': 30,
        'bread_head': 31,
        'liquid': 32
    };

    var CAT_ACCESSORIES_DB = [
        { id: 'acc_none', name: 'Aucun', cost: 0, type: 'none' },
        { id: 'acc_sunglasses', name: 'Lunettes Soleil', cost: 500, type: 'glasses', color: '#000' },
        { id: 'acc_bowtie', name: 'Nœud Papillon', cost: 750, type: 'neck', color: '#FF0000' },
        { id: 'acc_crown', name: 'Couronne', cost: 5000, type: 'hat', color: '#FFD700' },
        { id: 'acc_cowboy', name: 'Chapeau Cowboy', cost: 2000, type: 'hat', color: '#8B4513' },
        { id: 'acc_tophat', name: 'Haut-de-forme', cost: 2500, type: 'hat', color: '#111' },
        { id: 'acc_cap', name: 'Casquette', cost: 1000, type: 'hat', color: '#0047AB' },
        { id: 'acc_chain', name: 'Chaîne Or', cost: 3000, type: 'neck', color: '#FFD700' },
        { id: 'acc_scarf', name: 'Écharpe', cost: 1500, type: 'neck', color: '#008000' },
        { id: 'acc_flower', name: 'Fleur', cost: 1000, type: 'head', color: '#FF69B4' }
    ];

    var BALLS_DB = [
        { id: 'ball_classic', name: 'Classique', cost: 0, type: 'basketball', color1: '#ff6600', color2: '#cc5500', texture: 'leather' },
        { id: 'ball_aba', name: 'ABA', cost: 1000, type: 'basketball', color1: '#FF0000', color2: '#0000FF', texture: 'leather' },
        { id: 'ball_money', name: 'Money Ball', cost: 2000, type: 'basketball', color1: '#FFFFFF', color2: '#0000FF', texture: 'leather' },
        { id: 'ball_tennis', name: 'Tennis', cost: 1500, type: 'tennis', color1: '#CCFF00', color2: '#99CC00', texture: 'fuzzy' },
        { id: 'ball_bowling', name: 'Bowling', cost: 2000, type: 'bowling', color1: '#111', color2: '#333', shininess: 0.9 },
        { id: 'ball_ice', name: 'Glace', cost: 3000, type: 'basketball', color1: '#E0FFFF', color2: '#FFF', texture: 'ice' },
        { id: 'ball_night', name: 'Nuit', cost: 3500, type: 'basketball', color1: '#4B0082', color2: '#000', texture: 'leather' },
        { id: 'ball_gold', name: 'Or', cost: 5000, type: 'basketball', color1: '#FFD700', color2: '#DAA520', shininess: 1.0, texture: 'leather' },
        { id: 'ball_slime', name: 'Radioactif', cost: 4000, type: 'basketball', color1: '#00FF00', color2: '#006400', texture: 'slime' },
        { id: 'ball_galaxy', name: 'Galaxie', cost: 10000, type: 'basketball', color1: '#8A2BE2', color2: '#4B0082', texture: 'galaxy' },

        { id: 'ball_soccer', name: 'Soccer', cost: 1000, type: 'soccer', color1: '#FFFFFF', color2: '#000000' },
        { id: 'ball_baseball', name: 'Baseball', cost: 1000, type: 'baseball', color1: '#FFFFFF', color2: '#FF0000' },
        { id: 'ball_8ball', name: 'Bille 8', cost: 1500, type: 'bille8', color1: '#000000', color2: '#111111', shininess: 0.8 },
        { id: 'ball_golf', name: 'Golf', cost: 1000, type: 'golf', color1: '#FFFFFF', color2: '#EEE' },
        { id: 'ball_watermelon', name: 'Pastèque', cost: 2000, type: 'watermelon', color1: '#FF6347', color2: '#228B22' },
        { id: 'ball_donut', name: 'Beigne', cost: 2500, type: 'donut', color1: '#FF69B4', color2: '#D2691E' },
        { id: 'ball_earth', name: 'Terre', cost: 3000, type: 'earth', color1: '#0000FF', color2: '#228B22' },
        { id: 'ball_lava', name: 'Magma', cost: 4000, type: 'lava', color1: '#FF4500', color2: '#8B0000' },
        { id: 'ball_rainbow', name: 'Arc-en-ciel', cost: 5000, type: 'basketball', color1: '#FF0000', color2: '#0000FF', texture: 'rainbow' },
        { id: 'ball_camo', name: 'Camouflage', cost: 2500, type: 'camo', color1: '#556B2F', color2: '#8B4513' },
        { id: 'ball_beach', name: 'Plage', cost: 1500, type: 'beach', color1: '#FFFF00', color2: '#0000FF' },
        { id: 'ball_eyeball', name: 'Oeil', cost: 3500, type: 'eyeball', color1: '#FFFFFF', color2: '#FF0000' }
    ];

    var SHOOTING_STYLES = [
        // KEPT
        { id: 'classic', name: 'Classique', cost: 0, desc: 'Style standard. Équilibré.', modifiers: {} },
        { id: 'curry', name: 'Chef Curry', cost: 0, desc: 'Tir rapide et fluide.', modifiers: { timingWindow: 0.9 } },

        // NEW REALISTIC (NBA LEGENDS)
        { id: 'jordan', name: 'The GOAT', cost: 0, desc: 'Suspension parfaite, saut maximal.', modifiers: { jumpVelocity: 9.4, timingWindow: 0.85 } },
        { id: 'kobe', name: 'Black Mamba', cost: 0, desc: 'Fadeaway technique et précis.', modifiers: { timingWindow: 0.8, speed: 1.1 } },
        { id: 'lebron', name: 'King James', cost: 0, desc: 'Tir puissant, recul léger.', modifiers: { jumpVelocity: 8.9, speed: 1.2 } },
        { id: 'kd', name: 'Slim Reaper', cost: 0, desc: 'Relâchement très haut, impossible à contrer.', modifiers: { speed: 0.9, timingWindow: 0.95 } },
        { id: 'ray', name: 'Jesus', cost: 0, desc: 'Mécanique robotique parfaite.', modifiers: { speed: 1.4, timingWindow: 0.9 } },
        { id: 'bird', name: 'Larry Legend', cost: 0, desc: 'Tir derrière la tête, très précis.', modifiers: { speed: 0.8, timingWindow: 1.2 } },
        { id: 'dirk', name: 'German Jesus', cost: 0, desc: 'Fadeaway sur une jambe.', modifiers: { timingWindow: 1.0, speed: 0.9 } },
        { id: 'kareem', name: 'Sky Hook', cost: 0, desc: 'Le bras roulé inarrêtable. (Au sol)', modifiers: { jumpVelocity: 0, speed: 0.8 } },
        { id: 'shaq', name: 'Diesel', cost: 0, desc: 'Tir à une main rigide.', modifiers: { jumpVelocity: 5.4, speed: 1.1, timingWindow: 0.7 } },
        { id: 'magic', name: 'Showtime', cost: 0, desc: 'Poussée du ballon, vision de jeu.', modifiers: { speed: 1.0 } },
        { id: 'harden', name: 'The Beard', cost: 0, desc: 'Step-back et pause.', modifiers: { timingWindow: 1.1, speed: 0.9 } },
        { id: 'luka', name: 'Luka Magic', cost: 0, desc: 'Tir lent mais hypnotique.', modifiers: { speed: 0.85, timingWindow: 1.15 } },
        { id: 'klay', name: 'Game 6', cost: 0, desc: 'Forme pure, pas de saut inutile.', modifiers: { speed: 1.3, timingWindow: 0.95 } },
        { id: 'reggie', name: 'Knick Killer', cost: 0, desc: 'Extension complète des bras.', modifiers: { speed: 1.2 } },
        { id: 'westbrook', name: 'Brodie', cost: 0, desc: 'Saut explosif, tir tendu.', modifiers: { jumpVelocity: 9.8, speed: 1.5, timingWindow: 0.6 } },
        { id: 'joker', name: 'Big Honey', cost: 0, desc: 'Tir derrière la tête. (Au sol)', modifiers: { jumpVelocity: 0, speed: 0.8 } },
        { id: 'trae', name: 'Ice Trae', cost: 0, desc: 'Poussée rapide depuis la poitrine.', modifiers: { speed: 1.3, timingWindow: 0.9 } },
        { id: 'ai', name: 'The Answer', cost: 0, desc: 'Armé très haut derrière la tête.', modifiers: { speed: 1.4, jumpVelocity: 8.9 } },
        { id: 'melo', name: 'Hoodie Melo', cost: 0, desc: 'Le tir le plus pur.', modifiers: { speed: 1.0, timingWindow: 1.0 } },
        { id: 'haliburton', name: 'Hali', cost: 0, desc: 'Tir bizarre à deux mains.', modifiers: { speed: 1.1, timingWindow: 0.8 } },
        { id: 'marion', name: 'The Matrix', cost: 0, desc: 'T-Rex shot. Très moche.', modifiers: { speed: 1.8, timingWindow: 0.7 } },
        { id: 'noah', name: 'Tornado', cost: 0, desc: 'La tornade à deux mains.', modifiers: { speed: 0.9, jumpVelocity: 7.2 } },
        { id: 'bol', name: 'Manute', cost: 0, desc: 'La catapulte géante.', modifiers: { speed: 0.7, jumpVelocity: 3.6 } },
        { id: 'sga', name: 'Timeline', cost: 0, desc: 'Lent et méthodique.', modifiers: { speed: 0.9, timingWindow: 1.1 } },

        // NEW SILLY / GROUNDED
        { id: 'granny', name: 'Rick Barry', cost: 0, desc: 'À la cuillère. (Au sol)', modifiers: { jumpVelocity: 0, speed: 0.7, timingWindow: 1.5 } },
        { id: 'bowling', name: 'Strike', cost: 0, desc: 'Lancer de bowling. (Au sol)', modifiers: { jumpVelocity: 0, speed: 0.6 } },
        { id: 'hadouken', name: 'Hadouken', cost: 0, desc: 'Boule de feu ! (Au sol)', modifiers: { jumpVelocity: 0, speed: 2.5, timingWindow: 0.5 } },
        { id: 'tpose', name: 'Le Glitch', cost: 0, desc: 'T-Pose menaçante. (Au sol)', modifiers: { jumpVelocity: 0, speed: 3.0, timingWindow: 0.3 } },
        { id: 'airbud', name: 'Le Museau', cost: 0, desc: 'Passe de la truffe.', modifiers: { speed: 1.2, jumpVelocity: 0 } },
        { id: 'telekinesis', name: 'Psychokinésie', cost: 0, desc: 'Par la pensée.', modifiers: { jumpVelocity: 0, speed: 2.0, timingWindow: 0.5 } },
        { id: 'peekaboo', name: 'Coucou !', cost: 0, desc: 'Où est-il ?', modifiers: { jumpVelocity: 0, speed: 0.8 } },
        { id: 'soccer', name: 'Touche', cost: 0, desc: 'Remise en jeu.', modifiers: { jumpVelocity: 0, speed: 1.1 } },
        { id: 'no_look', name: 'Aveugle', cost: 0, desc: 'Trop facile.', modifiers: { speed: 1.0 } },
        { id: 'shot_put', name: 'Poids', cost: 0, desc: 'Lancer lourd.', modifiers: { speed: 0.6 } },
        { id: 'dab', name: 'Le Dab', cost: 0, desc: 'Style swag.', modifiers: { speed: 1.0 } },
        { id: 'helicopter', name: 'Hélico', cost: 0, desc: 'Rotation rapide.', modifiers: { speed: 1.2 } },
        { id: 'prayer', name: 'Prière', cost: 0, desc: 'Espoir divin.', modifiers: { speed: 0.8, jumpVelocity: 4.5 } },
        { id: 'spirit_bomb', name: 'Esprit', cost: 0, desc: 'Chargez !', modifiers: { jumpVelocity: 0, speed: 2.0, timingWindow: 0.5 } }
    ];

    // Animation Keyframes (Optimized: Moved to global scope to avoid reallocation)
    const DEFAULT_IDLE = {
        la: Math.PI/2 - 0.2, ra: Math.PI/2 + 0.2, lfa: Math.PI/2 - 0.1, rfa: Math.PI/2 + 0.1, w: 0,
        la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0,
        guide_u: 0.5, guide_u_z: 0
    };
    const ANIM_DATA = {
        // --- REMASTERED REALISTIC (VERTICAL X/Y for FORWARD Z) ---
        // Standard high release (Vertical angles ~-1.6, High Z ~1.2)
        classic: {
            ready: { la: 0.5, ra: 2.6, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.1, ra_z: 0.1, lfa_z: 0.1, rfa_z: 0.1, guide_u: 0.5, guide_u_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.6, w: 0, la_z: 0.6, ra_z: 0.6, lfa_z: 0.6, rfa_z: 0.6, guide_u: -1.7, guide_u_z: 1.2 },
            release: { la: -1.6, ra: -1.6, lfa: -1.6, rfa: -1.6, w: 1.0, la_z: 1.2, ra_z: 1.4, lfa_z: 1.2, rfa_z: 1.4, guide_u: -1.7, guide_u_z: 1.3 }
        },
        curry: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.8, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2, guide_u: 0.5, guide_u_z: 0.2 },
            set: { la: -1.4, ra: -1.4, lfa: -2.2, rfa: -2.2, w: 0.5, la_z: 0.6, ra_z: 0.6, lfa_z: 0.6, rfa_z: 0.6, guide_u: -1.5, guide_u_z: 1.2 },
            release: { la: -1.5, ra: -1.5, lfa: -2.0, rfa: -1.5, w: 1.5, la_z: 1.3, ra_z: 1.5, lfa_z: 1.3, rfa_z: 1.5, guide_u: -1.6, guide_u_z: 1.3 }
        },
        jordan: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2, guide_u: 0.5, guide_u_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.7, w: 0, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5, guide_u: -1.8, guide_u_z: 1.2 }, // Wider elbow
            release: { la: -1.6, ra: -1.6, lfa: -1.2, rfa: -1.6, w: 1.6, la_z: 1.1, ra_z: 1.3, lfa_z: 1.1, rfa_z: 1.3, guide_u: -1.8, guide_u_z: 1.3 }
        },
        kobe: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2, guide_u: 0.5, guide_u_z: 0.2 },
            set: { la: -1.7, ra: -1.7, lfa: -1.6, rfa: -2.0, w: 0, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5, guide_u: -1.7, guide_u_z: 1.2 },
            release: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.6, w: 1.7, la_z: 1.2, ra_z: 1.4, lfa_z: 1.2, rfa_z: 1.4, guide_u: -1.7, guide_u_z: 1.3 }
        },
        lebron: {
            ready: { la: 0.4, ra: 2.4, lfa: 1.4, rfa: -1.6, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2, guide_u: 0.4, guide_u_z: 0.2 },
            set: { la: -1.6, ra: -1.7, lfa: -2.0, rfa: -2.0, w: 0, la_z: 0.6, ra_z: 0.6, lfa_z: 0.6, rfa_z: 0.6, guide_u: -2.0, guide_u_z: 1.1 }, // Flared
            release: { la: -1.7, ra: -1.6, lfa: -2.0, rfa: -1.6, w: 1.5, la_z: 1.1, ra_z: 1.3, lfa_z: 1.1, rfa_z: 1.3, guide_u: -2.0, guide_u_z: 1.2 }
        },
        kd: {
            ready: { la: 0.5, ra: 2.6, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2, guide_u: 0.5, guide_u_z: 0.2 },
            set: { la: -1.7, ra: -1.7, lfa: -1.6, rfa: -1.6, w: 0, la_z: 0.7, ra_z: 0.7, lfa_z: 0.7, rfa_z: 0.7, guide_u: -1.6, guide_u_z: 1.3 },
            release: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.6, w: 1.8, la_z: 1.3, ra_z: 1.5, lfa_z: 1.3, rfa_z: 1.5, guide_u: -1.6, guide_u_z: 1.4 }
        },
        ray: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.6, rfa: -1.9, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -2.0, rfa: -2.2, w: 0, la_z: 0.6, ra_z: 0.6, lfa_z: 0.6, rfa_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.8, rfa: -1.6, w: 1.6, la_z: 1.2, ra_z: 1.4, lfa_z: 1.2, rfa_z: 1.4 }
        },
        bird: {
            ready: { la: 0.5, ra: 2.6, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.4, ra: -1.4, lfa: -1.5, rfa: -1.5, w: 0.5, la_z: 0.3, ra_z: 0.3, lfa_z: 0.3, rfa_z: 0.3 }, // Behind head (less forward Z)
            release: { la: -1.6, ra: -1.6, lfa: -1.2, rfa: -1.6, w: 1.2, la_z: 1.2, ra_z: 1.4, lfa_z: 1.2, rfa_z: 1.4 }
        },
        dirk: {
            ready: { la: 0.5, ra: 2.6, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.5, w: 0, la_z: 0.8, ra_z: 0.8, lfa_z: 0.8, rfa_z: 0.8 }, // High release point
            release: { la: -1.6, ra: -1.6, lfa: -1.3, rfa: -1.5, w: 1.0, la_z: 1.3, ra_z: 1.5, lfa_z: 1.3, rfa_z: 1.5 }
        },
        kareem: { // Skyhook - Keeps Side Motion
            ready: { la: 1.0, ra: 1.0, lfa: 1.5, rfa: 1.5, w: 0, la_z: 0, ra_z: 0 },
            set: { la: 0.5, ra: 0.0, lfa: 2.0, rfa: -2.0, w: 0, la_z: 0, ra_z: 0 },
            release: { la: 0.5, ra: -3.0, lfa: 1.5, rfa: -3.1, w: 0.5, la_z: 0, ra_z: 0 }
        },
        shaq: { // Push - Less Flick
            ready: { la: 0.5, ra: 2.0, lfa: 1.5, rfa: -1.5, w: 0, la_z: 0.2, ra_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -1.2, rfa: -1.2, w: 0, la_z: 0.5, ra_z: 0.5 },
            release: { la: -1.5, ra: -1.5, lfa: -1.0, rfa: -1.2, w: 0.5, la_z: 1.0, ra_z: 1.2 }
        },
        magic: {
            ready: { la: 0.5, ra: 2.4, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -1.0, rfa: -1.0, w: 0, la_z: 0.6, ra_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.2, rfa: -1.4, w: 1.0, la_z: 1.2, ra_z: 1.4 }
        },
        harden: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2 },
            set: { la: -1.5, ra: -1.5, lfa: -2.0, rfa: -2.0, w: 0, la_z: 0.6, ra_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.8, rfa: -1.6, w: 1.5, la_z: 1.2, ra_z: 1.4 }
        },
        luka: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2 },
            set: { la: -1.7, ra: -1.7, lfa: -1.5, rfa: -1.8, w: 0.2, la_z: 0.6, ra_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.5, w: 1.4, la_z: 1.2, ra_z: 1.4 }
        },
        klay: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -1.8, rfa: -2.0, w: 0, la_z: 0.6, ra_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.7, rfa: -1.5, w: 1.5, la_z: 1.2, ra_z: 1.4 }
        },
        reggie: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2 },
            set: { la: -1.7, ra: -1.7, lfa: -1.8, rfa: -2.2, w: 0, la_z: 0.6, ra_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.5, w: 1.5, la_z: 1.2, ra_z: 1.4 }
        },
        westbrook: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.5, w: 0, la_z: 0.6, ra_z: 0.6, lfa_z: 0.6, rfa_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.6, rfa: -1.6, w: 2.0, la_z: 1.2, ra_z: 1.6, lfa_z: 1.2, rfa_z: 1.6 } // High jump snap
        },
        joker: { // Behind Head
            ready: { la: 0.5, ra: 2.6, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.4, ra: -1.4, lfa: -1.5, rfa: -1.5, w: 0, la_z: 0.1, ra_z: 0.1, lfa_z: 0.1, rfa_z: 0.1 }, // Less forward, more vertical X/Y behind head? No, behind head means Z is negative? Or just vertical with low Z? Let's use Vertical X/Y + Low Z.
            release: { la: -1.6, ra: -1.6, lfa: -1.6, rfa: -1.5, w: 0.8, la_z: 1.1, ra_z: 1.3, lfa_z: 1.1, rfa_z: 1.3 }
        },
        trae: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.4, ra: -1.4, lfa: -1.8, rfa: -1.8, w: 0.5, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5 },
            release: { la: -1.2, ra: -1.2, lfa: -1.6, rfa: -1.2, w: 1.0, la_z: 1.3, ra_z: 1.5, lfa_z: 1.3, rfa_z: 1.5 } // Push forward
        },
        ai: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.4, ra: -1.4, lfa: -1.5, rfa: -1.5, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            release: { la: -1.6, ra: -1.6, lfa: -1.6, rfa: -1.6, w: 1.8, la_z: 1.2, ra_z: 1.4, lfa_z: 1.2, rfa_z: 1.4 }
        },
        melo: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.7, ra: -1.7, lfa: -1.6, rfa: -1.8, w: 0, la_z: 0.6, ra_z: 0.6, lfa_z: 0.6, rfa_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.6, w: 1.5, la_z: 1.2, ra_z: 1.4, lfa_z: 1.2, rfa_z: 1.4 }
        },
        haliburton: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.5, ra: -1.5, lfa: -1.5, rfa: -1.5, w: 0, la_z: 0.7, ra_z: 0.7, lfa_z: 0.7, rfa_z: 0.7 },
            release: { la: -1.5, ra: -1.5, lfa: -1.5, rfa: -1.5, w: 1.0, la_z: 1.3, ra_z: 1.4, lfa_z: 1.3, rfa_z: 1.4 }
        },
        marion: {
            ready: { la: 0.5, ra: 2.5, lfa: 2.0, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.4, ra: -1.4, lfa: -2.0, rfa: -2.0, w: 0, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5 },
            release: { la: -1.4, ra: -1.4, lfa: -2.0, rfa: -1.2, w: 0.2, la_z: 1.2, ra_z: 1.3, lfa_z: 1.2, rfa_z: 1.3 }
        },
        noah: { // Tornado: keep weird
            ready: { la: 0.5, ra: 2.6, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.8, ra: -1.8, lfa: 0.5, rfa: -0.5, w: 1.0, la_z: 0.3, ra_z: 0.3, lfa_z: 0.3, rfa_z: 0.3 },
            release: { la: -1.5, ra: -0.8, lfa: 0.2, rfa: -0.2, w: 0, la_z: 0.8, ra_z: 1.0, lfa_z: 0.8, rfa_z: 1.0 }
        },
        bol: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.3, ra: -1.3, lfa: -1.2, rfa: -1.2, w: 0, la_z: 0.1, ra_z: 0.1, lfa_z: 0.1, rfa_z: 0.1 },
            release: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.5, w: 0.5, la_z: 1.2, ra_z: 1.4, lfa_z: 1.2, rfa_z: 1.4 }
        },
        sga: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -1.8, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -1.6, ra: -1.6, lfa: -1.5, rfa: -1.5, w: 0.2, la_z: 0.6, ra_z: 0.6, lfa_z: 0.6, rfa_z: 0.6 },
            release: { la: -1.6, ra: -1.6, lfa: -1.2, rfa: -1.5, w: 1.2, la_z: 1.2, ra_z: 1.4, lfa_z: 1.2, rfa_z: 1.4 }
        },

        // --- NEW SILLY / GROUNDED ---
        granny: {
            ready: { la: 0.8, ra: 0.8, lfa: 2.0, rfa: 2.0, w: 0, la_z: 0.8, ra_z: 0.8, lfa_z: 0.8, rfa_z: 0.8 },
            set: { la: 1.0, ra: 1.2, lfa: 2.2, rfa: 2.2, w: 0, la_z: 0.8, ra_z: 0.8, lfa_z: 0.8, rfa_z: 0.8 }, // Low between legs
            release: { la: -1.0, ra: -1.0, lfa: 0.5, rfa: 0.5, w: 0, la_z: 1.4, ra_z: 1.4, lfa_z: 1.4, rfa_z: 1.4 } // Underhand scoop
        },
        bowling: {
            ready: { la: 0.2, ra: 1.5, lfa: 2.0, rfa: 1.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: 0.5, ra: 2.0, lfa: 0.2, rfa: -1.0, w: 0.2, la_z: 0.2, ra_z: -0.5, lfa_z: 0.2, rfa_z: -0.5 }, // Arm back
            release: { la: 0.5, ra: 0.2, lfa: 0.2, rfa: 0.5, w: 0.5, la_z: 0.2, ra_z: 1.4, lfa_z: 0.2, rfa_z: 1.4 } // Arm forward low
        },
        hadouken: {
            ready: { la: 1.5, ra: 1.5, lfa: 2.5, rfa: 0.5, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: 1.8, ra: 1.8, lfa: 2.9, rfa: 0.4, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 }, // Charge at hip
            release: { la: -1.5, ra: -1.6, lfa: -0.1, rfa: -0.1, w: 0, la_z: 1.5, ra_z: 1.5, lfa_z: 1.5, rfa_z: 1.5 } // Thrust forward
        },
        tpose: {
            ready: { la: 0, ra: 0, lfa: 0, rfa: 0, w: 0, la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0 },
            set: { la: 0, ra: 0, lfa: 0, rfa: 0, w: 0, la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0 },
            release: { la: 0, ra: 0, lfa: 0, rfa: 0, w: 0, la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0 } // Rigid
        },
        airbud: {
            ready: { la: 0.5, ra: 2.6, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0 }, // Holding ball (Classic Ready)
            set: { la: 1.3, ra: 1.8, lfa: 1.3, rfa: 1.8, w: 0, la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0 }, // Paws drop down (Tuck)
            release: { la: 1.5, ra: 1.6, lfa: 1.5, rfa: 1.6, w: 0, la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0 } // Stay down
        },
        telekinesis: {
            ready: { la: 1.5, ra: 1.6, lfa: 1.5, rfa: 1.6, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 }, // Sides
            set: { la: -2.0, ra: -1.1, lfa: -0.5, rfa: -2.6, w: 0, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5 }, // Temples
            release: { la: -0.5, ra: -2.6, lfa: -0.5, rfa: -2.6, w: 0, la_z: 0.8, ra_z: 0.8, lfa_z: 0.8, rfa_z: 0.8 } // Fling Out
        },
        peekaboo: {
            ready: { la: -2.0, ra: -1.1, lfa: -0.5, rfa: -2.6, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 }, // Hands on face
            set: { la: -2.0, ra: -1.1, lfa: -0.5, rfa: -2.6, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 }, // Still on face
            release: { la: -0.5, ra: -2.6, lfa: -0.5, rfa: -2.6, w: 0, la_z: 0.8, ra_z: 0.8, lfa_z: 0.8, rfa_z: 0.8 } // Fling Out
        },
        soccer: {
            ready: { la: 2.5, ra: 0.6, lfa: 2.0, rfa: 1.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 }, // Overhead
            set: { la: 2.8, ra: 0.3, lfa: 2.5, rfa: 0.5, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 }, // Back
            release: { la: -1.5, ra: -1.6, lfa: 0.1, rfa: -0.1, w: 0, la_z: 1.3, ra_z: 1.3, lfa_z: 1.3, rfa_z: 1.3 } // Throw
        },
        no_look: {
            ready: { la: 0.5, ra: 2.6, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -2.2, ra: -2.2, lfa: -0.5, rfa: -0.8, w: 0, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5 },
            release: { la: -2.0, ra: -Math.PI/2 - 0.2, lfa: -0.8, rfa: -Math.PI/2 - 0.1, w: 1.0, la_z: 1.0, ra_z: 1.2, lfa_z: 1.0, rfa_z: 1.2 }
        },
        shot_put: {
            ready: { la: 0.5, ra: 2.0, lfa: 1.5, rfa: -2.5, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 }, // Ball at neck
            set: { la: -1.0, ra: -1.0, lfa: -1.0, rfa: -2.8, w: 0, la_z: 0.2, ra_z: 0.4, lfa_z: 0.2, rfa_z: 0.4 }, // Crouch
            release: { la: -2.0, ra: -1.5, lfa: -2.0, rfa: -0.5, w: 0, la_z: 0.2, ra_z: 1.3, lfa_z: 0.2, rfa_z: 1.3 } // Push out
        },
        dab: {
            ready: { la: 0.5, ra: 2.5, lfa: 1.5, rfa: -2.0, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 },
            set: { la: -2.0, ra: -2.0, lfa: -1.0, rfa: -1.0, w: 0, la_z: 0.5, ra_z: 0.2, lfa_z: 0.5, rfa_z: 0.2 },
            release: { la: -0.5, ra: -2.5, lfa: 2.5, rfa: -0.5, w: 0, la_z: 0.5, ra_z: 0.8, lfa_z: 0.5, rfa_z: 0.8 } // Dab pose
        },
        helicopter: {
            ready: { la: 3.0, ra: 3.0, lfa: 0, rfa: 0, w: 0, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5 }, // Arms up
            set: { la: 0, ra: 0, lfa: 0, rfa: 0, w: 0, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5 }, // Down
            release: { la: 3.0, ra: 3.0, lfa: 0, rfa: 0, w: 0, la_z: 0.5, ra_z: 0.5, lfa_z: 0.5, rfa_z: 0.5 } // Up again
        },
        prayer: {
            ready: { la: -1.5, ra: -1.6, lfa: -1.0, rfa: -2.1, w: 0, la_z: 0.2, ra_z: 0.2, lfa_z: 0.2, rfa_z: 0.2 }, // Hands clasped
            set: { la: -1.8, ra: -1.9, lfa: -1.0, rfa: -2.1, w: 0, la_z: 0.4, ra_z: 0.4, lfa_z: 0.4, rfa_z: 0.4 }, // Look up
            release: { la: -2.0, ra: -2.1, lfa: -0.5, rfa: -2.6, w: 0, la_z: 1.0, ra_z: 1.0, lfa_z: 1.0, rfa_z: 1.0 } // Reach up
        },
        spirit_bomb: {
            ready: { la: 2.5, ra: 0.6, lfa: 2.5, rfa: 0.6, w: 0, la_z: 0.1, ra_z: 0.1, lfa_z: 0.1, rfa_z: 0.1 }, // Hands high V shape
            set: { la: 2.8, ra: 0.3, lfa: 2.8, rfa: 0.3, w: 0, la_z: 0.1, ra_z: 0.1, lfa_z: 0.1, rfa_z: 0.1 }, // Charge
            release: { la: -1.5, ra: -1.6, lfa: -0.1, rfa: -0.1, w: 0, la_z: 1.4, ra_z: 1.4, lfa_z: 1.4, rfa_z: 1.4 } // Throw down
        }
    };

    var HAIRSTYLES = [
        { id: 'default', name: 'Par Défaut', cost: 0 },
        { id: 'bald_clean', name: 'Clean Shave', cost: 0 },
        { id: 'bald_stubble', name: 'Stubble', cost: 0 },
        { id: 'buzz_cut', name: 'Buzz Cut', cost: 0 },
        { id: 'buzz_colored', name: 'The Worm', cost: 0 },
        { id: 'fade_retro', name: '80s Fade', cost: 0 },
        { id: 'fade_box', name: 'Flat Top', cost: 0 },
        { id: 'fade_high', name: 'High Fade', cost: 0 },
        { id: 'fade_king', name: 'King\'s Crown', cost: 0 },
        { id: 'fade_chef', name: 'Chef Fade', cost: 0 },
        { id: 'curls_textured', name: 'Textured Curls', cost: 0 },
        { id: 'afro_mini', name: 'Mini Fro', cost: 0 },
        { id: 'afro_70s', name: 'Classic Afro', cost: 0 },
        { id: 'cornrows_straight', name: 'The Answer', cost: 0 },
        { id: 'cornrows_braids', name: 'Braided Rows', cost: 0 },
        { id: 'braids_box', name: 'Box Braids', cost: 0 },
        { id: 'dreads_long', name: 'Dreads', cost: 0 },
        { id: 'dreads_tied', name: 'Tied Dreads', cost: 0 },
        { id: 'mullet_80s', name: 'Legend Mullet', cost: 0 },
        { id: 'long_flow', name: 'Euro Flow', cost: 0 },
        { id: 'slicked_back', name: 'The Anchor', cost: 0 },
        { id: 'mohawk_fade', name: 'Beard & Hawk', cost: 0 },
        { id: 'top_knot', name: 'Top Knot', cost: 0 },
        { id: 'crew_messy', name: 'Messy Crew', cost: 0 },
        { id: 'fade_pompadour', name: 'Luka Pomp', cost: 0 },
        { id: 'anchor_man_80s', name: 'The Newsman', cost: 0 },
        { id: 'fade_low', name: 'Low Fade', cost: 0 },
        { id: 'waves_360', name: '360 Waves', cost: 0 },
        { id: 'dreads_short', name: 'Short Dreads', cost: 0 },
        { id: 'afro_taper', name: 'Tapered Fro', cost: 0 },
        { id: 'braids_zigzag', name: 'Zig-Zag Braids', cost: 0 },
        { id: 'slick_side_part', name: 'Gentleman', cost: 0 },
        { id: 'mohawk_short', name: 'Mini Hawk', cost: 0 },
        { id: 'caesar_cut', name: 'Caesar', cost: 0 },
        { id: 'buzz_line', name: 'Buzz + Line', cost: 0 },
        { id: 'curly_top_fade', name: 'Curly Top', cost: 0 },
        { id: 'shaggy_top', name: 'Messy Shag', cost: 0 },
        { id: 'side_swept_fringe', name: 'Emo Bangs', cost: 0 },
        { id: 'surfer_flow', name: 'Surfer', cost: 0 },
        { id: 'ivy_league', name: 'Ivy League', cost: 0 },
        { id: 'undercut_slick', name: 'Undercut', cost: 0 },
        // Medium Hairstyles
        { id: 'med_bob', name: 'Classic Bob', cost: 0 },
        { id: 'med_shag', name: 'The Shag', cost: 0 },
        { id: 'med_curtain', name: 'Curtain Bangs', cost: 0 },
        { id: 'med_wolf', name: 'Wolf Cut', cost: 0 },
        { id: 'med_wavy', name: 'Wavy Shoulder', cost: 0 },
        { id: 'med_curly', name: 'Curly Shoulder', cost: 0 },
        { id: 'med_twist', name: 'Twist Out', cost: 0 },
        { id: 'med_braids', name: 'Medium Braids', cost: 0 },
        { id: 'med_slick', name: 'Medium Slick', cost: 0 },
        { id: 'med_bedhead', name: 'Bedhead', cost: 0 },
        { id: 'med_bun', name: 'Half-Up Bun', cost: 0 },
        { id: 'med_undercut', name: 'Long Undercut', cost: 0 },
        // Custom Slots
        { id: 'custom_0', name: 'Custom 1', cost: 0, isCustom: true },
        { id: 'custom_1', name: 'Custom 2', cost: 0, isCustom: true },
        { id: 'custom_2', name: 'Custom 3', cost: 0, isCustom: true },
        { id: 'custom_3', name: 'Custom 4', cost: 0, isCustom: true },
        { id: 'custom_4', name: 'Custom 5', cost: 0, isCustom: true }
    ];

    var DAILY_CHALLENGES_MAP = new Map(DAILY_CHALLENGES.map(c => [c.id, c]));
    var WEEKLY_CHALLENGES_MAP = new Map(WEEKLY_CHALLENGES.map(c => [c.id, c]));
    var CLOTHING_DB_MAP = new Map(CLOTHING_DB.map(c => [c.id, c]));
    var HATS_DB_MAP = new Map(HATS_DB.map(c => [c.id, c]));
    var SKINS_DB_MAP = new Map(SKINS_DB.map(s => [s.id, s]));
    var PANTS_DB_MAP = new Map(PANTS_DB.map(p => [p.id, p]));
    var SHOES_DB_MAP = new Map(SHOES_DB.map(s => [s.id, s]));
    var BALLS_DB_MAP = new Map(BALLS_DB.map(b => [b.id, b]));
    var CAT_SKINS_DB_MAP = new Map(CAT_SKINS_DB.map(c => [c.id, c]));
    var CAT_ACCESSORIES_DB_MAP = new Map(CAT_ACCESSORIES_DB.map(a => [a.id, a]));
    var SHOOTING_STYLES_MAP = new Map(SHOOTING_STYLES.map(s => [s.id, s]));
    var ACHIEVEMENTS_MAP = new Map(ACHIEVEMENTS.map(a => [a.id, a]));

    var HATS_INDEX_MAP = new Map(HATS_DB.map((h, i) => [h.id, i]));
    var CLOTHING_INDEX_MAP = new Map(CLOTHING_DB.map((c, i) => [c.id, i]));
    var PANTS_INDEX_MAP = new Map(PANTS_DB.map((p, i) => [p.id, i]));
    var SHOES_INDEX_MAP = new Map(SHOES_DB.map((s, i) => [s.id, i]));
    var HAIRSTYLES_INDEX_MAP = new Map(HAIRSTYLES.map((h, i) => [h.id, i]));
    var BALLS_INDEX_MAP = new Map(BALLS_DB.map((b, i) => [b.id, i]));
    var CAT_SKINS_INDEX_MAP = new Map(CAT_SKINS_DB.map((c, i) => [c.id, i]));
    var CAT_ACCESSORIES_INDEX_MAP = new Map(CAT_ACCESSORIES_DB.map((a, i) => [a.id, i]));
    var SHOOTING_STYLES_INDEX_MAP = new Map(SHOOTING_STYLES.map((s, i) => [s.id, i]));

// --- END data.js ---
