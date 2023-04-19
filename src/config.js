const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);
const { NETWORK } = require(`${basePath}/constants/network.js`);

const network = NETWORK.eth;

// General metadata for Ethereum
const namePrefix = "Your Collection";
const description = "Remember to replace this description";
const baseUri = "ipfs://NewUriToReplace";

const solanaMetadata = {
  symbol: "YC",
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://www.youtube.com/c/hashlipsnft",
  creators: [
    {
      address: "7fXNuer5sbZtaTEPhtJ5g5gNtuyRoKkvxdjEjEnPN4mC",
      share: 100,
    },
  ],
};

const layerConfig = [
  {
    id: 1,
    name: 'Backgrounds',
    mutual: [],
    required: true,
    rarity: [100, 90, 30, 20, 40, 50, 50, 70, 20, 30],
  },
  {
    id: 2,
    name: 'Bodies',
    mutual: [],
    required: true,
    rarity: 'None',
  },
  {
    id: 3,
    name: 'Horns',
    mutual: [],
    required: true,
    rarity: 'None',
  },
  {
    id: 4,
    name: 'Tattoos',
    mutual: ['Sweaters', 'ShirtsNoJacket', 'Jackets'],
    required: false,
    rarity: [80, 100, 90],
  },
  {
    id: 5,
    name: 'Shirts',
    mutual: [],
    required: false,
    rarity: 'None',
  },
  {
    id: 6,
    name: 'ShirtsNoJacket',
    mutual: [],
    required: false,
    rarity: [20, 90, 30, 20, 40],
  },
  {
    id: 7,
    name: 'Sweaters',
    mutual: ['Shirts', 'ShirtsNoJacket'],
    required: false,
    rarity: [50, 90, 30, 20, 40, 50, 50, 70],
  },
  {
    id: 8,
    name: 'Jerseys',
    mutual: ['Shirts', 'ShirtsNoJacket', 'Sweaters'],
    required: false,
    rarity: [20, 90, 30, 20, 40, 50, 50, 70, 20, 30],
  },
  {
    id: 9,
    name: 'Suspenders',
    mutual: ['Jackets', 'Sweaters', 'ShirtsNoJacket'],
    required: false,
    rarity: [40, 90, 30, 20, 40],
  },
  {
    id: 10,
    name: 'Necklaces',
    mutual: ['ShirtsNoJacket', 'Sweaters'],
    required: false,
    rarity: 'random',
  },
  {
    id: 11,
    name: 'Jackets',
    mutual: ['ShirtsNoJacket', 'Sweaters'],
    required: false,
    rarity: [90, 90, 30, 20, 40, 50, 50, 70],
  },
  {
    id: 12,
    name: 'Earrings',
    mutual: [],
    required: false,
    rarity: [40, 90, 30],
  },
  {
    id: 13,
    name: 'Eyes',
    mutual: [],
    required: true,
    rarity: 'None',
  },
  {
    id: 14,
    name: 'Eyeballs',
    mutual: [],
    required: false,
    rarity: [60, 90, 30, 20],
  },
  {
    id: 15,
    name: 'Eyebrows',
    mutual: [],
    required: true,
    rarity: 'None',
  },
  {
    id: 16,
    name: 'Glasses',
    mutual: [],
    required: false,
    rarity: [60, 90, 30, 20, 40, 50, 50, 70, 20, 30],
  },
  {
    id: 17,
    name: 'Hair',
    mutual: [],
    required: true,
    rarity: 'None',
  },
  {
    id: 18,
    name: 'Wigs',
    mutual: [],
    required: false,
    rarity: [20, 90, 30, 20, 40, 50],
  },
  {
    id: 19,
    name: 'Hats',
    mutual: [],
    required: false,
    rarity: [50, 90, 30, 20, 40, 50, 50, 70, 20, 30, 30, 30, 10, 40, 50, 50],
  },
  {
    id: 20,
    name: 'Horniments',
    mutual: [],
    required: false,
    rarity: [40, 90, 30, 20],
  },
  {
    id: 21,
    name: 'Mustache',
    mutual: [],
    required: false,
    rarity: 'None',
  },
  {
    id: 22,
    name: 'Mouths',
    mutual: [],
    required: true,
    rarity: 'None',
  },
  {
    id: 23,
    name: 'Masks',
    mutual: ['Mouths', 'Hats', 'Wigs', 'Glasses'],
    required: false,
    rarity: [10, 90, 30, 20, 40, 50]
  }
]

const growEditionSizeTo = 150;
const shuffleLayerConfigurations = false;
const debugLogs = false;

const format = {
  width: 512,
  height: 512,
  smoothing: false,
};

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 2 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
};

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
};

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
  preview_gif,
  layerConfig,
  growEditionSizeTo
};
