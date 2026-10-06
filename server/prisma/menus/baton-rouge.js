// Source: "BR26_NAT_021_GroupMenu_8.5x11_AUG26_v7_EN (1).pdf"
import { fixed, perPerson } from './helpers.js'

const starter = { name: 'Starter', min: 1, max: 2, choices: [{ name: 'Soup of the Day' }, { name: 'Caesar Salad' }] }
const beverage = { name: 'Beverage', min: 1, max: 2, choices: [{ name: 'Tea' }, { name: 'Coffee' }] }
const dessert = { name: 'Dessert', min: 1, max: 1, choices: [{ name: 'Dessert of the Day' }] }

const entree = (list) => ({
  name: 'Entrées offered to your guests',
  min: 1,
  max: list.length,
  choices: list,
})

const ENTREES = {
  burger: {
    name: 'Bâton Rouge Burger',
    description: 'Premium beef patty, smoked bacon, Monterey Jack, lettuce, tomato, onion & Dijonnaise sauce. Served with fries.',
  },
  louisiana: {
    name: 'Louisiana Salad',
    description: 'Sliced chicken, mixed greens, crispy noodles, Thai peanut sauce & pineapple-soy dressing.',
  },
  truffle: {
    name: 'Truffle Ribbon Pasta',
    description: 'Truffle Alfredo sauce, sautéed mushrooms, red onions & Parmigiano Reggiano.',
  },
  club: {
    name: 'Club Sandwich',
    description:
      'Grilled marinated chicken, toasted bistro bread, lettuce, tomato, smoked bacon, Monterey Jack & mayonnaise. Served with fries.',
  },
  ribs: {
    name: 'Signature Ribs',
    description: 'A classic for over 30 years: a rack of our famous slow-cooked BBQ pork back ribs, served with fries and coleslaw.',
  },
  santaFe: {
    name: 'Santa Fe Chicken',
    description: 'Grilled chicken breast with red pepper, zucchini, goat cheese, jardinière sauce, and wild rice pilaf.',
  },
  salmon: {
    name: 'Atlantic Salmon',
    description: 'Grilled salmon fillet, sauce vierge, wild rice pilaf & seasonal vegetables.',
  },
  primeRib: {
    name: 'Prime Rib Sandwich',
    description:
      'Sliced prime rib, baguette, smoked jalapeño aioli, caramelized onions & Monterey Jack. Served with au jus and fries.',
  },
  shrimpPasta: {
    name: 'Shrimp Ribbon Pasta',
    description: 'Tossed in a rosé white wine sauce, shrimp, garlic & onions.',
  },
  steak: {
    name: 'Steak & Fries',
    description: 'AAA Marinated Beef Flank Steak served with fries and signature peppercorn sauce.',
  },
}

const MIN = 10

export default {
  slug: 'baton-rouge',
  name: 'Bâton Rouge',
  tagline: 'Steakhouse & Bar — Group Menus',
  cuisine: 'Ribs, Steakhouse, Group Menus',
  description:
    'Famous slow-cooked BBQ pork back ribs, steaks and seafood. Choose a 2, 3 or 4 course group menu — your guests choose their entrée from the options you offer — or add shareable Bites platters.',
  logoUrl: '/images/baton-rouge-logo.png',
  heroUrl: '/images/baton-rouge-hero.jpg',
  minGuests: MIN,
  leadTimeHours: 48,
  taxPercent: 5,
  gratuityPercent: 0,
  deliveryFee: 0,
  pricingNote: 'Group menu prices are per person. Delivery charges and any service fees are confirmed by the restaurant.',
  displayOrder: 1,
  categories: [
    {
      name: 'Group Menus',
      imageUrl: '/images/menu/baton-ribs.jpg',
      description: 'Priced per person. Select the entrées you would like to offer; let us know the counts in your notes.',
      items: [
        perPerson('Group Menu – 2 Course', 31, {
          imageUrl: '/images/menu/baton-burger.jpg',
          description: 'Starter, entrée, and tea or coffee. Entrées: Bâton Rouge Burger, Louisiana Salad, Truffle Ribbon Pasta, Club Sandwich.',
          minQty: MIN,
          optionGroups: [starter, entree([ENTREES.burger, ENTREES.louisiana, ENTREES.truffle, ENTREES.club]), beverage],
        }),
        perPerson('Group Menu – 3 Course', 41, {
          imageUrl: '/images/menu/baton-ribs.jpg',
          description:
            'Starter, entrée, dessert of the day, and tea or coffee. Entrées: Signature Ribs, Santa Fe Chicken, Atlantic Salmon, Prime Rib Sandwich.',
          minQty: MIN,
          badge: 'Popular',
          optionGroups: [
            starter,
            entree([ENTREES.ribs, ENTREES.santaFe, ENTREES.salmon, ENTREES.primeRib]),
            dessert,
            beverage,
          ],
        }),
        perPerson('Group Menu – 4 Course', 51, {
          imageUrl: '/images/menu/baton-salmon.jpg',
          description:
            'Appetizer, starter, entrée, dessert of the day, and tea or coffee. Entrées: Signature Ribs, Shrimp Ribbon Pasta, Atlantic Salmon, Steak & Fries.',
          minQty: MIN,
          optionGroups: [
            {
              name: 'Appetizer',
              min: 1,
              max: 2,
              choices: [
                {
                  name: 'Tempura Shrimps',
                  description: 'Tempura shrimp, sriracha mayonnaise & smoked jalapeño aioli, sesame seeds & green onions.',
                },
                { name: 'Spinach Dip', description: 'Warm spinach, artichoke & cheese dip, served with tortilla chips.' },
              ],
            },
            starter,
            entree([ENTREES.ribs, ENTREES.shrimpPasta, ENTREES.salmon, ENTREES.steak]),
            dessert,
            beverage,
          ],
        }),
      ],
    },
    {
      name: 'Bites – Cold',
      description: 'Shareable platters.',
      items: [
        fixed('Cocktail Shrimp', null, {
          unitLabel: 'platter',
          variants: [
            { name: '25 shrimps', price: 115 },
            { name: '50 shrimps', price: 200 },
          ],
        }),
        fixed('Beef Tartare Bites (12)', 35, { unitLabel: 'platter' }),
        fixed('Salmon Gravlax Bites (12)', 60, { unitLabel: 'platter' }),
        fixed('Asian Tuna Tartare Bites (12)', 25, { unitLabel: 'platter' }),
      ],
    },
    {
      name: 'Bites – Hot',
      imageUrl: '/images/menu/baton-sliders.jpg',
      description: 'Shareable platters.',
      items: [
        fixed('Shrimp Tempura (16)', 36, { unitLabel: 'platter' }),
        fixed('Cauliflower Wings (16)', 15, { unitLabel: 'platter', tags: 'V' }),
        fixed('Feta & Spicy Honey Bites (12)', 32, { unitLabel: 'platter', tags: 'V' }),
        fixed('Beef Flank Steak Bites (24)', 60, { unitLabel: 'platter' }),
        fixed('Cheesy Garlic Bread Bites (16)', 17, { unitLabel: 'platter', tags: 'V' }),
        fixed('Ribs (12)', 24, { unitLabel: 'platter', badge: 'Signature', imageUrl: '/images/menu/baton-ribs.jpg' }),
      ],
    },
  ],
}
