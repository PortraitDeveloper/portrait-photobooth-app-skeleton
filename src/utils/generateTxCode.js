function generateTxCode(deviceCode) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = `PB-${deviceCode}-`;

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

module.exports = generateTxCode;

// function generateTxCode(deviceCode) {
//   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let result = `PB-${deviceCode}-`;

//   for (let i = 0; i < 8; i++) {
//     const randomIndex = Math.floor(Math.random() * characters.length);
//     result += characters[randomIndex];
//   }

//   console.log(result);
// }

// generateTxCode("PBX1");
