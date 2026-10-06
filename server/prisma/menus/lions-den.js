// Source: "Catering Menu Winter 2025 Den.docx", "Christmas Menu 2025 Den.docx", "Den Catering Menu.jpeg"
import { group, perPerson, perUnit, quote } from './helpers.js'

const MIN = 20 // "most menu items require a minimum of 20 guests"

const salads = [
  'Tossed Spring Mix with 3 Dressings',
  'Caesar Salad',
  'Marinated Vegetable Salad',
  'Greek Salad',
  'Potato Salad',
  'Pasta Salad',
  'Coleslaw',
  'Fruit Salad',
  'Overnight Salad',
  'Spinach Salad',
]
const fillings = [
  'Roast Baron of Beef',
  'Mustard and Brown Sugar Glazed Ham',
  'Rosemary Crusted Roast Turkey',
  'Cappicoli Ham',
  'Market Fresh Veggie',
  'Egg Salad',
  'Chicken Salad',
  'Tuna Salad',
]
const breads = ['Kaiser Buns', '¾ inch White', '¾ inch Brown', 'Rye Bread', 'Whole Wheat Wraps']
const hotMains = [
  'BBQ Beef on a Bun',
  'Home Style Beef Stew with Cheese Biscuits',
  'Vegetarian Lasagna with Garlic Toast',
  'Traditional Lasagna with Garlic Toast',
  'Prime Rib Philly Beef on a Bun',
  'Penne Primavera with Grilled Chicken Breast & Garlic Toast',
  'Three Cheese Cannelloni in Basil Tomato & Alfredo Sauce with Garlic Toast',
  'Chili Con Carne with Dinner Rolls',
  'Build Your Own Tacos with All the Fixings',
]
const appetizers = [
  'Honey Garlic Meatballs',
  'Chicken Wings',
  'Dry Ribs',
  'Bruschetta with Tortilla Chips',
  'Spinach Dip with Tortilla Chips',
  "Mac 'n Cheese Bites",
  'Bacon Wrapped Scallops',
  'Shrimp Skewers',
  'Beef Skewers',
  'Chicken Skewers',
]
const dinnerStarch = [
  'Fresh Garlic Mashed with Gravy',
  'Herb Roasted Potato',
  'Baked Potato with All the Fixings',
  'Rice Pilaf',
  'Scalloped Potatoes',
]
const dinnerVeg = ['Fresh Mixed', 'Glazed Fresh Carrots', 'Buttered Corn', 'California Mixed']
const dinnerDessert = [
  'Assorted Squares',
  'Assorted Cheesecakes and Pies',
  'Assorted Fruit Platter',
  'Pecan Pie',
  'Sticky Toffee Pudding',
]

