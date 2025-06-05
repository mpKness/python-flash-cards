// utils.js

/**
 * Returns a random hex color string.
 */
export function getRandomColor() {
    // Generate a number for 0 to 0xFFFFFF (16, 777, 215)
    const rand = Math.floor(Math.random() * 0x1000000);
    
    // Convert to hex and pad to 6 digits.
    const hex = rand.toString(16).padStart(6, '0');
    return `#${hex}`;
}
