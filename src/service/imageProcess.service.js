const Jimp = require("jimp");
const path = require("path");
const fs = require("fs").promises;
const fileStream = require("fs");
const AdmZip = require("adm-zip");
const { generateRandomString } = require("random-string-generator-library");

//algorithm two

const createCollage = async (req, res) => {
  const uniqueCode = await generateUniqueId();
  try {
    //check if images are uploaded
    if (!req.files || req.files.length !== 9) {
      return res.status(400).json({
        success: false,
        body: { message: "Please upload exactly 9 images (1 main image and 8 side images)" },
      });
    }

    const [mainImage, ...sideImages] = req.files;

    //generate random code for file accessing

    console.log(uniqueCode);

    // Crop Main Image into 4 and save as individual images (topLeft, topRight, bottomLeft, bottomRight) store in array
    await cropImage(mainImage.path, uniqueCode);

    //resize side images
    for (i = 0; i < sideImages.length; i++) {
      let image = await Jimp.read(sideImages[i].path);
      resizeImage(image);

      image.write(`process${uniqueCode}/side_image(${i + 1}).png`);
    }

    let blankImage = new Jimp(1152, 2048, 0x00000000);
    headerImage = await Jimp.read(`process${uniqueCode}/side_image(1).png`);
    middleImage = await Jimp.read(`crop${uniqueCode}/firstQuadrant.png`);
    bottomImage = await Jimp.read(`process${uniqueCode}/side_image(2).png`);

    const firstImage = await blitImage(
      blankImage,
      headerImage,
      middleImage,
      bottomImage
    );

    firstImage.write(`results${uniqueCode}/firstImage.png`);

    //second Image

    blankImage = new Jimp(1152, 2048, 0x00000000);
    headerImage = await Jimp.read(`process${uniqueCode}/side_image(3).png`);
    middleImage = await Jimp.read(`crop${uniqueCode}/secondQuadrant.png`);
    bottomImage = await Jimp.read(`process${uniqueCode}/side_image(4).png`);

    const secondImage = await blitImage(
      blankImage,
      headerImage,
      middleImage,
      bottomImage
    );

    secondImage.write(`results${uniqueCode}/secondImage.png`);

    //third Image

    blankImage = new Jimp(1152, 2048, 0x00000000);
    headerImage = await Jimp.read(`process${uniqueCode}/side_image(5).png`);
    middleImage = await Jimp.read(`crop${uniqueCode}/thirdQuadrant.png`);
    bottomImage = await Jimp.read(`process${uniqueCode}/side_image(6).png`);

    const thirdImage = await blitImage(
      blankImage,
      headerImage,
      middleImage,
      bottomImage
    );

    thirdImage.write(`results${uniqueCode}/thirdImage.png`);

    //fourth Image

    blankImage = new Jimp(1152, 2048, 0x00000000);
    headerImage = await Jimp.read(`process${uniqueCode}/side_image(7).png`);
    middleImage = await Jimp.read(`crop${uniqueCode}/fourthQuadrant.png`);
    bottomImage = await Jimp.read(`process${uniqueCode}/side_image(8).png`);

    const fourthImage = await blitImage(
      blankImage,
      headerImage,
      middleImage,
      bottomImage
    );

    fourthImage.write(`results${uniqueCode}/fourthImage.png`);

    const fifthImage = await Jimp.read(mainImage.path);

    fifthImage.write(`results${uniqueCode}/mainImage.png`);

    console.log("Image Processing Completed");

    const imagePath = path.join(__dirname, `../../results${uniqueCode}`);

    const zipFilePath = await zipFiles(imagePath, uniqueCode);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=images.zip"); // Suggest download

    // console.log(zipBuffer);

    console.log(zipFilePath);
    const zipPath = path.join(__dirname, `../../${zipFilePath}`);
    res.status(201).sendFile(zipPath);

    clearFolders(uniqueCode);
  } catch (err) {
    clearFolders(uniqueCode);
    return res.status(500).json({
      success: false,
      body: {
        message: `Unable to create collage! ${err}`,
      },
    });
  }
};

const cropImage = async (mainImage, uniqueCode) => {
  let imageToCrop = await Jimp.read(mainImage);

  
  //   x- horizontal start point
  //   y- vertical start point
  //   width - length
  //   height - height

  height = imageToCrop.bitmap.height;
  width = imageToCrop.bitmap.width;

  halfHeight = Math.floor(height / 2);
  halfWidth = Math.floor(width / 2);

  const firstQuadrant = imageToCrop;

  resizeX = 1152;
  resizeY = 648;

  firstQuadrant
    .crop(0, 0, halfWidth, halfHeight)
    .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
    .write(`crop${uniqueCode}/firstQuadrant.png`);

  secondQuadrant = await Jimp.read(mainImage);

  secondQuadrant
    .crop(halfWidth, 0, halfWidth - 2, halfHeight - 2)
    .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
    .write(`crop${uniqueCode}/secondQuadrant.png`);

  thirdQuadrant = await Jimp.read(mainImage);

  thirdQuadrant
    .crop(0, halfHeight, halfWidth - 2, halfHeight - 2)
    .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
    .write(`crop${uniqueCode}/thirdQuadrant.png`);

  fourthQuadrant = await Jimp.read(mainImage);

  fourthQuadrant
    .crop(halfWidth, halfHeight, halfWidth - 2, halfHeight - 2)
    .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
    .write(`crop${uniqueCode}/fourthQuadrant.png`);

  console.log("Crop Image processing done");
};

