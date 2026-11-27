// UI words for the public waiver page and the admin screens. The waiver TEXT itself comes from the API
// (GET /waivers/current) - nothing legal lives here, only labels, hints and error messages.

export const waiverText = {
  pageTitle: "Boarding Waiver | Paws N' Play",
  loadError: "We couldn't load the waiver. Check your connection and try again.",
  signTitle: 'Your signature',
  signHint: 'Fill in your details, tick the box and sign below. Everything marked * is needed.',
  parentName: "Pet parent's name",
  dogName: "Dog's name",
  phone: 'Phone number',
  date: 'Date',
  signature: 'Signature',
  typedSignature: 'Type your full name to sign',
  typedSignatureHint: "Exactly as in Pet parent's name above.",
  optional: 'Optional',
  otherConsents: 'Please also confirm',
  submit: 'Sign and send',
  sending: 'Sending…',
  reload: 'Reload the waiver',
  checkErrors: 'Please check the highlighted items above.',

  // Validation (the server checks the same rules)
  tickRequired: 'Please tick to confirm.',
  tickThis: (shortLabel: string) => `Please tick: ${shortLabel}`,
  parentNameRequired: 'Please enter your name.',
  dogNameRequired: "Please enter your dog's name.",
  phoneRequired: 'Please enter your phone number.',
  phoneInvalid: 'Please enter a valid phone number.',
  signatureRequired: 'Please sign in the box (a full signature, not just a dot).',
  typedRequired: 'Please type your full name to sign.',
  typedMismatch: "This must match the pet parent's name above.",

  // Submit errors
  genericError: 'Something went wrong. Please try again.',
  networkError: "We couldn't reach our server. Check your internet connection and try again.",
  tooMany: 'Too many attempts from this connection. Please wait a little and try again.',
  outdated: 'The waiver was updated while you were reading it. Please reload it, check the ticks and sign again.',

  // Success
  doneTitle: 'Thank you! Your waiver is signed.',
  doneText: (dogName: string) =>
    `We have your signed waiver${dogName ? ` for ${dogName}` : ''}. Thank you for trusting us with your dog - we can't wait to meet them.`,
  signedAt: 'Signed',
  reference: 'Reference',
};
