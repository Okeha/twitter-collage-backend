const Jimp = require("jimp");
const path = require("path");
const fs = require("fs").promises;
const fileStream = require("fs");
const AdmZip = require("adm-zip");

//algorithm two

const createCollage = async (req, res) => {
  try {
    //check if images are uploaded
    if (!req.files || req.files.length !== 9) {
      return res.status(400).json({ error: "Please upload exactly 9 images" });
    }

    const [mainImage, ...sideImages] = req.files;

    // Crop Main Image into 4 and save as individual images (topLeft, topRight, bottomLeft, bottomRight) store in array
    await cropImage(mainImage.path, res);

    //resize side images
    for (i = 0; i < sideImages.length; i++) {
      let image = await Jimp.read(sideImages[i].path);
      resizeImage(image);

      image.write(`process/side_image(${i + 1}).png`);
    }

    let blankImage = new Jimp(1152, 2048, 0x00000000);
    headerImage = await Jimp.read("process/side_image(1).png");
    middleImage = await Jimp.read("crop/firstQuadrant.png");
    bottomImage = await Jimp.read("process/side_image(2).png");

    const firstImage = await blitImage(
      blankImage,
      headerImage,
      middleImage,
      bottomImage
    );

    firstImage.write("results/firstImage.png");

    //second Image

    blankImage = new Jimp(1152, 2048, 0x00000000);
    headerImage = await Jimp.read("process/side_image(3).png");
    middleImage = await Jimp.read("crop/secondQuadrant.png");
    bottomImage = await Jimp.read("process/side_image(4).png");

    const secondImage = await blitImage(
      blankImage,
      headerImage,
      middleImage,
      bottomImage
    );

    secondImage.write("results/secondImage.png");

    //third Image

    blankImage = new Jimp(1152, 2048, 0x00000000);
    headerImage = await Jimp.read("process/side_image(5).png");
    middleImage = await Jimp.read("crop/thirdQuadrant.png");
    bottomImage = await Jimp.read("process/side_image(6).png");

    const thirdImage = await blitImage(
      blankImage,
      headerImage,
      middleImage,
      bottomImage
    );

    thirdImage.write("results/thirdImage.png");

    //fourth Image

    blankImage = new Jimp(1152, 2048, 0x00000000);
    headerImage = await Jimp.read("process/side_image(7).png");
    middleImage = await Jimp.read("crop/fourthQuadrant.png");
    bottomImage = await Jimp.read("process/side_image(8).png");

    const fourthImage = await blitImage(
      blankImage,
      headerImage,
      middleImage,
      bottomImage
    );

    fourthImage.write("results/fourthImage.png");

    console.log("Image Processing Completed");

    const imagePath = path.join(__dirname, "../../results");

    const zipBuffer = await zipFiles(imagePath);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=images.zip"); // Suggest download

    // console.log(zipBuffer);

    clearFolders(res);

    return res.status(201).send(zipBuffer);
  } catch (err) {
    clearFolders(res);
    return res.status(500).json({
      success: false,
      body: {
        message: `Unable to create collage! ${err}`,
      },
    });
  }
};

const cropImage = async (mainImage) => {
  try {
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
      .write("crop/firstQuadrant.png");

    secondQuadrant = await Jimp.read(mainImage);

    secondQuadrant
      .crop(halfWidth, 0, halfWidth - 2, halfHeight - 2)
      .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
      .write("crop/secondQuadrant.png");

    thirdQuadrant = await Jimp.read(mainImage);

    thirdQuadrant
      .crop(0, halfHeight, halfWidth - 2, halfHeight - 2)
      .resize(resizeX, resizeY, Jimp.RESIZE_BEZIER)
      .write("crop/thirdQuadrant.png");

    fourthQuadrant = await Jimp.read(mainImage);

    fourthQuadrant
      .crop(halfWidth, halfHeight, halfWidth - 2, halfHeight - 2)
      .resize(resizeX, resizeY, Jimp.RESIZE_CONTAIN)
      .write("crop/fourthQuadrant.png");

    console.log("Crop Image processing done");
  } catch (err) {
    return res.status(500).json({
      success: false,
      body: {
        message: `Unable to process image! ${err}`,
      },
    });
  }
};

const resizeImage = async (image) => {
  resizeX = 1152;
  resizeY = 700;
  image.resize(resizeX, resizeY, Jimp.RESIZE_BEZIER);

  return image;
};

const blitImage = async (
  originalImage,
  headerImage,
  middleImage,
  bottomImage
) => {
  originalImage.blit(headerImage, 0, 0);
  originalImage.blit(middleImage, 0, 700);
  originalImage.blit(bottomImage, 0, 1348);
  return originalImage;
};

const clearFolders = async (res) => {
  try {
    await fs.rm("process", { recursive: true });
    await fs.rm("crop", { recursive: true });

    // await fs.rm("crop", { recursive: true });
    const files = await fs.readdir("uploads"); // List files in the directory

    for (const file of files) {
      const filePath = path.join("uploads/", file);
      await fs.unlink(filePath); // Delete each file
    }

    await fs.rm("results", { recursive: true });
  } catch (err) {
    return res.status(500).json({
      success: false,
      body: {
        message: `${err}`,
      },
    });
  }
};

const zipFiles = async (imagePath) => {
  const zip = new AdmZip();
  const imageFiles = await fs.readdir(imagePath);

  for (const fileName of imageFiles) {
    const filePath = path.join(imagePath, fileName);
    zip.addFile(fileName, await fs.readFile(filePath)); // Add each image to the zip
  }

  return zip.toBuffer();
};

module.exports = { createCollage };
