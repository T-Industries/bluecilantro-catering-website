// Source: "NEW WENDEL CLARK MENU.pdf"
import { fixed, group, perLb, perPerson, perUnit } from './helpers.js'

const skewerFlavours = [
  'Peri-Peri',
  'House Honey BBQ',
  'Pineapple & Sweet Chili',
  'Teriyaki Black Sesame',
  'Honey, Lime & Sriracha',
  'Indian Kebab',
  'Honey Garlic',
]
const wingFlavours = ['Classic Hot', 'Creamy Garlic Butter', 'Cajun Spiced', 'Salt & Pepper', 'Lemon & Pepper']
const soups = ['Wicked Thai', 'Potato Bacon Soup', 'Beef Barley', 'Chicken Pasta Soup', 'Butternut Squash', 'Crème of Mushroom Soup']
const salads = ['Greek Salad', 'Caesar Salad', 'Mixed Green Salad', 'Mediterranean Quinoa Salad', 'Pasta Salad', 'Mango Avocado Salad']
const sandwiches = [
  'Chicken Caesar Wrap',
  'Roast Beef on Sub Bun',
  'BBQ Chicken Breast',
  'Ham & Cheese',
  'Turkey & BLT',
  'Egg & Cress',
  'Vegetable Wrap',
]
const coldCanapes = [
  'Bocconcini Pearls, Fresh Basil, Grape Tomato Skewer',
  'Cream Cheese Stuffed Cucumber Cups',
  'Smoked Salmon, Fresh Dill, Brie Cheese Crostini',
  'Chipotle Spiced Shrimp, Avocado, Tortilla Crisp',
  'Herbs and Garlic Cream Cheese Stuffed Mushroom',
  'Tomato Cilantro Bruschetta, Balsamic Glaze',
  'Seared Tuna, Wonton Crisp, Pepper Aioli',
  'Salmon Gravlax on Focaccia and Tapenade',
  'Spicy Shrimp Cocktail Shooter',
  'Smoked Salmon and Cream Cheese Mini-Crepe',
]
const hotCanapes = [
  'Mini Vegetable Spring Roll with Sweet Chili Sauce (V)',
  'Thai Chicken Satay, Peanut Sauce (GF)',
  'Tequila Lime Prosciutto Chicken',
  'Mini Beef Wellingtons',
  'Thai Beef Satay and Peanut Sauce',
  'Jack Daniel Marinated Beef Skewers',
  'Shrimp Tempura with Wasabi Aioli and Sriracha Drizzle',
  'Grilled Beef Sliders, Pepper Jack Cheese',
  'Mini Grilled Cheese, White Cheddar with Gruyere',
  'Bacon-Wrapped Scallops',
  'Falafel Served with Tahini Sauce',
]
const lateNight = [
  'Maple Glazed Bacon Skewers',
  'Mini Meat Pies',
  'Vegetable Spring Rolls',
  'Smoked Salmon Bites',
  'Fried Calamari',
  'Dessert Squares Mix',
]

const DOZEN = { minQty: 12, step: 12 }

