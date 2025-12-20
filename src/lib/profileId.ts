export function generateProfileId(firstName: string, lastName: string, dateOfBirth: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()
  
  const birthYear = new Date(dateOfBirth).getFullYear()
  const lastTwoDigits = birthYear.toString().slice(-2)
  
  const randomDigits = Math.floor(Math.random() * 9000 + 1000)
  
  return `${firstInitial}${lastInitial}${randomDigits}${lastTwoDigits}`
}

export function validateProfileIdFormat(profileId: string): boolean {
  const regex = /^[A-Z]{2}\d{6}$/
  return regex.test(profileId)
}
