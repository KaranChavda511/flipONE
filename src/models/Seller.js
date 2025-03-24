
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; //

const sellerSchema = mongoose.Schema(
  {
    licenseID: { type: String, required: true, unique: true },
    name: { type: String, required: true , unique: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: ['seller'],default: 'seller' }
    // isDisabled: { type: Boolean, default: false }
    
  },
  { timestamps: true }
);

// password hasshing before saving
sellerSchema.pre("save", async function (next) {
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
sellerSchema.methods.comparePassword  = async function (enteredPassword) {
  try{
  return await bcrypt.compare(enteredPassword, this.password);
} catch (error) {
  throw new Error('Password comparison failed');
}
};



const Seller = mongoose.model('Seller', sellerSchema);
export default Seller;
