//This function generates a 5-character random string that starts with "REF_".
function generateShortId() {
    // Generates a 5-character random string
    const randomPart = Math.random().toString(36).substring(2, 7);
    return `REF_${randomPart}`;
  }
  
  export { generateShortId };