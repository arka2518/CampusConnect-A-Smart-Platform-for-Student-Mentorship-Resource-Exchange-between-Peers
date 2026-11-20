# Dummy Image Placeholders & Asset Directory

This directory contains placeholder images for the **CampusConnect** platform.

## Folder Structure:
- `/brand/`: Contains the CampusConnect logo & site favicon (`campus-connect-icon.svg`)
- `/apartments/`: Contains room & accommodation images (`apt-1.jpg`, `apt-2.jpg`, etc.)
- `/mentors/`: Contains mentor profile pictures (`mentor-1.jpg`, `mentor-2.jpg`, etc.)
- `/resources/`: Contains academic textbook & equipment pictures (`res-1.jpg`, `res-2.jpg`, etc.)

## How to replace with your own photos:
1. **Option A (Direct Replacement):** You can drop your own photos (e.g., `apt-1.jpg`, `mentor-1.png`) into these folders and update or replace the references in `src/data/mockData.ts`.
2. **Option B (File Extension Overwrite):** If you name your file `apt-1.svg` or customize the `image` property in `mockData.ts` to point to your new `.jpg` / `.png` / `.webp` file, it will immediately display on the website!
