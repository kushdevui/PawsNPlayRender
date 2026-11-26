// Public FAQ content (ported from the static FAQ page). Content only - no API involved.
// Inline markup in answer text: **bold** and [label](/route) for in-app links.

export type FaqBlock = { type: 'p'; text: string } | { type: 'ul'; items: string[] };

export interface FaqItem {
  id: string;
  question: string;
  answer: FaqBlock[];
}

export interface FaqSection {
  id: string;
  title: string;
  /** Short label for the topic chip. */
  chip: string;
  items: FaqItem[];
}

export interface QuickFact {
  value: string;
  label: string;
}

const p = (text: string): FaqBlock => ({ type: 'p', text });
const ul = (...items: string[]): FaqBlock => ({ type: 'ul', items });

const KYD = '/know-your-dog';

export const quickFacts: QuickFact[] = [
  { value: '10:00 AM', label: 'Usual check-in time' },
  { value: '6:00 PM', label: 'Usual check-out time' },
  { value: '15 dogs', label: 'Maximum at a time' },
  { value: '₹1,200', label: 'Per night' },
];

export const faqSections: FaqSection[] = [
  {
    id: 'booking',
    title: 'Booking',
    chip: 'Booking',
    items: [
      {
        id: 'what-is',
        question: "What is Paws N' Play?",
        answer: [
          p("Paws N' Play Boarding is our own dog boarding facility. Your dog stays with us while you're away, from the day you drop them off (check-in) until you pick them up (check-out), and our team looks after them on the ground the whole time."),
        ],
      },
      {
        id: 'how-book',
        question: 'How do I book a stay?',
        answer: [
          p("Get in touch with us with your dog's name, your check-in and check-out dates and times, and your phone number. We'll check availability for those dates and confirm your booking."),
          p(`Please also fill in our [Know Your Dog questionnaire](${KYD}) once for each dog. It takes about five minutes and helps us plan your dog's room, playmates and day.`),
          p('A customer app for booking and tracking stays yourself is on the way. Until then, our team creates every booking for you.'),
        ],
      },
      {
        id: 'how-many',
        question: 'How many dogs do you take at once?',
        answer: [
          p("We board a maximum of 15 dogs at any one time, so every dog gets proper attention. We check this limit for every hour of your stay, so if any part of your dates is full we'll tell you straight away and help you find dates that work."),
        ],
      },
      {
        id: 'book-early',
        question: 'Should I book early?',
        answer: [p('Yes, especially for weekends, long weekends and holidays. Because we keep numbers small, popular dates fill up first.')],
      },
      {
        id: 'multiple-stays',
        question: 'Can I book more than one stay for the same dog?',
        answer: [p("Of course, as long as the stays don't overlap. Each dog can only have one booking for any given dates.")],
      },
    ],
  },
  {
    id: 'stay',
    title: "Your dog's stay",
    chip: "Your dog's stay",
    items: [
      {
        id: 'times',
        question: 'What are the check-in and check-out times?',
        answer: [
          p("Our usual check-in time is **10:00 AM** and our usual check-out time is **6:00 PM**. If you need a different time, tell us when you book and we'll set your booking to the times you need."),
        ],
      },
      {
        id: 'nights',
        question: 'How are nights counted?',
        answer: [
          p('We count the nights your dog spends with us between the check-in day and the check-out day. For example, checking in on Friday and checking out on Sunday is 2 nights.'),
        ],
      },
      {
        id: 'dog-info',
        question: 'What information do you need about my dog?',
        answer: [
          p(`Everything is in our [Know Your Dog questionnaire](${KYD}). Please fill it once for each dog when you book. It covers:`),
          ul(
            "You and an emergency contact who can make decisions and collect your dog if we can't reach you",
            "Your dog's breed, age, sex, weight and whether they're sterilised",
            'Health: vaccinations, deworming, tick and flea prevention, medication, allergies and your vet',
            'Food, and how your dog gets on with other dogs and people',
            'Triggers, quirks and daily routine',
          ),
          p('There are no wrong answers, and nothing in it will get your dog turned away without a conversation first.'),
        ],
      },
      {
        id: 'bring',
        question: 'What should I bring?',
        answer: [
          ul(
            "Special food or kibble, if your dog won't be eating our standard meals (see below)",
            "Food and water bowls, if you'd like your dog to have their own",
            'Any medicines, with clear instructions',
            'Leash and collar',
            'A favourite toy or blanket to help them settle in',
          ),
          p("Please label everything with your dog's name."),
        ],
      },
      {
        id: 'food',
        question: 'What will my dog eat?',
        answer: [
          p('Our standard meals are **rice and chicken cooked with a seasonal vegetable, twice a day, plus treats**.'),
          p("If your dog eats something else, you're welcome to send their own food or kibble. Just tell us how much to give and when. An extra meal is **₹150 per meal**."),
        ],
      },
      {
        id: 'routine',
        question: "Will you follow my dog's feeding routine and medication?",
        answer: [
          p("Yes. Tell us what, when and how much your dog eats, any foods or treats to avoid, and any medicines (name, dose and timing). We save these on your dog's profile, and they're shown to the team with every booking."),
        ],
      },
      {
        id: 'bath',
        question: 'Can you give my dog a bath before they go home?',
        answer: [p('Yes. You can add a **bath and dry for ₹750** to any stay. Just ask when you book.')],
      },
    ],
  },
  {
    id: 'health',
    title: 'Health & vaccinations',
    chip: 'Health & vaccinations',
    items: [
      {
        id: 'vaccinated',
        question: 'Does my dog need to be vaccinated?',
        answer: [
          p('Yes. To keep every guest healthy, please make sure your dog is up to date on:'),
          ul(
            'Anti-rabies vaccination',
            'Combined vaccination (7-in-1 or similar)',
            'Deworming',
            'Tick and flea prevention (spot-on, chewable, collar or tick bath)',
          ),
          p('Please share the vaccination and deworming records with us before the stay.'),
        ],
      },
      {
        id: 'records',
        question: 'How do I share vaccination records?',
        answer: [
          p(`A clear photo of the vaccination and deworming record, or a PDF from your vet, is perfect. You can attach it in the [questionnaire](${KYD}). We keep it on your dog's profile, so you won't need to send it again until it's renewed.`),
        ],
      },
      {
        id: 'unwell',
        question: 'My dog was unwell recently, or has ticks. Can they still come?',
        answer: [
          p("Please tell us before the stay if your dog has had a cough, vomiting or loose motions in the past week, or has ticks, fleas or skin problems right now. It's about keeping every dog healthy, and we'll talk it through with you together."),
        ],
      },
      {
        id: 'unspayed',
        question: "My female dog isn't spayed. Is that okay?",
        answer: [p("Please tell us the date of her last heat and whether she's due during the stay, so we can plan her room and playmates.")],
      },
      {
        id: 'medical',
        question: 'My dog has a medical condition. Can they still stay?',
        answer: [
          p("Please talk to us before booking. Tell us about the condition, any medication and your vet's advice, and we'll let you know honestly whether we can care for your dog safely."),
        ],
      },
    ],
  },
  {
    id: 'payments',
    title: 'Prices & payments',
    chip: 'Prices & payments',
    items: [
      {
        id: 'cost',
        question: 'How much does boarding cost?',
        answer: [
          p('Boarding is **₹1,200 per night**. Your total is the number of nights multiplied by the nightly price, plus any extras you choose:'),
          ul('Extra meal: **₹150 per meal**', 'Bath and dry: **₹750**'),
          p('We confirm the total when we confirm your booking.'),
        ],
      },
      {
        id: 'pay-how',
        question: 'How can I pay?',
        answer: [p('We accept **UPI, cash, card and bank transfer**.')],
      },
      {
        id: 'advance',
        question: 'Do I need to pay an advance?',
        answer: [
          p("We may ask for an advance to hold your dates, often half of the total, with the balance paid before or at check-out. We record every payment against your booking, so you always know what's been paid and what's left."),
        ],
      },
    ],
  },
  {
    id: 'changes',
    title: 'Changes & cancellations',
    chip: 'Changes & cancellations',
    items: [
      {
        id: 'change-dates',
        question: 'Can I change my dates?',
        answer: [
          p("Yes, just let us know as early as you can. We'll update your booking if there's space on the new dates. Dates can be changed before and during a stay."),
        ],
      },
      {
        id: 'cancel',
        question: 'What if I need to cancel?',
        answer: [
          p("Tell us as soon as possible so we can free the space for another dog. If you've already paid an advance, we'll talk you through any refund when you cancel."),
        ],
      },
      {
        id: 'early-late',
        question: 'Can I pick my dog up early or late?',
        answer: [p('Usually, yes. Just call or message us first so the team has your dog ready. Late pick-ups depend on availability that day.')],
      },
    ],
  },
];
