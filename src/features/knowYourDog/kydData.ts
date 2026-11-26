// "Know Your Dog" questionnaire content (public form at /know-your-dog), as data.
// Keys are the exact `answers` keys the server whitelists (BACKEND_API_SPEC §7.12) - don't rename them.
// Section notes may use **bold** (rendered with the FAQ inline parser).

export const MAX_FILES = 5;

export interface ChoiceOption {
  value: string;
  label: string;
}

const YES_NO: ChoiceOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

interface FieldBase {
  key: string;
  label: string;
  hint?: string;
  /** Error message when empty; presence makes the field required. */
  required?: string;
  /** Half width on wide screens (two per row). */
  half?: boolean;
}

export interface TextFieldDef extends FieldBase {
  kind: 'text';
  maxLength: number;
  multiline?: boolean;
  placeholder?: string;
  phone?: boolean;
  autoComplete?: 'name' | 'tel' | 'street-address';
}
export interface ChoiceFieldDef extends FieldBase {
  kind: 'choice';
  options: ChoiceOption[];
}
export interface DateFieldDef extends FieldBase {
  kind: 'date';
}
/** The eight "Fine / Unsure / Not okay" rows (with_<key> + with_<key>_note). */
export interface RatesFieldDef {
  kind: 'rates';
  key: 'rates';
}
/** Vaccination / deworming record files. */
export interface DocumentsFieldDef {
  kind: 'documents';
  key: 'documents';
  label: string;
}
export interface ConfirmFieldDef {
  kind: 'confirm';
  key: 'confirmTrue';
  label: string;
  required: string;
}

export type FieldDef = TextFieldDef | ChoiceFieldDef | DateFieldDef | RatesFieldDef | DocumentsFieldDef | ConfirmFieldDef;

export interface KydSection {
  n: number;
  title: string;
  note?: string;
  fields: FieldDef[];
}

/** Social rows: [key, label]. Answers: with_<key> (fine|unsure|not_okay) and with_<key>_note. */
export const RATE_ROWS: Array<{ key: string; label: string }> = [
  { key: 'biggerDogs', label: 'Dogs bigger than them' },
  { key: 'smallerDogs', label: 'Dogs smaller than them' },
  { key: 'maleDogs', label: 'Male dogs' },
  { key: 'femaleDogs', label: 'Female dogs' },
  { key: 'puppies', label: 'Puppies or very playful dogs' },
  { key: 'newPeople', label: 'New people' },
  { key: 'men', label: 'Men' },
  { key: 'women', label: 'Women' },
];

export const RATE_OPTIONS: Array<ChoiceOption & { tone: 'success' | 'accent' | 'danger' }> = [
  { value: 'fine', label: 'Fine', tone: 'success' },
  { value: 'unsure', label: 'Unsure', tone: 'accent' },
  { value: 'not_okay', label: 'Not okay', tone: 'danger' },
];

export const RATE_NOTE_PLACEHOLDER = 'Story behind it (optional)';
export const RATE_NOTE_MAX = 300;

const text = (key: string, label: string, maxLength: number, extra: Partial<TextFieldDef> = {}): TextFieldDef => ({
  kind: 'text', key, label, maxLength, ...extra,
});
const choice = (key: string, label: string, options: ChoiceOption[], extra: Partial<ChoiceFieldDef> = {}): ChoiceFieldDef => ({
  kind: 'choice', key, label, options, ...extra,
});
const date = (key: string, label: string, extra: Partial<DateFieldDef> = {}): DateFieldDef => ({ kind: 'date', key, label, ...extra });