// const cropImage = async (mainImage, uniqueCode) => {
//   let imageToCrop = await Jimp.read(mainImage);
//   imageToCrop = await imageToCrop.contain(1152*2, 648*2)
//   //   x- horizontal start point
//   //   y- vertical start point
//   //   width - length
//   //   height - height

//   height = imageToCrop.bitmap.height;
//   width = imageToCrop.bitmap.width;

//   halfHeight = Math.floor(height / 2);
//   halfWidth = Math.floor(width / 2);

//   const firstQuadrant = imageToCrop;

//   resizeX = 1152;
//   resizeY = 648;

//   firstQuadrant
//     .crop(0, 0, halfWidth, halfHeight)
//     .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
//     .write(`crop${uniqueCode}/firstQuadrant.png`);

//   secondQuadrant = await Jimp.read(mainImage);

//   secondQuadrant.contain(1152*2, 648*2)
//     .crop(halfWidth, 0, halfWidth - 2, halfHeight - 2)
//     .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
//     .write(`crop${uniqueCode}/secondQuadrant.png`);

//   thirdQuadrant = await Jimp.read(mainImage);

//   thirdQuadrant.contain(1152*2, 648*2)
//     .crop(0, halfHeight, halfWidth - 2, halfHeight - 2)
//     .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
//     .write(`crop${uniqueCode}/thirdQuadrant.png`);

//   fourthQuadrant = await Jimp.read(mainImage);

//   fourthQuadrant.contain(1152*2, 648*2)
//     .crop(halfWidth, halfHeight, halfWidth - 2, halfHeight - 2)
//     .resize(resizeX, resizeY, Jimp.RESIZE_CONTAIN)
//     .write(`crop${uniqueCode}/fourthQuadrant.png`);

//   console.log("Crop Image processing done");
// };

const resizeImage = async (image) => {
  resizeX = 1152;
  resizeY = 700;

  height = image.bitmap.height
  width = image.bitmap.width

  if((width/height)>0){
    image.cover(resizeX, resizeY).resize(resizeX, resizeY, Jimp.RESIZE_BILINEAR);
  }
  else{
    image.resize(resizeX, resizeY, Jimp.RESIZE_BILINEAR);
  }


  return image;
};

const blitImage = async (
  originalImage,
  headerImage,
  middleImage,
  bottomImage
) => {
  console.log("Starting Blit Processing");
  originalImage.blit(headerImage, 0, 0);
  originalImage.blit(middleImage, 0, 700);
  originalImage.blit(bottomImage, 0, 1348);
  return originalImage;
};

const clearFolders = async (uniqueCode) => {
  try{if (fileStream.existsSync(`process${uniqueCode}`)) {
    await fs.rm(`process${uniqueCode}`, { recursive: true });
  }

  if (fileStream.existsSync(`zip${uniqueCode}`)) {
    const files = await fs.readdir(`zip${uniqueCode}`);
    await fs.unlink(`zip${uniqueCode}/images.zip`);
  }

  if (fileStream.existsSync(`crop${uniqueCode}`)) {
    await fs.rm(`crop${uniqueCode}`, { recursive: true });
  }

  if (fileStream.existsSync(`results${uniqueCode}`)) {
    await fs.rm(`results${uniqueCode}`, { recursive: true });
  }
}catch(err){
    console.log(err)
    // return err;
  }
};

function isFileSync(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (error) {
    // Handle potential errors during stat
    return false;
  }
}

const zipFiles = async (imagePath, uniqueCode) => {
  const zip = new AdmZip();
  const imageFiles = await fs.readdir(imagePath);

  for (const fileName of imageFiles) {
    const filePath = path.join(imagePath, fileName);
    zip.addFile(fileName, await fs.readFile(filePath)); // Add each image to the zip
  }

  // Generate a temporary filename (optional)
  const tempFilename = `zip${uniqueCode}/images.zip`; // Replace with your logic

  if (!fileStream.existsSync(tempFilename)) {
    fs.mkdir(`zip${uniqueCode}`);
    await fs.writeFile(tempFilename, zip.toBuffer());
  }
  // Write the zip to a temporary file

  console.log("Zipped file successfully created");

  return tempFilename; // Return the temporary file path
};

const generateUniqueId = async () => {
  code = generateRandomString(12);
  return code;
};

module.exports = { createCollage };
