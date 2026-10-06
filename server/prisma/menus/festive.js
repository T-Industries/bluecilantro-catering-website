// Source: "Festive menu 2025.pdf" — presented as BlueCilantro Catering's own festive menu.
import { fixed, group, perLb, perPerson, perUnit } from './helpers.js'

const DOZEN = { minQty: 12, step: 12 }

export default {
  slug: 'festive-menu',
  name: 'Our Festive Menu',
  tagline: 'Holiday 2025 by BlueCilantro Catering',
  cuisine: 'Holiday Dinners, Canapés, Party Platters',
  description:
    'Celebrate the season with BlueCilantro Catering. Classic roast dinners, prime rib, canapés, late-night snacks and a full holiday bar — everything for your festive gathering.',
  logoUrl: '/images/bluecilantro-catering-logo.png',
  heroUrl: '/images/festive-hero.jpg',
  minGuests: 10,
  leadTimeHours: 72,
  taxPercent: 5,
  gratuityPercent: 0,
  deliveryFee: 0,
  pricingNote: 'Prices exclude 5% GST. Any delivery or service charges will be confirmed by our team.',
  displayOrder: 4,
  categories: [
    {
      name: 'Festive Dinners',
      description: 'Priced per person.',
      items: [
        perPerson('Classic Roast Beef Dinner', 39, {
          description:
            'Assorted freshly baked rolls and butter, Traditional Caesar salad with parmesan shavings, bacon and croutons, Spinach salad with cranberry, mandarin and raspberry vinaigrette, Seasonal vegetables with pesto sauce, Herb-roasted potatoes, Slow-roasted rosemary & thyme beef, Rich beef gravy and horseradish on side.',
          optionGroups: [group('Dessert', 1, 1, ['Fruit Platter', 'Assorted Dessert Tray'])],
        }),
        perPerson('Prime Rib Dinner', 59, {
          description:
            'Freshly baked bread rolls with whipped butter, Traditional Caesar salad, Spinach & kale salad with apple & cherry balsamic vinaigrette, Roasted chicken, Chef-carved Albertan prime rib, Assorted cheese platter, Freshly baked garlic toast, Homemade garlic mashed potatoes, Seasonal vegetables.',
          badge: 'Premium',
        }),
        perPerson('Traditional Roast Turkey Dinner', 39, {
          description:
            "Freshly baked rolls with whipped butter, Traditional Caesar salad, Winter greens salad with dried cranberries, feta cheese and seeds, Honey-roasted vegetables, Creamy mashed potatoes, Slow-roasted turkey, Turkey gravy, Apple strudel stuffing, Cranberry sauce & pickles, Chef's choice dessert.",
          badge: 'Popular',
        }),
      ],
    },
    {
      name: 'Appetizers',
      description: 'All appetizers are ordered by the dozen (minimum one dozen per item).',
      items: [
        perUnit('Chicken Skewer Collection', 3.5, 'each', {
          description: 'Priced per skewer, minimum one dozen. Add another line for each extra flavour.',
          ...DOZEN,
          optionGroups: [
            group('Flavour', 1, 1, ['Peri-Peri', 'House Honey BBQ', 'Honey, Lime & Sriracha', 'Pineapple & Sweet Chili', 'Indian Kebab']),
          ],
        }),
        perLb('Chicken Wings', 19, {
          description: 'Minimum 2 lbs per flavour.',
          minQty: 2,
          optionGroups: [group('Flavour', 1, 1, ['Classic Hot', 'Creamy Garlic Butter', 'Cajun Spiced', 'Salt & Pepper', 'Lemon & Pepper'])],
        }),
        fixed('Hot Bites Platter', 150, {
          unitLabel: 'platter',
          description: 'Arancini Balls, Bacon-Wrapped Peach, BBQ Pulled Pork Slider, Spicy Chorizo in Honey Dijon Glaze.',
          badge: 'Popular',
        }),
        fixed('Charcuterie Slab', 125, {
          unitLabel: 'slab',
          serves: 'Serves 10',
          description: 'Served with assorted crisps & toast.',
          optionGroups: [{ name: 'Add-ons', min: 0, max: 1, choices: [{ name: 'Smoked Salmon & Dill Cream Cheese', price: 25 }] }],
        }),
      ],
    },
    {
      name: 'Canapés',
      description: 'Priced per dozen. Add another line for each extra selection.',
      items: [
        perUnit('Cold Canapés', 35, 'dozen', {
          optionGroups: [
            group('Selection', 1, 1, [
              'Bocconcini pearls, fresh basil, grape tomato skewer',
              'Cream cheese-stuffed cucumber cups',
              'Smoked salmon, fresh dill, brie cheese crostini',
              'Chipotle-spiced shrimp, avocado, tortilla crisp',
              'Herb & garlic cream cheese-stuffed mushroom',
              'Tomato cilantro bruschetta with balsamic glaze',
              'Seared tuna, wonton crisp, pepper aioli',
              'Salmon gravlax on focaccia with tapenade',
              'Spicy shrimp cocktail shooter',
            ]),
          ],
        }),
        perUnit('Hot Canapés', 37, 'dozen', {
          optionGroups: [
            group('Selection', 1, 1, [
              'Mini vegetable spring rolls with sweet chili sauce (V)',
              'Thai chicken satay with peanut sauce (GF)',
              'Tequila lime prosciutto chicken',
              'Mini beef Wellingtons',
              'Thai beef satay with peanut sauce',
              "Jack Daniel's marinated beef skewers",
              'Shrimp tempura with wasabi aioli and sriracha drizzle',
              'Grilled beef sliders with pepper jack cheese',
              'Bacon-wrapped scallops',
            ]),
          ],
        }),
      ],
    },
    {
      name: 'Late Night Snacks',
      description:
        'Maple-glazed bacon skewers, Classic Poutine, Mini meat pies, Vegetable spring rolls, Smoked salmon bites, Fried calamari, Dessert squares mix.',
      items: [
        fixed('Late Night Snacks Platter', 100, { unitLabel: 'platter', serves: 'Serves up to 20-25 people' }),
        perPerson('Late Night Snack Station', 15, { description: 'A self-serve late night station, priced per person.' }),
      ],
    },
    {
      name: 'Beverages',
      description: 'Non-alcoholic.',
      items: [
        perPerson('Assorted Drinks', 3.99, { description: 'Soft drinks / pop, Bottled water, Bottled juices.' }),
        perUnit('San Pellegrino Sparkling Water', 4.99, 'each'),
        perUnit('Non-Alcoholic Cocktail', 4.99, 'each', {
          optionGroups: [group('Cocktail', 1, 1, ['Shirley Temple', 'Virgin Caesar', 'Apple Fizz'])],
        }),
      ],
    },
    {
      name: 'Holiday Bar',
      description: 'Alcoholic beverages served by licensed staff.',
      items: [
        perUnit('House Spirits', 7.5, 'oz', {
          optionGroups: [
            group('Spirit', 1, 5, ['Smirnoff Vodka', 'Captain Morgan', 'Alberta Premium Rye', 'Cuervo Tequila', 'Beefeater Gin']),
          ],
        }),
        perUnit('Premium Spirits', 8.5, 'oz', {
          optionGroups: [group('Spirit', 1, 5, ["JP Wiser's", 'Empress Gin', 'Bacardi Rum', 'Absolut Vodka', 'Havana Rum'])],
        }),
        perUnit('Classic Caesar Drink', 9.99, 'drink'),
        fixed('Red or White Wine', null, {
          unitLabel: 'order',
          variants: [
            { name: 'Per glass', price: 10.5 },
            { name: 'Bottle', price: 42 },
          ],
          optionGroups: [group('Wine', 1, 2, ['Red', 'White'])],
        }),
        perUnit('Beer', 7.5, 'drink', { optionGroups: [group('Beer', 1, 3, ['Molson', 'Bud Light', 'Coors Original'])] }),
      ],
    },
  ],
}
