import * as cloudinary from "cloudinary";

// Configure the package's v2 instance
cloudinary.v2.config({
  cloud_name: 'dmjzymy4d',
  api_key:'617899437782237',
  api_secret: 'PTWaf-p_mB04-ECevCYJ7fXQlW8',
});

// Export the whole module so code that expects `cloudinary.v2` works
export default cloudinary;
