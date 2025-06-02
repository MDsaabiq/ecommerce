const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: 'ecommerce',
            use_filename: true
        });
        return result.secure_url;
    } catch (error) {
        console.error('Error uploading to cloudinary:', error);
        throw new Error('Image upload failed');
    }
};

module.exports = { cloudinary, uploadImage }; 