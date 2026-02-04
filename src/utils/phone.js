// Function to apply Brazilian phone mask
export const formatPhone = (value) => {
  if (!value) return ''
  // Remove everything that is not a digit
  const numbers = value.replace(/\D/g, '')
  // Apply mask according to length
  if (numbers.length <= 10) {
    // Landline: (XX) XXXX-XXXX
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    // Mobile: (XX) XXXXX-XXXX
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
}

// Function to remove mask (save only numbers)
export const removePhoneMask = (value) => {
  return value.replace(/\D/g, '')
}