export const kydSections: KydSection[] = [
  {
    n: 1,
    title: 'You and your emergency contact',
    fields: [
      text('ownerName', 'Your name', 100, { required: 'Please enter your name.', autoComplete: 'name' }),
      text('ownerPhone', 'Phone and WhatsApp number', 20, { required: 'Please enter a phone number we can reach you on.', phone: true, autoComplete: 'tel' }),
      text('address', 'Home address', 500, { multiline: true, autoComplete: 'street-address' }),
      text('emergencyName', 'Emergency contact name and relation', 100, {
        required: 'Please add an emergency contact.',
        hint: "Someone who can make decisions and collect your dog if we can't reach you.",
        placeholder: 'e.g. Riya Sharma, sister',
      }),
      text('emergencyPhone', 'Emergency contact phone', 20, { required: 'Please add their phone number.', phone: true }),
    ],
  },
  {
    n: 2,
    title: 'About your dog',
    fields: [
      text('dogName', "Dog's name", 60, { required: "Please enter your dog's name.", half: true }),
      text('breed', 'Breed', 60, { required: 'Please enter the breed (or Indie / mixed).', hint: 'Or Indie / mixed', half: true }),
      text('age', 'Age', 40, { required: "Please enter your dog's age.", placeholder: 'e.g. 3 years', half: true }),
      text('weight', 'Approximate weight', 40, { placeholder: 'e.g. 18 kg', half: true }),
      choice('sex', 'Sex', [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }], { required: 'Please choose one.' }),
      choice('sterilised', 'Sterilised?', YES_NO, { required: 'Please choose one.' }),
      // Shown only for unsterilised females (see isFieldVisible).
      text('heatInfo', 'Date of her last heat, and is she due during this stay?', 500, { multiline: true }),
    ],
  },
  {
    n: 3,
    title: 'Health',
    note: 'Please also send us a photo or PDF of the **vaccination and deworming record** below.',
    fields: [
      date('rabiesDate', 'Last anti-rabies vaccination', { half: true }),
      date('comboVaccineDate', 'Last combined vaccination', { hint: '7-in-1 or similar', half: true }),
      date('dewormingDate', 'Last deworming', { half: true }),
      text('tickFlea', 'Tick and flea prevention used, and when', 200, { hint: 'Spot-on / chewable / collar / tick bath / none' }),
      text('skinIssues', 'Any ticks, fleas or skin problems right now?', 300),
      text('recentIllness', 'Any illness in the past week?', 300, { hint: 'Cough, vomiting, loose motions' }),
      text('conditions', 'Any medical conditions, past surgeries or injuries we should know about?', 1000, { multiline: true }),
      text('medication', 'Any medication?', 1000, { hint: 'Name, dose and timing', multiline: true }),
      text('allergies', 'Any allergies?', 300, { hint: 'Food, medicine, anything else' }),
      text('vet', "Your regular vet's name and phone number", 200),
      { kind: 'documents', key: 'documents', label: 'Vaccination and deworming records' },
    ],
  },
  {
    n: 4,
    title: 'Food and water',
    note: 'Our standard meals are **rice and chicken cooked with a seasonal vegetable, twice a day, plus treats**.',
    fields: [
      text('homeDiet', 'What does your dog eat at home, and how many meals a day?', 500, { multiline: true }),
      choice('standardMealOk', 'Is our standard meal fine for your dog?', YES_NO),
      text('specialFood', 'Will you send special food or kibble? If yes, how much and when should we give it?', 500, { multiline: true }),
      choice('extraMeal', 'Does your dog need an extra meal?', YES_NO, { hint: 'Chargeable at ₹150 per meal' }),
      text('avoidFoods', 'Any foods or treats to avoid?', 300),
      choice('ownBowls', 'Do you want separate water or food bowls for your dog?', YES_NO, { hint: 'The bowls are to be provided by you' }),
      text('eatingStyle', 'Is your dog a fussy or slow eater, or do they eat too fast?', 300),
    ],
  },
  {
    n: 5,
    title: 'With other dogs and with people',
    note: 'For each one, tell us: fine, unsure or not okay. Add a line if there is a story behind it.',
    fields: [
      { kind: 'rates', key: 'rates' },
      text('breedsDislike', "Any particular breed or type of dog they don't get along with?", 300),
      text('fightHistory', 'Has your dog ever been in a fight with another dog? What happened?', 1000, { multiline: true }),
      text('biteHistory', 'Has your dog ever bitten or snapped at a person? What happened?', 1000, { multiline: true }),
      text('boardingBefore', 'Has your dog stayed at a boarding or daycare before? How did it go?', 1000, { multiline: true }),
    ],
  },
  {
    n: 6,
    title: 'Triggers and quirks',
    note: 'Tell us anything that sets your dog off, however small it seems.',
    fields: [
      text('foodGuarding', 'Does your dog guard food or their bowl from other dogs or people?', 300),
      text('toyGuarding', 'Does your dog guard toys, bones or chews?', 300),
      text('placeGuarding', 'Does your dog guard their bed, a spot, or a favourite person?', 300),
      text('noiseFear', 'Is your dog scared of loud noises?', 300, { hint: 'Thunder, crackers, vehicles' }),
      text('aloneBehaviour', 'How is your dog when left alone or away from you?', 300),
      text('handlingDislikes', 'Is there any kind of touch or handling your dog dislikes?', 300, {
        hint: 'Paws, ears, tail, being picked up, bathing, being woken',
      }),
      text('escapeRisk', 'Does your dog try to escape?', 300, { hint: 'Jumping walls, digging, bolting through open doors or gates' }),
      text('barking', 'Does your dog bark a lot, and at what?', 300),
      text('eatsObjects', "Does your dog eat things they shouldn't?", 300, { hint: 'Stones, socks, plastic' }),
      text('calmingTips', 'What calms your dog down when they are stressed?', 300),
    ],
  },
  {
    n: 7,
    title: 'Routine and extras',
    fields: [
      text('sleep', 'Where does your dog sleep at home?', 200, { hint: 'Own bed, your bed, floor, crate' }),
      text('toilet', 'When and where does your dog usually pee and poop?', 300, { hint: 'On walks, in a garden, on a schedule' }),
      text('exercise', 'How much exercise is your dog used to in a day?', 200),
      choice('bath', 'Would you like a bath and dry added to the stay?', YES_NO, { hint: 'Chargeable at ₹750' }),
      text('anythingElse', 'Anything else you want us to know about your dog?', 2000, { multiline: true }),
    ],
  },
  {
    n: 8,
    title: 'Confirm',
    fields: [
      {
        kind: 'confirm',
        key: 'confirmTrue',
        label: 'I confirm that everything above is complete and true to the best of my knowledge.',
        required: 'Please tick to confirm.',
      },
      text('signName', 'Your name', 100, { required: 'Please type your name.', half: true }),
      date('signDate', 'Date', { half: true }),
    ],
  },
];

export const kydIntro = {
  title: 'Know Your Dog',
  paragraphs: [
    'Please fill this once for each dog when you book. The more we know about your dog, the better we can plan their room, their playmates and their day, and the lower the chance of an accident.',
    'There are no wrong answers, and nothing here will get your dog turned away without a conversation first.',
  ],
  pill: 'About 5 minutes',
};

export const kydText = {
  submit: "Send to Paws N' Play",
  sending: 'Sending…',
  genericError: 'Something went wrong. Please try again.',
  networkError: "We couldn't reach our server. Check your internet connection and try again.",
  tooLarge: 'The files are too large to send together. Please remove one or two and try again.',
  invalidPhone: 'Please enter a valid phone number.',
  documentsHint: `Up to ${MAX_FILES} files, 10 MB each`,
  documentsAdd: 'Add photos or PDFs',
  doneTitle: 'Thank you!',
  doneText: (dogName: string) =>
    `We've got your answers for ${dogName}. Our team will go through them before the stay and call you if we have any questions.`,
  another: 'Fill in for another dog',
  faqs: 'Read our FAQs',
};
