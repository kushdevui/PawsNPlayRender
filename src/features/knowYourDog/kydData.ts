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

export type FieldDef = TextFieldDef | ChoiceFieldDef | DateFieldDef | DocumentsFieldDef | ConfirmFieldDef;

export interface KydSection {
  n: number;
  title: string;
  note?: string;
  fields: FieldDef[];
}

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
      text('breed', 'Breed', 60, { required: 'Please enter the breed (or Indie / mixed).', placeholder: 'e.g. Labrador, or Indie / mixed', half: true }),
      text('age', 'Age', 40, { required: "Please enter your dog's age.", placeholder: 'e.g. 3 years', half: true }),
      text('weight', 'Approximate weight', 40, { placeholder: 'e.g. 18 kg', half: true }),
      choice('sex', 'Sex', [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }], { required: 'Please choose one.' }),
      choice('sterilised', 'Sterilised?', YES_NO, { required: 'Please choose one.' }),
      // Shown only for unsterilised females (see isFieldVisible).
      text('heatInfo', 'If female and not sterilised: date of last heat, and is she due during this stay?', 500, { multiline: true }),
    ],
  },
  {
    n: 3,
    title: 'Health',
    note: 'Please also send us a photo or PDF of the **vaccination and deworming record** below.',
    fields: [
      date('rabiesDate', 'Date of last anti-rabies vaccination', { half: true }),
      date('comboVaccineDate', 'Date of last combined vaccination', { hint: '7-in-1 or similar', half: true }),
      date('dewormingDate', 'Date of last deworming', { half: true }),
      text('tickFlea', 'Tick and flea prevention used, and when', 200, { hint: 'Spot-on / chewable / collar / tick bath / none' }),
      text('skinIssues', 'Any ticks, fleas or skin problems right now?', 300),
      text('recentIllness', 'Any illness in the past week?', 300, { hint: 'Cough, vomiting, loose motions' }),
      text('conditions', 'Any medical conditions, past surgeries or injuries we should know about?', 1000, { multiline: true }),
      text('medication', 'Any medication?', 1000, { hint: 'Give the name, dose and timing', multiline: true }),
      text('allergies', 'Any allergies?', 300, { hint: 'Food, medicine, anything else' }),
      text('vet', "Your regular vet's name and phone number", 200),
      { kind: 'documents', key: 'documents', label: 'Vaccination and deworming records' },
    ],
  },
  {
    n: 4,
    title: 'Food',
    note: 'Our standard meals are **rice and chicken cooked with a seasonal vegetable, twice a day, plus treats**.',
    fields: [
      text('homeDiet', 'What does your dog eat at home, and how many meals a day?', 500, { multiline: true }),
      choice('standardMealOk', 'Is our standard meal fine for your dog?', YES_NO),
      text('avoidFoods', 'Any foods or treats to avoid?', 300),
      text('eatingStyle', 'Is your dog a fussy or slow eater, or do they eat too fast?', 300),
    ],
  },
  {
    n: 5,
    title: 'With other dogs and with people',
    note: 'Tell us in your own words, and add the story if there is one.',
    fields: [
      text('otherDogs', 'How is your dog with other dogs?', 1000, {
        multiline: true,
        hint: "Mention any sizes, sexes, breeds or types (such as puppies or very playful dogs) they don't get along with",
      }),
      text('withPeople', 'How is your dog with people?', 1000, { multiline: true, hint: 'Mention if they are wary of strangers, men or women' }),
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
    title: 'Routine',
    fields: [
      text('sleep', 'Where does your dog sleep at home?', 200, { hint: 'Own bed, your bed, floor, crate' }),
      text('toilet', 'When and where does your dog usually pee and poop?', 300, { hint: 'On walks, in a garden, on a schedule' }),
      text('exercise', 'How much exercise is your dog used to in a day?', 200),
      text('anythingElse', 'Anything else you want us to know about your dog?', 2000, { multiline: true }),
    ],
  },
  {
    n: 8,
    title: 'Your requests for this stay',
    note: 'Anything marked **extra** is charged on top of the boarding rate.',
    fields: [
      text('trialVisit', 'Has your dog done a trial visit with us? If not, would you like to book one before the stay?', 300, {
        multiline: true,
        hint: 'Strongly recommended before a first overnight stay',
      }),
      choice('keepSeparate', 'Do you want your dog kept separately from other dogs?', YES_NO, { hint: 'We can only arrange this in advance' }),
      text('specialFood', 'Does your dog need a special diet, a particular kibble or their own treats?', 500, {
        multiline: true,
        hint: 'If yes, you send the food with your dog. Tell us how much to give and when',
      }),
      choice('extraMeal', 'Does your dog need an extra meal?', YES_NO, { hint: 'Extra at ₹150 per meal' }),
      choice('ownBowls', 'Do you want separate water or food bowls for your dog?', YES_NO, { hint: 'The bowls are to be provided by you' }),
      choice('bath', 'Would you like a basic bath and dry?', YES_NO, { hint: 'Extra at ₹750, no haircuts' }),
      text('sendingItems', 'What are you sending with your dog?', 500, { multiline: true, hint: 'Food, treats, medication, bowls, bed, toys' }),
    ],
  },
  {
    n: 9,
    title: 'Confirm',
    fields: [
      {
        kind: 'confirm',
        key: 'confirmTrue',
        label: 'I confirm that everything above is complete and true to the best of my knowledge.',
        required: 'Please tick to confirm.',
      },
      date('signDate', 'Date', { half: true }),
    ],
  },
];

export const kydIntro = {
  title: 'Know Your Dog',
  paragraphs: [
    'This is step two of confirming your booking, after the Boarding Consent & Waiver. Please fill it once for each dog. It takes about five minutes.',
    'The more we know about your dog, the better we can plan their room, their playmates and their day, and the lower the chance of an accident. There are no wrong answers, and nothing here will get your dog turned away without a conversation first.',
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
};
