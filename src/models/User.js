
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, immutable: true },
    password: { type: String, required: true },
    address: {type: String},
    mobile: {type: String},
    profilePic: { type: String },
    isActive: { type: Boolean, default: true },
    // isDisabled: { type: Boolean, default: false }
    role: { type: String,enum: ['user'], default: 'user' }
  },
  { timestamps: true }
);

// password hasshing before saving
userSchema.pre("save", async function (next) {
  try{
  if (!this.isModified('password')) return next();

  // this.password = bcrypt.hash(this.password, 10);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
} catch (error) {
  next(error);
}
});
userSchema.methods.comparePassword  = async function (enteredPassword) {
  try{
  return await bcrypt.compare(enteredPassword, this.password);
} catch (error) {
  throw new Error('Password comparison failed');
}
};


const User = mongoose.model('User', userSchema);
export default User;