export default {
  slug: 'wendel-clarks',
  name: "Wendel Clark's",
  tagline: 'Classic Grill and Bar',
  cuisine: 'Grill, Canapés, Buffets, Breakfast',
  description:
    "From hot breakfast buffets and hearty lunches to canapés, carved prime rib dinners and a full bar — Wendel Clark's Classic Grill and Bar caters every part of your event.",
  logoUrl: '/images/wendel-clarks-logo.png',
  heroUrl: '/images/wendel-clarks-hero.jpg',
  minGuests: 10,
  leadTimeHours: 48,
  taxPercent: 5,
  gratuityPercent: 18,
  deliveryFee: 0,
  pricingNote: 'An 18% gratuity and 5% taxes are added to all prices. Menu items and prices are subject to change without notice.',
  terms: [
    '(GF) Gluten Free · (V) Vegetarian · (SF) Super foods · (E) Low Carb, High Energy.',
    'Menu items and prices are subject to change without notice.',
    'An 18% gratuity and 5% taxes will be added to all prices.',
    'All appetizers are ordered by the dozen, minimum one dozen.',
  ].join('\n'),
  displayOrder: 2,
  categories: [
    {
      name: 'Breakfast',
      items: [
        perPerson('Healthy Start Breakfast', 21, {
          description: 'An assortment of fruit & yogurt parfaits, fresh fruit salad, fresh baked muffins, coffee, tea & fruit juice.',
          tags: 'V',
        }),
        perPerson('Hot Breakfast Buffet', 27, {
          description:
            'French toast or Pancake with maple syrup, Sausage, fresh fruit salad, assorted fresh baked muffins & pastries, Potato wedges, scrambled egg, coffee, tea & fruit juice.',
          badge: 'Popular',
          optionGroups: [
            group('French Toast or Pancake', 1, 1, ['French Toast', 'Pancake']),
            { name: 'Add-ons', min: 0, max: 1, choices: [{ name: 'Add Bacon', price: 2 }] },
          ],
        }),
        perPerson('Breakfast Sandwich', 22, {
          description: 'Served with potato wedges, fresh fruit salad, tea & coffee.',
        }),
        perPerson('Florentine Breakfast Wrap', 22, {
          description: 'Spinach, mixed cheese, tomato, scrambled egg & sundried tomato with potato wedges, fresh fruit salad, tea & coffee.',
          tags: 'V',
        }),
      ],
    },
    {
      name: 'Appetizers',
      description: 'All appetizers are ordered by the dozen, minimum one dozen.',
      items: [
        fixed('Spinach Dip', null, {
          unitLabel: 'tray',
          tags: 'V',
          variants: [
            { name: 'Medium (serves approx. 15)', price: 70 },
            { name: 'Large (serves approx. 25)', price: 130 },
          ],
        }),
        fixed('Fresh Pico de Gallo', null, {
          unitLabel: 'tray',
          tags: 'V, GF',
          variants: [
            { name: 'Medium', price: 35 },
            { name: 'Large', price: 80 },
          ],
        }),
        fixed('House Made Guacamole with Tortilla Chips', null, {
          unitLabel: 'tray',
          tags: 'V',
          variants: [
            { name: 'Medium', price: 50 },
            { name: 'Large', price: 100 },
          ],
        }),
        perUnit('Chicken Skewer Collection', 3.5, 'each', {
          description: 'Priced per skewer, ordered by the dozen. Add another line for each extra flavour.',
          ...DOZEN,
          badge: 'Popular',
          optionGroups: [group('Flavour', 1, 1, skewerFlavours)],
        }),
        perLb('Chicken Wings', 19, {
          description: 'Minimum 2 lbs per flavour. Add another line for each extra flavour.',
          minQty: 2,
          optionGroups: [group('Flavour', 1, 1, wingFlavours)],
        }),
      ],
    },
    {
      name: 'Hot Bites',
      description: 'Priced each, ordered by the dozen.',
      items: [
        perUnit('Arancini Balls', 6, 'each', { ...DOZEN, tags: 'V' }),
        perUnit('Bacon Wrapped Peach', 5, 'each', DOZEN),
        perUnit('BBQ Pulled Pork Slider', 5, 'each', DOZEN),
        perUnit('Spicy Chorizo in Honey Dijon Glaze', 3.5, 'each', DOZEN),
        perUnit('House Made Meatball Collection', 4, 'each', {
          description: 'Minimum one dozen per flavour.',
          ...DOZEN,
          optionGroups: [
            group('Flavour', 1, 1, ['House Honey BBQ', 'Mango Sweet Chili', 'Marinara with Basil & Parmesan', 'Cranberry & Mandarin Glaze']),
          ],
        }),
      ],
    },
    {
      name: 'Platters & Charcuterie',
      items: [
        perPerson('Vegetable and Dip Selection', 3.5, { tags: 'V, GF' }),
        perPerson('Fresh Fruit Selection', 3.5, { tags: 'V, GF' }),
        perPerson('Domestic & Imported Cheese Selection', 6, { tags: 'V' }),
        perPerson('Meat & Cheese Platter', 6),
        fixed('Charcuterie Slab', 125, {
          description: 'Served with a variety of crisps & toast.',
          serves: 'Serves 10-12',
          unitLabel: 'slab',
          optionGroups: [
            {
              name: 'Add-ons',
              min: 0,
              max: 1,
              choices: [{ name: 'Smoked Salmon & Dill Cream Cheese (serves 5)', price: 25 }],
            },
          ],
        }),
      ],
    },
    {
      name: 'Lunch',
      description: 'Priced per person.',
      items: [
        perPerson('Beef on a Bun', 27, {
          description:
            'Tender roast sirloin seasoned with Wendel spice. Served with Caesar salad, fresh baked bun & mashed potato, accompanied with assorted dessert tray.',
        }),
        perPerson('Wendel Chili', 27, {
          description:
            "Traditional Beef Chili twisted in Wendel's way, accompanied with rustic corn bread & mango coleslaw. Comes with corn on the cob and assorted dessert tray.",
        }),
        perPerson('Lasagna Meal', 24.99, {
          description:
            'Freshly made to order with spinach, ricotta, parmesan, mozzarella, beef tomato sauce and fresh pasta sheets. Comes with Caesar salad, garlic toast, mashed potato & assorted dessert tray.',
        }),
        perPerson('Italian Delight', 24.99, {
          description:
            'Vibrant Alfredo sauce with sliced chicken breast tossed with pasta of your choice. Comes with Caesar salad, garlic butter toast, seasonal vegetables & assorted dessert tray.',
        }),
        perPerson('Indian Combo', 27, {
          description:
            'Our classic butter chicken tossed in a blend of Wendel spices. Comes with butter paneer masala, basmati rice, mixed greens, naan bread and gulab jamun.',
          badge: 'Popular',
        }),
        perPerson('Crispy Buttermilk Chicken Lunch', 25, {
          description:
            "Thigh & drumstick soaked in buttermilk with Wendel's spice. Served with corn on the cob, mac & cheese, Mexican salad & assorted dessert tray.",
        }),
        perPerson('Salmon Meal', 35, {
          description:
            'Boneless fillet of Salmon seared with maple glaze. Comes with rice pilaf, dill pickle cauliflower with peas, mixed green and spinach with raspberry dressing and assorted dessert tray.',
        }),
        perPerson('Grilled Chicken in White Wine Sauce', 31, {
          description:
            'Chicken marinated in white wine sauce & grilled to perfection. Comes with potato, fried rice, Caesar salad & assorted dessert tray.',
          optionGroups: [group('Potato', 1, 1, ['Herb Roasted Potato', 'Garlic Mashed Potato'])],
        }),
      ],
    },
    {
      name: 'Soup, Salad & Sandwich Lunch',
      items: [
        perPerson('Soup, Salad & Sandwich – Classic', 29.99, {
          description: 'Choose 2 salads, 2 sandwiches & 1 soup.',
          optionGroups: [group('Soup', 1, 1, soups), group('Salads', 2, 2, salads), group('Sandwiches', 2, 2, sandwiches)],
        }),
        perPerson('Soup, Salad & Sandwich – Deluxe', 33.99, {
          description: 'Choose 3 salads, 3 sandwiches & 1 soup.',
          optionGroups: [group('Soup', 1, 1, soups), group('Salads', 3, 3, salads), group('Sandwiches', 3, 3, sandwiches)],
        }),
      ],
    },
    {
      name: 'Canapés',
      description: 'Priced per dozen. Add another line for each extra selection.',
      items: [
        perUnit('Cold Canapés', 35, 'dozen', { optionGroups: [group('Selection', 1, 1, coldCanapes)] }),
        perUnit('Hot Canapés', 37, 'dozen', { optionGroups: [group('Selection', 1, 1, hotCanapes)] }),
      ],
    },
    {
      name: 'Late Night Snacks',
      items: [
        fixed('Classic Poutine', 100, { serves: 'Good for 20-25 guests', unitLabel: 'tray' }),
        perUnit('Late Night Bites', 37, 'dozen', { optionGroups: [group('Selection', 1, 1, lateNight)] }),
      ],
    },
    {
      name: 'Dinner',
      description: 'Priced per person.',
      items: [
        perPerson('Classic Roast Beef Dinner', 39, {
          description:
            'Assorted freshly baked rolls and butter, Traditional Caesar Salad with parmesan shavings, bacon and croutons, Spinach Salad with cranberry, mandarin & raspberry vinaigrette, Seasonal vegetables with pesto sauce, Herb Roasted Potato, Slow roasted rosemary & thyme beef, Rich beef gravy & horseradish on side.',
          optionGroups: [group('Dessert', 1, 1, ['Fruit Platter', 'Assorted Dessert Tray'])],
        }),
        perPerson('Prime Rib Dinner', 61, {
          description:
            "Freshly baked bread rolls with whipped butter, Traditional Caesar Salad, Spinach & Kale salad with apple & cherry balsamic vinaigrette, Roasted Chicken, Chef Carved Albertan Prime Rib, Assorted cheese platters, Freshly baked garlic toast, Home-made garlic mashed potato, Seasonal Vegetables, Chef's Choice Dessert.",
          badge: 'Premium',
        }),
        perPerson('Traditional Roast Turkey Dinner', 39, {
          description:
            "Freshly baked rolls & whipped butter, Traditional Caesar Salad, Winter Greens salad with dried cranberry, feta cheese and seeds, Honey roasted vegetables with Wendel Spice, Creamy mash potato, Slow cooked Roasted Turkey, Turkey Gravy, Apple Strudel Stuffing, Cranberry Sauce & Pickles, Chef's Choice Dessert.",
        }),
      ],
    },
    {
      name: 'Beverages',
      description: 'Non-alcoholic.',
      items: [
        perPerson('Assorted Drinks', 3.99, { description: 'Soft Drinks / Pop, Bottled Water, Bottled Juices.' }),
        perUnit('San Pellegrino Sparkling Water (330 ml)', 4.5, 'each'),
        perPerson('Freshly Brewed Coffee / Tea', 2),
        perUnit('Non-Alcoholic Cocktail', 4.99, 'each', {
          optionGroups: [group('Cocktail', 1, 1, ['Shirley Temple', 'Virgin Caesar', 'Apple Fizz', 'Peach Punch'])],
        }),
      ],
    },
    {
      name: 'Bar',
      description: 'Alcoholic beverages served by licensed staff. Special signature drinks available upon request and availability.',
      items: [
        perUnit('House Spirits', 7.5, 'oz', {
          optionGroups: [
            group('Spirit', 1, 5, ['Smirnoff Vodka', 'Captain Morgan', 'Alberta Premium Rye', 'Cuervo Tequila', 'Beefeater Gin']),
          ],
        }),
        perUnit('Premium Spirits', 8.5, 'oz', {
          optionGroups: [
            group('Spirit', 1, 6, ['JP Wiser', 'Empress Gin', 'Bacardi Rum', 'Crown Royal Whiskey', 'Absolut Vodka', 'Havana Rum']),
          ],
        }),
        perUnit('Classic Caesar', 9.99, 'drink'),
        fixed('Red or White Wine', null, {
          unitLabel: 'order',
          description: 'Selection of wines based on availability.',
          variants: [
            { name: 'Per glass', price: 10.5 },
            { name: 'Bottle', price: 36 },
          ],
          optionGroups: [group('Wine', 1, 2, ['Red', 'White'])],
        }),
        perUnit('Beer', 7.5, 'drink', {
          optionGroups: [group('Beer', 1, 4, ['Molson', 'Bud Light', 'Coors Original', 'Budweiser'])],
        }),
      ],
    },
  ],
}
