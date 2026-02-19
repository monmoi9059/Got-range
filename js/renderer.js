<<<<<<< SEARCH
        else if (type === 'cat_hoop') {
             // Calculate Age/Size based on Lifetime Makes
             const makes = playerData.lifetimeStats.makes;
             let ageScale = 0.6; // Baby
             let furColor = '#D2B48C'; // Tan/Orange
             let bellyColor = '#F5F5DC'; // Cream

             if (makes >= 500) {
                 ageScale = 1.6; // Giant/Old
                 furColor = '#A9A9A9'; // Grey
             } else if (makes >= 200) {
                 ageScale = 1.3; // Fat
                 furColor = '#8B4513'; // Darker Brown
             } else if (makes >= 50) {
                 ageScale = 1.0; // Adult
                 furColor = '#D2691E'; // Orange
             }

             const s = p.scale * ageScale;
=======
        else if (type === 'cat_hoop') {
             // Calculate Age/Size based on Lifetime Makes
             const makes = playerData.lifetimeStats.makes;
             let ageScale = 0.1; // Kitten (Tiny)
             let furColor = '#D2B48C'; // Tan/Orange
             let bellyColor = '#F5F5DC'; // Cream

             // Accelerated Growth: Max size at 100 makes
             if (makes >= 100) {
                 ageScale = 1.6; // Giant/Old
                 furColor = '#A9A9A9'; // Grey
             } else if (makes >= 50) {
                 ageScale = 1.0; // Fat/Adult
                 furColor = '#8B4513'; // Darker Brown
             } else if (makes >= 10) {
                 ageScale = 0.4; // Adolescent
                 furColor = '#D2691E'; // Orange
             }

             const s = p.scale * ageScale;
>>>>>>> REPLACE
