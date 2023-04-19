const basePath = process.cwd();
const { NETWORK } = require(`${basePath}/constants/network.js`);
const fs = require("fs");
const sha1 = require('sha1')
const { createCanvas, loadImage } = require('canvas');
const { time } = require("console");
const { isArray } = require("util");
// const sha1 = require(`${basePath}/node_modules/sha1`);
// const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);
const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
  layerConfig,
  growEditionSizeTo
} = require(`${basePath}/src/config.js`);
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;
var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const DNA_DELIMITER = "~";
const HashlipsGiffer = require(`${basePath}/modules/HashlipsGiffer.js`);
let hashlipsGiffer = null;
let layers_order = [];
let layers_rand = [];
let layers_mutual = {};



const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/json`);
  fs.mkdirSync(`${buildDir}/images`);
  if (gif.export) {
    fs.mkdirSync(`${buildDir}/gifs`);
  }

  layerConfig.forEach(item => {
    layers_order.push({name: item.name, required: item.required});
    
    layers_mutual[item.name] = item.mutual;
    if(item.required == false) {
      layers_rand.push(item.name)
    }
  });
};


// Set Rarity with the 
const getRarityWeight = (idx, path, required) => {
  let layerName = path.split('/').pop();
  const currentLayer = layerConfig.filter(item => item.name == layerName)[0];
  const rarity = currentLayer.rarity;
  let weight = 1;
  if (Array.isArray(rarity)) {
    weight = rarity[idx]
  } else if (rarity === 'random') {
    weight = Math.floor(Math.random() * 100) + 1
  } else {
    weight = 1
  } 
  return weight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path, required) => {
  let files = fs.readdirSync(path);
  if (!required) {
    files.unshift('None.png');
  }
  return files.filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}/${i}`,
        weight: getRarityWeight(index, path, required),
      };
    });
};

