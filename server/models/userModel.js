import mongoose  from "mongoose";
import bcrypt from 'bcryptjs'
import validator from 'validator';

const userSchema = new mongoose.Schema({
    name: {type:String, required:true},
    email : {type:String, required:true , validate:[validator.isEmail,'Invalid email format'], unique:true},
    password: {type:String, required:true},
    // ADDED: unique index here for faster login/profile lookup
    username :{type:String , required:true, unique: true}, 
    profilePhoto: { type: String, required:false },
    points:{type:Number,default:10},
    location: {
      type: { type: String, enum: ['Point'], required:false },
      coordinates: { type: [Number], required: false } 
  }
})

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ... schema definition ...
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;