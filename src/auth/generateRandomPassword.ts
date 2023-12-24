function getRandomCharFrom(str: string): string {
  return str[Math.floor(Math.random() * str.length)];
}

function shuffleArray(array: string[]): string[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateRandomPassword(): string {
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = lowercaseChars.toUpperCase();
  const numberChars = '0123456789';
  const specialChars = '!@#$%&?';

  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  const password = [];

  password.push(
    getRandomCharFrom(uppercaseChars),
    getRandomCharFrom(lowercaseChars),
    getRandomCharFrom(numberChars),
    getRandomCharFrom(specialChars),
  );

  for (let i = 4; i < 8; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  return shuffleArray(password).join('');
}

export default generateRandomPassword;