export default {
  slug: 'lions-den',
  name: "The Lion's Den Pub",
  tagline: 'Catering & Special Events in Grande Prairie',
  cuisine: 'Pub Classics, Buffets, Carvery, Corporate Lunch',
  description:
    "When it comes to planning your party, it is imperative that everything is perfect. Food, linens, service and atmosphere are integral, so leave it to the professionals at The Lion's Den Pub — whether you're treating the office to a great lunch or planning the ULTIMATE PARTY.",
  logoUrl: '/images/lions-den-logo.avif',
  heroUrl: '/images/lions-den-hero.jpg',
  address: 'Grande Prairie, AB',
  contactName: 'Sandra',
  contactPhone: '(780) 512-1180',
  contactEmail: 'shaugland@persona.ca',
  minGuests: MIN,
  leadTimeHours: 48,
  taxPercent: 5,
  gratuityPercent: 0,
  deliveryFee: 0,
  pricingNote:
    'Prices are for drop-off / pick-up. Events requiring staff are subject to a 15% gratuity. Delivery charges depend on distance and are confirmed by the restaurant.',
  terms: [
    'Pricing and menu subject to change with 2 weeks notice.',
    '5% GST will be added to all invoices. Events requiring staff are subject to a 15% gratuity.',
    'Most menu items require a minimum of 20 guests.',
    'Delivery charges are based on distance and amount of product. Delivery outside Grande Prairie city limits is charged per km.',
    'A deposit may be required upon placing an order. Balance due in cash, cheque or major credit card within 48 hours of the end of the event.',
    'Orders may be cancelled without penalty by 8:00 a.m. two days prior to the event. Same-day cancellations are charged in full.',
  ].join('\n'),
  displayOrder: 3,
  categories: [
    {
      name: 'Breakfast',
      description: 'Cold and hot breakfast buffets. Minimum 20 guests.',
      items: [
        perPerson('Continental Breakfast', 16.95, {
          description: 'Assorted Danishes, Muffins, Croissants, Scones with fresh sliced Seasonal Fruits.',
          minQty: MIN,
          tags: 'Cold',
        }),
        perPerson('Healthy Breakfast', 18.95, {
          description: 'Low Fat Muffins, Individual Yogurts, Cottage Cheese with fresh sliced Seasonal Fruits.',
          minQty: MIN,
          tags: 'Cold',
        }),
        perPerson('Hot Breakfast – Option 1', 20.95, {
          description:
            'Buttermilk Pancakes or French Toast with Syrup and Butter, Scrambled Eggs, Bacon or Sausage, Hash Browns with fresh sliced Seasonal Fruit Platter.',
          minQty: MIN,
          tags: 'Hot',
          badge: 'Popular',
          optionGroups: [
            group('Pancakes or French Toast', 1, 1, ['Buttermilk Pancakes', 'French Toast']),
            group('Breakfast Meat', 1, 1, ['Bacon', 'Sausage']),
          ],
        }),
        perPerson('Hot Breakfast – Option 2', 18.95, {
          description: 'Scrambled Eggs, Hash Browns, choice of Bacon or Sausage and a fresh sliced Seasonal Fruit Platter.',
          minQty: MIN,
          tags: 'Hot',
          optionGroups: [group('Breakfast Meat', 1, 1, ['Bacon', 'Sausage'])],
        }),
      ],
    },
    {
      name: 'Breakfast Additions',
      description: 'Add to any breakfast buffet (priced per person).',
      items: [
        perPerson('Bacon or Sausage', 5.0, { optionGroups: [group('Choose', 1, 1, ['Bacon', 'Sausage'])] }),
        perPerson('Individual Yogurts', 3.5),
        perPerson('Granola or Cereal Bars', 3.5),
        perPerson('Bottled Water', 2.5),
        perPerson('Assorted Juices', 3.0),
        perPerson('Coffee / Tea Service', 3.0),
      ],
    },
    {
      name: 'Cold Lunch',
      description: 'Sandwich & wrap lunches. Minimum 20 guests.',
      items: [
        perPerson('Cold Lunch – Choice #1', 22.95, {
          description:
            'An assortment of finger Sandwiches and Wraps, Fresh seasonal Vegetable Platter with dip and assorted Dessert Squares.',
          minQty: MIN,
        }),
        perPerson('Cold Lunch – Choice #2', 24.95, {
          description:
            "An assortment of Deli Style Sandwiches and Wraps, Chef's Soup of the Day, Tossed Spring Mix Salad with 3 Dressings and a Dessert Square platter.",
          minQty: MIN,
        }),
        perPerson('Cold Lunch – Choice #3', 26.95, {
          description:
            "An assortment of Deli Style Sandwiches and Wraps, Chef's Soup of the Day, choice of 2 Salads and a Dessert Square Platter.",
          minQty: MIN,
          badge: 'Popular',
          optionGroups: [group('Choose 2 Salads', 2, 2, salads)],
        }),
        perPerson('Additional Salad', 6.5, {
          description: 'Add a salad to any lunch.',
          optionGroups: [group('Salad', 1, 1, salads)],
        }),
        perUnit('Just Sandwiches', 10.95, 'each', {
          description: 'Deli-style sandwiches made to order. Priced per sandwich.',
          optionGroups: [group('Fillings', 1, fillings.length, fillings), group('Breads', 1, breads.length, breads)],
        }),
      ],
    },
    {
      name: 'Hot Lunch',
      description: 'Served with tossed spring mix salad (3 dressings) and assorted dessert squares.',
      items: [
        perPerson('Hot Lunch – Select 1 Main Entrée', 26.95, {
          description: 'Select one main entrée. Served with tossed spring mix salad (3 dressings) and assorted dessert squares.',
          minQty: MIN,
          optionGroups: [
            group('Main Entrée', 1, 1, hotMains),
            {
              name: 'Extra Main Course (+$5.00 per person)',
              min: 0,
              max: 3,
              choices: hotMains.map((n) => ({ name: n, price: 5 })),
            },
          ],
        }),
        perPerson('Build Your Own Burger', 23.95, {
          description:
            'All burgers include lettuce, tomato, onion, pickle, relish, ketchup, mustard and mayo. Served with tossed spring mix salad (3 dressings) and dessert.',
          minQty: MIN,
          optionGroups: [
            group('Burger', 1, 1, [
              'Seasoned Grilled Chicken Breast Burgers (6oz)',
              'Grilled All Beef Burgers (6oz)',
              "Vegetarian Burgers (Money's)",
            ]),
            group('Dessert', 1, 1, ['Assorted Dessert Squares', 'No Bake Cheesecake', 'Apple Crisp']),
            {
              name: 'Burger Add-ons',
              min: 0,
              max: 3,
              choices: [
                { name: 'Cheese', price: 1.5 },
                { name: 'Sautéed Mushrooms', price: 1.5 },
                { name: 'Sautéed Onions', price: 1.5 },
              ],
            },
          ],
        }),
        quote('We Do Bar-B-Que', {
          description: 'Outdoor BBQ catering. Minimum 30 people. Pricing varies depending on selected menu choices.',
          minQty: 30,
          optionGroups: [group('BBQ Selections', 1, 5, ['6oz Top Sirloin', '6oz Chicken Breast', '6oz Burgers', 'Hot Dogs', 'Smokies'])],
        }),
      ],
    },
    {
      name: 'Appetizer Buffets',
      description: 'All appy buffets come with a fresh mixed vegetable platter and ranch dip.',
      items: [
        perPerson('Appetizer Buffet – Pick 3', 19.99, {
          description: 'Pick any 3 appetizers. Comes with fresh mixed vegetable platter and ranch dip.',
          minQty: MIN,
          optionGroups: [group('Choose 3 Appetizers', 3, 3, appetizers)],
        }),
        perPerson('Appetizer Buffet – Pick 5', 25.95, {
          description: 'Pick any 5 appetizers. Comes with fresh mixed vegetable platter and ranch dip.',
          minQty: MIN,
          badge: 'Best Value',
          optionGroups: [group('Choose 5 Appetizers', 5, 5, appetizers)],
        }),
      ],
    },
    {
      name: 'Dinner Buffet',
      description:
        'All dinners served with Tossed Spring Mixed Salad (3 dressings), Marinated Vegetable Salad, Dinner Rolls, butter patties and condiments.',
      items: [
        perPerson('Dinner Buffet', null, {
          description:
            'Choose your entrée, starch, vegetable and dessert. Served with Tossed Spring Mixed Salad (3 dressings), Marinated Vegetable Salad, Dinner Rolls, butter and condiments.',
          minQty: MIN,
          badge: 'Popular',
          variants: [
            { name: 'Sliced Roast Beef, Gravy, Horseradish, Mustard', price: 29.95 },
            { name: 'Rosemary Crusted Roast Turkey with Stuffing & Cranberry Sauce', price: 29.95 },
            { name: 'Mustard & Brown Sugar Glazed Ham', price: 29.95 },
            { name: '6oz Chicken Breast with Strawberry Salsa', price: 29.95 },
            { name: 'Ukrainian Platter – Cabbage Rolls, Perogies, Sausage', price: 29.95 },
            { name: 'Chicken Cordon Bleu', price: 32.95 },
            { name: '6oz Fillet of Bruschetta Salmon', price: 33.95 },
            { name: 'Prime Rib of Beef (8oz) with Au Jus & Yorkshire', price: 44.95 },
          ],
          optionGroups: [
            group('Starch', 1, 1, dinnerStarch),
            group('Vegetable', 1, 1, dinnerVeg),
            group('Dessert', 1, 1, dinnerDessert),
            {
              name: 'Additional Entrée (+$5.00 per person)',
              min: 0,
              max: 2,
              choices: [
                'Sliced Roast Beef',
                'Rosemary Crusted Roast Turkey',
                'Glazed Ham',
                'Chicken Breast with Strawberry Salsa',
                'Ukrainian Platter',
                'Chicken Cordon Bleu',
                'Bruschetta Salmon',
              ].map((n) => ({ name: n, price: 5 })),
            },
            {
              name: 'Additional Starch / Vegetable / Dessert (+$4.00 per person)',
              min: 0,
              max: 3,
              choices: [...dinnerStarch, ...dinnerVeg, ...dinnerDessert].map((n) => ({ name: n, price: 4 })),
            },
          ],
        }),
      ],
    },
    {
      name: 'Christmas Carvery',
      description: 'Christmas Menu 2025. Plus GST and gratuity.',
      items: [
        perPerson('Carvery Christmas', 59.95, {
          description:
            'Choose 2 specialty roasts, starch, vegetable, salad and dessert. Includes dinner rolls or Yorkshire pudding and tossed salad with dressings.',
          minQty: MIN,
          badge: 'Seasonal',
          optionGroups: [
            {
              name: 'Specialty Roasts (choose 2)',
              min: 2,
              max: 2,
              choices: [
                { name: 'Rosemary Crusted Roasted Whole Turkey' },
                { name: 'Mustard and Brown Sugar Glazed Ham' },
                { name: 'Slow Roasted Prime Rib', price: 5, description: 'Please specify preferred temperature in notes' },
                { name: 'Stuffed Pork Loin with Curried Apple Bread Stuffing' },
                { name: 'Grilled Chicken Breast with Strawberry Salsa' },
              ],
            },
            group('Starch', 1, 1, [
              'Roasted Garlic Mashed Potato',
              'Cajun Roasted Baby Red Potato',
              'Scalloped Potato',
              'Baked Potato with all the Fixings',
              'Vegetable Rice Pilaf',
              'Dirty Rice',
            ]),
            group('Vegetable', 1, 1, ['Fresh Mixed Vegetables', 'Glazed Fresh Carrots', 'Buttered Corn', 'California Mixed Vegetables']),
            group('Bread', 1, 1, ['Dinner Rolls', 'Yorkshire Pudding']),
            group('Salad', 1, 1, ['Marinated Vegetable Salad', 'Potato Salad', 'Pasta Salad']),
            group('Dessert', 1, 1, ['Assorted Christmas Squares', 'Assorted Cheesecakes and Pies', 'Sticky Toffee Pudding']),
          ],
        }),
      ],
    },
    {
      name: 'Beverage Services',
      description: 'All bars require a Bartender at $20.00 per hour.',
      items: [
        perPerson('Corkage Bar', 7.0, {
          description:
            'Assorted Soft Drinks, Bottled Water, Fruit Juices, Disposable Glassware, Straws, Napkins and Beverage Condiments (Limes, Lemons, Celery).',
        }),
        quote('Beer and Wine Bar', {
          description: 'An assortment of Red, White and Blush Wines, 4 types of Bottled Beer and 2 types of Coolers. Price varies with choice of products.',
        }),
        quote('Full Service Bar', {
          description:
            'Spirits (Rye, Vodka, White Rum, Spiced Rum, Scotch, Gin), Beer, Coolers, Red and White Wine. Cash Bar $7.50 per drink · Host Bar $7.00 per drink + 15% gratuity.',
          optionGroups: [group('Bar Type', 1, 1, ['Cash Bar ($7.50 per drink)', 'Host Bar ($7.00 per drink + 15% gratuity)'])],
        }),
      ],
    },
    {
      name: 'Event Staff',
      description: 'All prices are based on drop-off / pick-up. Events requiring staff are subject to a 15% gratuity.',
      items: [
        perUnit('Servers / Bussers', 20, 'hour', { description: 'Priced per staff hour.' }),
        perUnit('Bartender', 20, 'hour', { description: 'Required for all bars. Priced per hour.' }),
        perUnit('Chef / Carver', 30, 'hour', { description: 'Priced per hour.' }),
      ],
    },
    {
      name: 'Custom Menu',
      items: [
        quote('Custom Menu Request', {
          description:
            "At the Lion's Den Pub, we take great pride in helping you bring to life your vision of the perfect party. Tell us what you're thinking in the notes and we will work together to make it happen.",
        }),
      ],
    },
  ],
}