const layersSetup = () => {
  const layers = layers_order.map((layer, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layer.name}`, layer.required),
    required: layer.required,
    name: layer.name,
    blend: "source-over",
    opacity: 1,
    bypassDNA: false,
  }));
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `${namePrefix} #${_edition}`,
    description: description,
    image: `${baseUri}/${_edition}.png`,
    dna: sha1(_dna),
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
    compiler: "Art Engine",
  };
  if (network == NETWORK.sol) {
    tempMetadata = {
      //Added metadata for solana
      name: tempMetadata.name,
      symbol: solanaMetadata.symbol,
      description: tempMetadata.description,
      //Added metadata for solana
      seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
      image: `image.png`,
      //Added metadata for solana
      external_url: solanaMetadata.external_url,
      edition: _edition,
      ...extraMetadata,
      attributes: tempMetadata.attributes,
      properties: {
        files: [
          {
            uri: "image.png",
            type: "image/png",
          },
        ],
        category: "image",
        creators: solanaMetadata.creators,
      },
    };
  }
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;

  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    let image;
    if(_layer.selectedElement.name == 'None') {
      image = await loadImage(`${basePath}/constants/none.png`);
    } else {
      image = await loadImage(`${_layer.selectedElement.path}`);
    }
    resolve({ layer: _layer, loadedImage: image });
  });
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  // console.log(_dna)
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const createDna = (_layers) => {
  // console.log(layers_mutual);
  // let appliedLayers = [];
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    // let test = [11,2,22,1].sort((a, b) => b - a)
    // layer.sort((a, b) => b - a)
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    
    // for (let i = 0; i < 100; i++) {
    //   console.log(Math.random());
    // }
    let random = Math.floor(Math.random() * totalWeight);

    // let appliedLayers = [];
    
    // console.log(random)
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        // appliedLayers.push(layer.name);
        // console.log(appliedLayers);
        // console.log(layers_mutual[layer.name]);
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}${
            layer.bypassDNA ? "?bypassDNA=true" : ""
          }`
        );
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};



const outputRealLayers = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    // let test = [11,2,22,1].sort((a, b) => b - a)
    // layer.sort((a, b) => b - a)
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    
    // for (let i = 0; i < 100; i++) {
    //   console.log(Math.random());
    // }
    let random = Math.floor(Math.random() * totalWeight);

    // let appliedLayers = [];
    
    // console.log(random)
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        // appliedLayers.push(layer.name);
        // console.log(appliedLayers);
        // console.log(layers_mutual[layer.name]);
        return randNum.push({
          name: layer.name, 
          item:`${layer.elements[i].id}:${layer.elements[i].filename}${
            layer.bypassDNA ? "?bypassDNA=true" : ""
          }`
        });
      }
    }
  });
  return randNum;
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}
// shffule the removing layers
const array_shuffle = (arr) => {
  arr.sort(() => Math.random() - 0.5);
}


// Remove the not required layer randomly
const randomeLayer = (layers) => {
  // console.log(layers);
  let randLayers = [];
  layerConfig.forEach(item => {
    if(item.required == false) {
      randLayers.push(item.name);
    }
  });


  let randLayersResults = [];
  randLayers.forEach(layer => {
    if (Math.random() < 0.5) {
      randLayersResults.push(layer);
    }
  });
  // let random = Math.floor(Math.random() * totalWeight);
  // // console.log(random)
  // for (var i = 0; i < randLayers.length; i++) {
  //   // subtract the current weight from the random weight until we reach a sub zero value.
  //   // random -= randLayers[i].rarity[0];
  //   if(Array.isArray(randLayers[i].rarity[0])) {
  //     if (random / randLayers.length > randLayers[i].rarity[0]) {
  //       randLayersResults.push(randLayers[i]);
  //     }
  //   } else {
  //     if (random / randLayers.length > Math.floor(Math.random() * 100) + 1) {
  //       randLayersResults.push(randLayers[i]);
  //     }
  //   }
  // }
  
  return layers.filter(layer => randLayersResults.indexOf(layer.name) == -1);
}


// const randomeLayer1 = (layers) => {
//   let randLayers = [];
//   layerConfig.forEach(item => {
//     if(item.required == false) {
//       randLayers.push(item.name);
//     }
//   });

//   let randLayersResults = [];
//   randLayers.forEach(layer => {
//     if (Math.random() < 0.5) {
//       randLayersResults.push(layer);
//     }
//   });
//   return layers.filter(layer => randLayersResults.indexOf(layer.name) == -1);
// }

// The rule can't be used together in layers
const rule = (layers) => {
  let remove_order = [];

  layers.forEach(layer => {
    remove_order.push(layer.name)
  });

  array_shuffle(remove_order);
  let removed_layer = [];
  let real_layer = [];
  let resLayer = layers;
  
  remove_order.forEach((item) => {
    if (real_layer.some(r=> layers_mutual[item].includes(r)) && removed_layer.indexOf(item) == -1) {
      removed_layer.push(item);
    } else if (removed_layer.some(r=> layers_mutual[item].includes(r)) && removed_layer.indexOf(item) == -1) {
      removed_layer.push(item);
    } else if (layers_mutual[item] && layers_mutual[item].length > 0) {
      if(real_layer.indexOf(item) == -1 && removed_layer.indexOf(item) == -1) {
        real_layer.push(item);
      }
      layers_mutual[item].forEach((val) => {
        if (removed_layer.indexOf(val) == -1) {
          removed_layer.push(val);
        }
      })
    } else {
      if(real_layer.indexOf(item) == -1 && removed_layer.indexOf(item) == -1) {
        real_layer.push(item);
      }
    }
  })
  resLayer = resLayer.filter(item => removed_layer.indexOf(item.name) == -1);
  return resLayer;
}

// The rule can't be used together in layers
const rule1 = (layers) => {
  let remove_order = [];
  layers.forEach(layer => {
    remove_order.push(layer)
  });


  array_shuffle(remove_order);
  let removed_layer = [];
  let real_layer = [];
  let resLayer = layers;
  
  remove_order.forEach((item) => {
    if (real_layer.some(r=> layers_mutual[item.name].includes(r)) && removed_layer.indexOf(item.name) == -1) {
      removed_layer.push(item.name);
    } else if (removed_layer.some(r=> layers_mutual[item.name].includes(r)) && removed_layer.indexOf(item.name) == -1) {
      removed_layer.push(item.name);
    } else if (layers_mutual[item.name] && layers_mutual[item.name].length > 0) {
      if(real_layer.indexOf(item.name) == -1 && removed_layer.indexOf(item.name) == -1 && !item.item.includes('None.png')) {
        real_layer.push(item.name);
        layers_mutual[item.name].forEach((val) => {
          if (removed_layer.indexOf(val) == -1) {
            removed_layer.push(val);
          }
        })
      } else if(removed_layer.indexOf(item.name)){
        removed_layer.push(item.name);
      }
    } else {
      if(real_layer.indexOf(item.name) == -1 && removed_layer.indexOf(item.name) == -1 && !item.item.includes('None.png')) {
        real_layer.push(item.name);
      } else if(removed_layer.indexOf(item.name)) {
        removed_layer.push(item.name);
      }
    }
  })

  
  // console.log(resLayer);
  // console.log(removed_layer);
  // removed_layer.forEach(element => {
  //   console.log(layers_mutual[element]);
  //   if(layers_mutual[element] !== []) {
  //     layers_mutual[element].forEach((item) => {
  //       resLayer.forEach((l) => {
  //         if(l.name == item && l.item == '0:None.png') {

  //         }
  //       })
  //     })
  //   } 
  // });
  resLayer = resLayer.filter(item => removed_layer.indexOf(item.name) == -1);
  return resLayer;
}


const startCreating = async () => {
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for ( let i = network == NETWORK.sol ? 0 : 1; i <= growEditionSizeTo; i++ ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  const layers = layersSetup();
  while ( editionCount <= growEditionSizeTo ) {

    let outputlayers = outputRealLayers(layers);
    // console.log('outputlayers', outputlayers);
    // console.log('outputlayers', outputlayers.length);

    // let randLyers = randomeLayer(outputlayers);
    // console.log('randLyers', randLyers);
    // console.log('randLyers', randLyers.length);
    let finalLayers = rule1(outputlayers);
    let newDnaArray = [];
    let newLayerArray = [];

    console.log('--------------------------------------------')
    // console.log(outputlayers);
    // console.log(outputlayers.length);
    finalLayers.forEach((finalLayer) => {
      newDnaArray.push(finalLayer.item);
      newLayerArray.push(finalLayer.name);
      // console.log(finalLayer.name);
    })

    if(newLayerArray.indexOf('Masks') == -1 && newLayerArray.indexOf('Mouths') == -1) {
      // console.log('Both masks and mouths are not applied at all!');
      continue;
    }

    // console.log(newLayerArray);
    if(newLayerArray.indexOf('Shirts') !== -1 && newLayerArray.indexOf(('Jackets')) !== -1) {
      console.log('Jackets and Shirts were applied once', newLayerArray);
    }
    if(newLayerArray.indexOf('Jerseys') !== -1 && newLayerArray.indexOf(('Jackets')) !== -1) {
      console.log('Jerseys and Jackets were applied once', newLayerArray);
    }
    if(newLayerArray.indexOf('Mouths') !== -1) {
      console.log('Mouths layer was applied')
    }
    if(newLayerArray.indexOf(('Masks')) !== -1) {
      console.log('Masks layer was applied')
    }
    console.log('--------------------------------------------')

    let newDna = newDnaArray.join(DNA_DELIMITER);
    // console.log(newDna);

    customLayers = [];
    layers.forEach((layer) => {
      if(newLayerArray.indexOf(layer.name) !== -1) {    
        customLayers.push(layer);
      }
    })
    // console.log('custom_layers', customLayers);

    // let randLyers = randomeLayer(layers);
    // let custom_layers = rule(randLyers);
    // console.log(custom_layers);
    // let newDna = createDna(custom_layers);
    // console.log(newDna);
    // Hair/Mohawk.pngMohawk.png can not be used
    let HatsElements = [];
    let WigsElements = [];
    HatsElements = fs.readdirSync(`${basePath}/layers/Hats`);
    WigsElements = fs.readdirSync(`${basePath}/layers/Wigs`);
    let exist = false;

    if(newDna.indexOf('Mohawk.png') !== -1) {
      HatsElements.forEach((filename) => {
        if(newDna.indexOf(filename) !== -1 ) {
          exist = true;
        }
      })

      WigsElements.forEach((filename) => {
        if(newDna.indexOf(filename) !== -1) {
          exist = true;
        }
      })
    }
    
    if (exist) {
      continue;
    }

    if (isDnaUnique(dnaList, newDna)) {
      let results = constructLayerToDna(newDna, customLayers);
      let loadedElements = [];
      results.forEach((layer) => {
        loadedElements.push(loadLayerImg(layer));
      });

      await Promise.all(loadedElements).then((renderObjectArray) => {
        debugLogs ? console.log("Clearing canvas") : null;
        ctx.clearRect(0, 0, format.width, format.height);
        if (gif.export) {
          hashlipsGiffer = new HashlipsGiffer(
            canvas,
            ctx,
            `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
            gif.repeat,
            gif.quality,
            gif.delay
          );
          hashlipsGiffer.start();
        }
        if (background.generate) {
          drawBackground();
        }
        renderObjectArray.forEach((renderObject, index) => {
          drawElement(
            renderObject,
            index,
            layers_order.length
          );
          if (gif.export) {
            hashlipsGiffer.add();
          }
        });
        if (gif.export) {
          hashlipsGiffer.stop();
        }
        debugLogs
          ? console.log("Editions left to create: ", abstractedIndexes)
          : null;
        saveImage(abstractedIndexes[0]);
        addMetadata(newDna, abstractedIndexes[0]);
        saveMetaDataSingleFile(abstractedIndexes[0]);
        console.log(
          `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
            newDna
          )}`
        );
      });
      dnaList.add(filterDNAOptions(newDna));
      editionCount++;
      abstractedIndexes.shift();
    } else {
      console.log("DNA exists!");
      failedCount++;
      if (failedCount >= uniqueDnaTorrance) {
        console.log(
          `You need more layers or elements to grow your edition to ${growEditionSizeTo} artworks!`
        );
        process.exit();
      }
    }
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
